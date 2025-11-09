import { Component, AfterViewInit, ViewChild, ViewContainerRef, ComponentRef, OnInit, OnDestroy, Inject, PLATFORM_ID, Input, ElementRef, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { LucideIconsModule } from '../lucide-icons.module';
import { DiagramEditorComponent } from '../diagram-editor/diagram-editor.component';
import { DataService, UserResponse } from '../../services/data.service';
import { User, UserService } from '../../services/user.service';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { StoreComponent } from "../store/store.component";
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { DialogFinishedGamephaseComponent } from "./dialog-finished-gamephase/dialog-finished-gamephase.component";
import { CarouselComponent } from '../utils/carousel/carousel.component';
import { HeaderComponent } from '../header/header.component';
import { PhaseService, Phase, PHASE_TYPES, PhaseType } from '../../services/phase.service';
import { AdviseModalComponent } from '../utils/advise-modal/advise-modal.component';
import { TipService } from '../../services/tip.service';
import { AppContextService } from '../../services/app-context.service';
// ✅ Import do PhaseUserService
import { PhaseUserService } from '../../services/phase-user.service';
import { PhaseUser } from '../../services/game-map.service';
import { FileUrlBuilder } from '../../config/files.config';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'game-phase',
  standalone: true,
  imports: [
    LucideIconsModule,
    DiagramEditorComponent,
    CommonModule,
    StoreComponent,
    HttpClientModule,
    RouterModule,
    ConfirmDialogComponent,
    DialogFinishedGamephaseComponent,
    CarouselComponent,
    HeaderComponent,
    AdviseModalComponent],
  templateUrl: './game-phase.component.html',
  styleUrl: './game-phase.component.css'
})

export class GamePhaseComponent implements OnInit, OnDestroy {
  isOpen = false;
  currentTime: string = '00:00:00';
  watchTime: string = '';
  watchCount: number = 0;
  private timerInterval: any;
  private watchTimerInterval: any;
  // ✅ Timer para salvamento automático
  private autoSaveInterval: any;
  private timerPaused: boolean = false;
  private pausedTime: number = 0;
  private watchStartTime: number = 0;
  private watchDuration: number = 59 * 1000; // 59 seconds in milliseconds
  private storeSubscription?: Subscription;
  private inventorySubscription?: Subscription;
  private startTime: number = 0;
  visibleAdviseTypePhase: boolean = true;

  @Input() phaseId!: number;
  phaseUser?: PhaseUser;
  phase?: Phase;

  // ✅ Estado do salvamento automático
  isSaving: boolean = false;
  lastSaveTime: Date | null = null;
  autoSaveEnabled: boolean = true;

  // ✅ Disponibilize o mapa para o template
  phaseTypes = PHASE_TYPES;

  tips: string[] = [];

  @ViewChild(HeaderComponent) headerComponent!: HeaderComponent;
  
  @ViewChild(StoreComponent) store!: StoreComponent;
  private userDataSubscription?: Subscription;

  @ViewChild('speechBubble', { read: ElementRef }) speechBubble?: ElementRef;

  @ViewChild('dialogContainer', { read: ViewContainerRef, static: true })
  dialogContainer!: ViewContainerRef;

  @ViewChild('diagramEditor') diagramEditorComponentRef!: DiagramEditorComponent;

  accuracy: number = 0;

  confirmDialogVisible: boolean = false;
  confirmDialogTitle: string = '';
  confirmDialogMessage: string = '';
  private confirmCallback: (() => void) | null = null;

  // Variável para controlar a visibilidade do diálogo de finalização
  finishedGamePhaseVisible: boolean = false;

  // User data
  userData?: User;
  userLoadError: string = '';

  // Save disabled
  saveDisabled: boolean = false;

  activeSlideIndex = 0;
  private swiper?: Swiper;

  isSpeaking = false;
  activeSpeechIndex = 0;
  characterState = 'hidden';

  checkDiagramLeft: number = 0; // Número de verificações restantes

  swiperCharacter?: Swiper;

