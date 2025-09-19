import { Component, AfterViewInit, ViewChild, ViewContainerRef, ComponentRef, OnInit, OnDestroy, Inject, PLATFORM_ID, Input } from '@angular/core';
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

import { FileUrlBuilder } from '../../config/files.config';

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
  watchTime: string = '';  // Additional timer for watch bonus time
  watchCount: number = 0;
  private timerInterval: any;
  private watchTimerInterval: any;
  private timerPaused: boolean = false;
  private pausedTime: number = 0;
  private watchStartTime: number = 0;
  private watchDuration: number = 59 * 1000; // 59 seconds in milliseconds
  private storeSubscription?: Subscription;
  private inventorySubscription?: Subscription;
  private startTime: number = 0;
  private visibleAdviseTypePhase: boolean = true;

  @Input() phaseId!: number;
  phase?: Phase;

  // ✅ Disponibilize o mapa para o template
  phaseTypes = PHASE_TYPES;

  tips: string[] = [];
  
  @ViewChild(StoreComponent) store!: StoreComponent;
  private userDataSubscription?: Subscription;

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
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private storageService: StorageService,
    private phaseService: PhaseService,
    private route: ActivatedRoute,
    private tipService: TipService,
    private userService: UserService
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
        this.loadWatchCount();        // Subscribe to inventory changes
        this.inventorySubscription = this.storageService.getInventoryUpdates().subscribe(inventory => {
          if (inventory) {
            this.watchCount = inventory['watch'] || 0;
            console.log('Watch count updated from storage service:', this.watchCount);
          }
        });
        // Inscreve-se nas atualizações de dados do usuário
        this.userDataSubscription = this.dataService.userData$.subscribe(userData => {
          if (userData) {
            this.userData = userData;
          }
        });

        // Carrega os dados iniciais
        this.loadUserData(userId);
        this.tipService.getAllTips().subscribe((tips) => {
          this.tips = tips.map(tip => tip.tip); // assuming Tip has a 'text' property
        });
      } else {
        // this.router.navigate(['/login']);
      }
    }

    this.phaseId = Number(this.route.snapshot.paramMap.get('id'));

    // Carregue os dados da fase do service
    this.phaseService.getPhaseById(this.phaseId).subscribe(phase => {
      if (phase) {
        this.phase = phase;
        console.log('Fase carregada:', this.phase);

        if (this.phase?.mode === "BASIC") {
          this.checkDiagramLeft = Infinity;
        } else if (this.phase?.mode === "INTERMEDIATE") {
          this.checkDiagramLeft = 3;
        } else if (this.phase?.mode === "ADVANCED") {
          this.checkDiagramLeft = 0;
        }
        
      } else {
        // Fase não encontrada, redirecione ou mostre erro
        this.router.navigate(['/map']);
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

    this.toggleSpeech();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
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

    });
  }

  exitGame() {
    this.openConfirmDialog(
      'Tem certeza que sair da fase?',
      'Você voltará para o menu principal se fizer isto.',
      () => {
        this.router.navigate(['/map']);
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

    // Fecha o diálogo de confirmação e abre o diálogo de finalização
    this.confirmDialogVisible = false;
    this.finishedGamePhaseVisible = true;
  }

  onCancel() {
    this.confirmDialogVisible = false;
  }

  onSaveClick() {
    this.openConfirmDialog(
      'Tem certeza que deseja salvar?',
      'Essa ação irá salvar seu progresso.',
      () => {
        // Lógica de salvar aqui!
        console.log('Salvou!');
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
      console.log('Watch count loaded from inventory:', this.watchCount);
    } else {
      this.watchCount = 0;
      console.log('No inventory found, watch count set to 0');
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
    this.router.navigate(['/map']);
  }

  checkDiagram() {
    console.log('Tentando verificar diagrama, tentativas restantes:', this.checkDiagramLeft);
    if(this.checkDiagramLeft > 0) {
      console.log('Verificando diagrama, tentativas restantes:', this.checkDiagramLeft);
      this.diagramEditorComponentRef.checkUMLInconsistencies();
      this.checkDiagramLeft--;
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
}