  // --- NOVOS CAMPOS PARA ITENS ---
  // Se true, a reputação desta fase será multiplicada por 2 ao finalizar
  doubleReputationActive: boolean = false;

  // Temporizadores/flags para "ice" (congelamento)
  private iceTimeout: any = null;
  private readonly ICE_FREEZE_SECONDS = 30; // duração do congelamento (pode ajustar)

  // Referências para listeners (para remover depois)
  private _onUseWatch = (e: Event) => this.handleItemUseWatch((e as CustomEvent).detail);
  private _onUseIce = (e: Event) => this.handleItemUseIce((e as CustomEvent).detail);
  private _onUse2xTime = (e: Event) => this.handleItemUse2xTime((e as CustomEvent).detail);
  private _onUse2xRepu = (e: Event) => this.handleItemUse2xRepu((e as CustomEvent).detail);

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private storageService: StorageService,
    private phaseService: PhaseService,
    private route: ActivatedRoute,
    private tipService: TipService,
    private userService: UserService,
    private phaseUserService: PhaseUserService,
    private notificationService: NotificationService,
    private appContextService: AppContextService
  ) {
  }

  // ✅ Método para construir URL correta da imagem do character
  getCharacterImageUrl(): string {
    if (this.phase?.character?.filePath) {
      return FileUrlBuilder.character(this.phase.character.filePath);
    }
    return 'assets/characters/character_teacher_01.png'; // Fallback
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.startTimer();
        this.loadWatchCount();        
        this.inventorySubscription = this.storageService.getInventoryUpdates().subscribe(inventory => {
          if (inventory) {
            this.watchCount = inventory['watch'] || 0;
            console.log('Watch count updated from storage service:', this.watchCount);
          }
        });
        this.userDataSubscription = this.dataService.userData$.subscribe(userData => {
          if (userData) {
            this.userData = userData;
          }
        });

        this.registerBackpackEventListeners();

        this.loadUserData(userId);
        this.tipService.getAllTips().subscribe((tips) => {
          const allTips = Array.isArray(tips) ? tips.map((t: any) => t.tip || '') : [];

          this.tips = this.pickRandomTips(allTips, 10);
        });
      } else {
      }
    }

    this.phaseId = Number(this.route.snapshot.paramMap.get('id'));
    
    this.appContextService.setContext('game-phase', this.phaseId);

    this.phaseService.getPhaseById(this.phaseId).subscribe(phase => {
      if (phase) {
        this.phase = phase;

        if (this.phase?.mode === "BASIC") {
          this.checkDiagramLeft = Infinity;
        } else if (this.phase?.mode === "INTERMEDIATE") {
          this.checkDiagramLeft = 3;
        } else if (this.phase?.mode === "ADVANCED") {
          this.checkDiagramLeft = 0;
        }
        
        // ✅ Iniciar salvamento automático após carregar a fase
        this.startAutoSave();

        // ✅ ADICIONAR: Inicializar speech APÓS ter os dados da fase
        setTimeout(() => {
          this.toggleSpeech();
        }, 100); // Pequeno delay para garantir que o template foi atualizado

      } else {
        // Fase não encontrada, redirecione ou mostre erro
        this.router.navigate(['/map']);
      }
    });

    const userId = localStorage.getItem('userId');

    this.phaseUserService.getByPhaseAndUserId(this.phaseId, Number(userId)).subscribe(phaseUser => {
        if (phaseUser) {
          this.phaseUser = phaseUser;
          
          // ✅ Só inicializar o diagrama DEPOIS de ter os dados
          setTimeout(() => {
            if (this.diagramEditorComponentRef) {
              this.diagramEditorComponentRef.initializeJointJS(undefined, phaseUser);
            }
          });
        } else {
          console.warn('PhaseUser não encontrado para fase e usuário:', this.phaseId, this.userData?.id);
        }
      });

  }

  ngAfterViewInit() {
    // Subscribe to store state changes
    this.storeSubscription = this.store.storeStateChanged.subscribe((isOpen: boolean) => {
      if (!isOpen) {
        // Store was closed, reload watch count
        this.loadWatchCount();
      }
    });
  }

  ngOnDestroy() {
    this.appContextService.setContext('other');
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    if (this.storeSubscription) {
      this.storeSubscription.unsubscribe();
    }
    if (this.inventorySubscription) {
      this.inventorySubscription.unsubscribe();
    }
    
    this.unregisterBackpackEventListeners();
  }

    // --------------------------
  // Registro / remoção listeners
  // --------------------------
  private registerBackpackEventListeners() {
    try {
      window.addEventListener('item.use.watch', this._onUseWatch as EventListener);
      window.addEventListener('item.use.ice', this._onUseIce as EventListener);
      window.addEventListener('item.use.2xtime', this._onUse2xTime as EventListener);
      window.addEventListener('item.use.2xrepu', this._onUse2xRepu as EventListener);
      console.log('Backpack item listeners registered');
    } catch (e) {
      console.warn('Não foi possível registrar listeners dos itens:', e);
    }
  }

  private unregisterBackpackEventListeners() {
    try {
      window.removeEventListener('item.use.watch', this._onUseWatch as EventListener);
      window.removeEventListener('item.use.ice', this._onUseIce as EventListener);
      window.removeEventListener('item.use.2xtime', this._onUse2xTime as EventListener);
      window.removeEventListener('item.use.2xrepu', this._onUse2xRepu as EventListener);
      console.log('Backpack item listeners removed');
    } catch (e) {
      console.warn('Erro ao remover listeners dos itens:', e);
    }
  }

  private pickRandomTips(arr: string[], limit: number = 10): string[] {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    // copia para não alterar o original
    const a = arr.slice();
    // Fisher–Yates shuffle
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    // pega os primeiros `limit` elementos
    return a.slice(0, Math.max(0, Math.min(limit, a.length)));
  }

  // ✅ Iniciar salvamento automático a cada 30 segundos
  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      if (this.autoSaveEnabled && !this.isSaving) {
        this.autoSaveDiagram();
      }
    }, 30000); // 30 segundos

    console.log('🔄 Salvamento automático iniciado (30s)');
  }

  // ✅ Método para salvamento automático
  private autoSaveDiagram(): void {
    if (!this.diagramEditorComponentRef || !this.phaseId) {
      console.warn('⚠️ Editor ou fase não disponível para salvamento');
      return;
    }

    try {
      // Obter JSON atual do diagrama
      const diagramJson = this.diagramEditorComponentRef.getCurrentDiagramJSON();
      
      if (!diagramJson) {
        console.warn('⚠️ Diagrama vazio, pulando salvamento');
        return;
      }

      this.isSaving = true;
      const diagramString = JSON.stringify(diagramJson);
      
      console.log('💾 Iniciando salvamento automático...', {
        phaseUserId: this.phaseId,
        diagramSize: diagramString.length
      });

      let phaseUserId = this.phaseUser?.id || -1;

      // Assumindo que o phaseUserId é o mesmo que phaseId por simplicidade
      // Em um cenário real, você precisaria buscar o PhaseUser correto
      this.phaseUserService.updateUserDiagram(phaseUserId, diagramString).subscribe({
        next: () => {
          this.isSaving = false;
          this.lastSaveTime = new Date();
          console.log('✅ Diagrama salvo automaticamente:', this.lastSaveTime.toLocaleTimeString());
        },
        error: (error) => {
          this.isSaving = false;
          console.error('❌ Erro no salvamento automático:', error);
        }
      });

    } catch (error) {
      this.isSaving = false;
      console.error('❌ Erro ao processar diagrama para salvamento:', error);
    }
  }

  // ✅ Método público para salvamento manual
  public manualSaveDiagram(): void {
    try {
      this.accuracy = this.diagramEditorComponentRef.calculateGraphAccuracy();
      console.log('Acurácia calculada para salvamento manual:', this.accuracy);
    } catch (error) {
      console.error('❌ Erro ao calcular acurácia:', error);
    }
  }

  // ✅ Método para obter status do último salvamento
  getLastSaveText(): string {
    if (this.isSaving) {
      return 'Salvando...';
    }
    
    if (this.lastSaveTime) {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - this.lastSaveTime.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return `Salvo há ${diffInSeconds}s`;
      } else {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Salvo há ${minutes}min`;
      }
    }
    
    return 'Não salvo';
  }

  // ✅ Alternar salvamento automático
  toggleAutoSave(): void {
    this.autoSaveEnabled = !this.autoSaveEnabled;
    
    if (this.autoSaveEnabled) {
      this.startAutoSave();
      console.log('✅ Salvamento automático ativado');
    } else {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
      }
      console.log('❌ Salvamento automático desativado');
    }
  }

  toggleTips() {
    if (this.diagramEditorComponentRef) {
      this.diagramEditorComponentRef.toggleTips();
    }
  }

  toggleStore() {
    this.store.toggle();
  }

  onStoreStateChanged(isOpen: boolean) {
    if (!isOpen) {
      // Store was closed, reload watch count
      this.loadWatchCount();
    }
  }

  toggleSpeech() {
    this.isSpeaking = !this.isSpeaking;
    this.characterState = this.isSpeaking ? 'visible' : 'hidden';
    if (this.isSpeaking) {
      this.activeSlideIndex = 0;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isSpeaking) return;

    const target = event.target as HTMLElement;
    const speechElement = this.speechBubble?.nativeElement;
    const characterElement = document.querySelector('.character');

    if (speechElement && !speechElement.contains(target) && !characterElement?.contains(target)) {
      this.isSpeaking = false;
      this.characterState = 'hidden';
    }
  }

  private loadUserData(userId: string) {
    this.userService.getUserById(Number(userId)).subscribe({
      next: (response: User) => {
        this.userData = response;
      },
      error: (error) => {
        console.error('Erro ao carregar dados do usuário:', error);
        this.userLoadError = 'Erro ao carregar dados do usuário';
        // this.router.navigate(['/login']);
      }
    });
  }

  private initializeCharacter(): void {
    this.swiperCharacter = new Swiper(".swiper-character", {

      direction: 'horizontal',

      pagination: {
        el: '.swiper-pagination',
      },

      // Navigation arrows
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },

      // Desabilitar arrastar/swipe para permitir seleção de texto
      allowTouchMove: false,
      simulateTouch: false,
      noSwiping: true,
      noSwipingClass: 'swiper-slide'

    });
  }

  exitGame() {
    this.openConfirmDialog(
      'Tem certeza que sair da fase?',
      'Você voltará para o menu principal se fizer isto.',
      () => {
        this.router.navigate(['/map', this.phase?.gameMap.id]);
      }
    );

  }

  get userMoney(): number {
    return this.userData?.coins || 0;
  }

  get userReputation(): number {
    return this.userData?.reputation || 0;
  }

  get userName(): string {
    return this.userData?.name || '';
  }

  get isProgressing(): boolean {
    return this.userData?.progressing || false;
  }

  openConfirmDialog(title: string, message: string, onConfirm: () => void) {
    this.confirmDialogTitle = title;
    this.confirmDialogMessage = message;
    this.confirmCallback = onConfirm;
    this.confirmDialogVisible = true;
  }

  onConfirm() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }

    // Calcular e atualizar a acurácia
    this.accuracy = this.diagramEditorComponentRef.calculateGraphAccuracy();
    if (this.phaseUser) {
      this.phaseUser.userDiagram = this.diagramEditorComponentRef.getCurrentDiagramJSON();
    }

    // Fecha o diálogo de confirmação e abre o diálogo de finalização
    this.confirmDialogVisible = false;
    this.finishedGamePhaseVisible = true;
  }

  onCancel() {
    this.confirmDialogVisible = false;
  }

  onTimeExpired() {
    console.log('Tempo da fase expirado! Enviando fase automaticamente...');
    
    this.notificationService.showNotification(
      'error', 
      'O tempo acabou! A fase será enviada automaticamente.'
    );

    if (this.diagramEditorComponentRef) {
      this.accuracy = this.diagramEditorComponentRef.calculateGraphAccuracy();
      if (this.phaseUser) {
        this.phaseUser.userDiagram = this.diagramEditorComponentRef.getCurrentDiagramJSON();
      }
    }

    this.finishedGamePhaseVisible = true;
  }

  onSaveClick() {
    this.openConfirmDialog(
      'Tem certeza que deseja salvar?',
      'Essa ação irá salvar seu progresso.',
      () => {
        // ✅ Usar o método de salvamento manual
        this.manualSaveDiagram();
      }
    );
  }

  onAccuracyCalculated(accuracyValue: number) {
    this.accuracy = accuracyValue;
  }

  private startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      if (!this.timerPaused) {
        const elapsedTime = Date.now() - this.startTime;
        const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);

        this.currentTime = `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
      }
    }, 1000);
  }

  activateWatch() {
    if (this.watchCount > 0 && !this.watchTimerInterval) {
      // Pause the main timer
      this.timerPaused = true;
      this.pausedTime = Date.now();
      
      // Decrease watch count
      this.watchCount--;
      const inventory = JSON.parse(localStorage.getItem('inventory') || '{}');
      inventory['watch'] = this.watchCount;
      localStorage.setItem('inventory', JSON.stringify(inventory));

      // Start watch timer
      this.watchStartTime = Date.now();
      this.watchTimerInterval = setInterval(() => {
        const remainingTime = this.watchDuration - (Date.now() - this.watchStartTime);
        
        if (remainingTime <= 0) {
          // Watch time finished
          clearInterval(this.watchTimerInterval);
          this.watchTimerInterval = null;
          this.watchTime = '';
          
          // Resume main timer
          this.timerPaused = false;
          const pauseDuration = Date.now() - this.pausedTime;
          this.startTime += pauseDuration;
        } else {
          // Update watch time display
          const minutes = Math.floor(remainingTime / (1000 * 60));
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
          this.watchTime = `+${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
        }
      }, 1000);
    }
  }

  private padNumber(num: number): string {
    return num.toString().padStart(2, '0');
  }

  private loadWatchCount() {
    const inventoryJson = localStorage.getItem('inventory');
    if (inventoryJson) {
      const inventory = JSON.parse(inventoryJson);
      this.watchCount = inventory['watch'] || 0;
    } else {
      this.watchCount = 0;
    }
  }

  // Debug method to set watch count
  setWatchCount(count: number) {
    localStorage.setItem('watch', count.toString());
    this.loadWatchCount();
  }

  onBackToMenu() {
    this.finishedGamePhaseVisible = false;
    this.saveDisabled = true;
    this.headerComponent.refreshUserData();

    // tenta pegar o id do mapa a partir da fase carregada
    const mapId = this.phase?.gameMap?.id ?? this.phaseUser?.phase?.gameMap?.id;

    if (mapId) {
      // navega para /map/:id
      this.router.navigate(['/map', mapId]);
    } else {
      // fallback genérico
      this.router.navigate(['/map']);
    }
  }

  checkDiagram() {
    if(this.checkDiagramLeft > 0) {
      if(this.diagramEditorComponentRef.checkUMLInconsistencies()) {
        this.notificationService.showNotification('error', 'Foram encontradas inconsistências no seu diagrama. Por favor, corrija-as antes de prosseguir.');
      } else {
        this.notificationService.showNotification('success', 'Nenhuma inconsistência encontrada no diagrama!');
      }
      this.checkDiagramLeft--;
    } else {
      this.notificationService.showNotification('error', 'Você não tem mais verificações disponíveis nesta fase.');
    }
  }

  // ✅ Método helper type-safe
  getCurrentPhaseType(): PhaseType | null {
    if (!this.phase?.type) return null;
    
    const typeKey = this.phase.type as keyof typeof PHASE_TYPES;
    return this.phaseTypes[typeKey] || null;
  }

  // ✅ Métodos específicos para título e descrição
  getPhaseTitle(): string {
    return this.getCurrentPhaseType()?.title || 'Título não disponível';
  }

  getPhaseDescription(): string {
    return this.getCurrentPhaseType()?.description || 'Descrição não disponível';
  }

  getPhaseVideoSrc(): string {
    return `/assets/videos/${this.phase?.type || 'default'}.mp4`;
  }

    // --------------------------
  // Handlers para cada item
  // --------------------------
  private handleItemUseWatch(detail: any) {
    // +60 segundos ao tempo restante do header e exibe badge verde
    try {
      if (this.headerComponent) {
        const header = this.headerComponent as any;

        header.remainingTimeInSeconds = (Number(header.remainingTimeInSeconds) || 0) + 60;

        // mostra badge "+60" por 3s (usa API pública quando disponível)
        if (typeof header.showTimeBadge === 'function') {
          header.showTimeBadge('+60', 'badge-green', 3000);
        }

        this.notificationService.showNotification('success', '+60s adicionados à fase!');
        console.debug('item.use.watch aplicado:', detail);
      }
    } catch (e) {
      console.warn('Erro ao aplicar item.watch:', e);
    }
  }

  private handleItemUseIce(detail: any) {
    // Congela o tempo pelo resto da fase e aplica aparência congelada (azul)
    try {
      if (this.headerComponent) {
        const header = this.headerComponent as any;

        // Pause o timer (header usa timerPaused)
        (header as any).timerPaused = true;

        // marca o estado de "ice" publicamente
        if (typeof header.setIceActive === 'function') {
          header.setIceActive(true);
        } else {
          header.iceActive = true;
        }

        // opcional: exibe um pequeno badge de "❄" enquanto congelado
        if (typeof header.showTimeBadge === 'function') {
          header.showTimeBadge('❄', 'badge-frozen', 0); // duração 0 = persistente até desativado
        } else {
          header.timeBadge = { label: '❄', class: 'badge-frozen' };
        }

        // Não reativa o timer automaticamente — fica congelado até fim da fase
        this.notificationService.showNotification('success', `Tempo congelado pelo resto da fase!`);
        console.debug('item.use.ice aplicado (congelado até o fim da fase):', detail);

        // armazena flag local também, se necessário
        (this as any).iceActive = true;
      }
    } catch (e) {
      console.warn('Erro ao aplicar item.ice:', e);
    }
  }

  private handleItemUse2xTime(detail: any) {
    // Duplica o tempo restante
    try {
      if (this.headerComponent) {
        const header = this.headerComponent as any;
        const current = Number(header.remainingTimeInSeconds) || 0;
        const doubled = current * 2;
        header.remainingTimeInSeconds = doubled;

        if (typeof header.showTimeBadge === 'function') {
          header.showTimeBadge('x2', 'badge-yellow', 3000);
        } else {
          header.timeBadge = { label: 'x2', class: 'badge-yellow' };
          setTimeout(() => header.timeBadge = null, 3000);
        }

        this.notificationService.showNotification('success', 'Tempo duplicado para esta fase!');
        console.debug('item.use.2xtime aplicado:', detail, { before: current, after: doubled });
      }
    } catch (e) {
      console.warn('Erro ao aplicar item.2xtime:', e);
    }
  }

  private handleItemUse2xRepu(detail: any) {
    // Ativa flag para duplicar reputação ao finalizar a fase
    try {
      this.doubleReputationActive = true;
      // marca também no phaseUser para que outras rotinas que usam phaseUser possam verificar
      if (this.phaseUser) {
        (this.phaseUser as any).doubleReputationActive = true;
      }
      if (this.headerComponent) {
        const header = this.headerComponent as any;
        if (typeof header.setDoubleReputationActive === 'function') {
          header.setDoubleReputationActive(true);
        } else {
          header.doubleReputationActive = true;
        }
      }
      this.notificationService.showNotification('success', 'Reputação em dobro ativa para esta fase!');
      console.debug('item.use.2xrepu aplicado:', detail);
    } catch (e) {
      console.warn('Erro ao aplicar item.2xrepu:', e);
    }
  }
}