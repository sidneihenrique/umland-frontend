import { Component, ViewChild, OnInit, Inject, PLATFORM_ID, OnDestroy, ElementRef, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';
import { Subscription } from 'rxjs';
import { StoreComponent } from "../store/store.component";
import { PhaseTransition, Phase } from '../../services/phase.service';
import { AuthService } from '../auth/auth.service';
import { DataService } from '../../services/data.service';
import { User, UserService } from '../../services/user.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';

import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import { EffectCoverflow } from 'swiper/modules'; 

import { GameMapService, PhaseUser } from '../../services/game-map.service';
import { PhaseUserService } from '../../services/phase-user.service';
import { FileUrlBuilder } from '../../config/files.config';
import { NotificationService } from '../../services/notification.service';
import { AppContextService } from '../../services/app-context.service';

@Component({
  selector: 'game-map',
  standalone: true,
  imports: [
    HeaderComponent,
    LucideIconsModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './game-map.component.html',
  styleUrl: './game-map.component.css'
})
export class GameMapComponent implements OnInit, OnDestroy {

  // User data
  userData?: User;
  userLoadError: string = '';

  @ViewChild(StoreComponent) store!: StoreComponent;
  private userDataSubscription?: Subscription;

  // ✅ Usando PhaseUser diretamente
  phaseUsers: PhaseUser[] = [];
  // Phase data
  phaseTransitions: PhaseTransition[] = [];
  gameMapId: number = 0;
  userId: number = 0;
  isLoadingPhases: boolean = false;
  phasesError: string = '';

  // ✅ ADICIONAR: Estado da associação GameMap-User
  isAssociatingUser: boolean = false;
  associationError: string = '';

  // Lista filtrada de phaseUsers disponíveis para mostrar no mapa
  phaseUsersAvailable: PhaseUser[] = [];
  private idToPhaseUser = new Map<number, PhaseUser>();
  private outgoingMap = new Map<number, PhaseTransition[]>();
  private incomingCount = new Map<number, number>();

  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;

  private swiper!: Swiper;

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const container = document.getElementById('container');
      if (container) {
        const moveX = (event.clientX / window.innerWidth - 0.5) * 20;
        const moveY = (event.clientY / window.innerHeight - 0.5) * 20;
        container.style.backgroundPosition = `calc(50% + ${moveX}px) calc(50% + ${moveY}px)`;
      }
    }
  }

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private gameMapService: GameMapService,
    private phaseUserService: PhaseUserService,
    private notificationService: NotificationService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef,
    private appContextService: AppContextService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.gameMapId = Number(this.route.snapshot.paramMap.get('id'));

      if (!this.gameMapId || this.gameMapId <= 0) {
        console.error('❌ GameMapId inválido:', this.gameMapId);
        this.router.navigate(['/select-map']);
        return;
      }

      this.appContextService.setContext('game-map', undefined, this.gameMapId);

      const currentUser = this.userService.getCurrentUser();
      
      if (currentUser && currentUser.id) {
        this.userId = currentUser.id;
        this.userData = currentUser;
        
        this.userDataSubscription = this.dataService.userData$.subscribe(userData => {
          if (userData) {
            this.userData = userData;
          }
        });

        this.associateUserToGameMap();
        
      } else {
        console.warn('⚠️ Usuário não encontrado no localStorage');
        this.router.navigate(['/login']);
      }
    }
  }

  // ✅ NOVO: Método para associar usuário ao GameMap
  private associateUserToGameMap() {
    if (!this.gameMapId || !this.userId) {
      console.error('❌ GameMapId ou UserId não disponível para associação');
      return;
    }

    this.isAssociatingUser = true;
    this.associationError = '';

    this.gameMapService.setGameMapToUser(this.gameMapId, this.userId).subscribe({
      next: (gameMap) => {
        this.isAssociatingUser = false;
        
        // ✅ Após associar, carregar dados do usuário e fases
        this.loadUserData(this.userId);
        this.loadPhaseUsers();

      },
      error: (error) => {
        console.error('❌ Erro ao associar usuário ao GameMap:', error);
        this.isAssociatingUser = false;
        
        // ✅ Tratar diferentes tipos de erro
        if (error.status === 204) {
          console.error('📝 GameMap ou usuário não encontrado');
          this.associationError = 'GameMap ou usuário não encontrado';
          
          // ✅ Tentar carregar mesmo assim (pode já estar associado)
          this.loadUserData(this.userId);
          this.loadPhaseUsers();
          
        } else if (error.status === 400) {
          console.error('⚠️ Dados inválidos - usuário pode já estar associado');
          this.associationError = 'Usuário pode já estar associado ao GameMap';
          
          // ✅ Continuar normalmente
          this.loadUserData(this.userId);
          this.loadPhaseUsers();
          
        } else {
          console.error('🔥 Erro interno do servidor na associação');
          this.associationError = 'Erro interno do servidor';
          
          // ✅ Tentar carregar dados mesmo com erro
          this.loadUserData(this.userId);
          this.loadPhaseUsers();
        }
      }
    });
  }

  // ✅ Método para carregar fases (mantido igual)
  public loadPhaseUsers() {
    if (!this.gameMapId || !this.userId) {
      console.error('❌ GameMapId ou UserId não disponível:', { 
        gameMapId: this.gameMapId, 
        userId: this.userId 
      });
      return;
    }

    this.isLoadingPhases = true;
    this.phasesError = '';
        
    this.gameMapService.getAllPhasesByUser(this.gameMapId, this.userId).subscribe({
      next: async (phaseUsers: PhaseUser[]) => {
        this.phaseUsers = phaseUsers;
        this.isLoadingPhases = false;

        // garante que phaseTransitions esteja preenchido antes de construir the available list
        await this.fetchPhaseTransitions();

        await this.buildPhaseUsersAvailable();
        this.initSwiper();
      },
      error: (error) => {
        console.error('❌ Erro ao carregar fases:', error);
        this.isLoadingPhases = false;
        
        if (error.status === 404) {
          this.phasesError = 'GameMap não encontrado ou usuário sem fases';
        } else {
          this.phasesError = 'Erro ao carregar fases do mapa';
        }
        
      }
    });
  }

  loadPhaseTransitions() {
    this.gameMapService.getPhaseTransitionsByGameMapId(this.gameMapId).subscribe({
      next: (transitions) => {
        this.phaseTransitions = transitions;
        console.log('Transições carregadas:', this.phaseTransitions);
      },
      error: (error) => console.error('Erro ao carregar transições:', error)
    });
  }


  isPhaseUnlocked(phaseUser: PhaseUser): boolean {
    return phaseUser.status === 'AVAILABLE' || phaseUser.status === 'COMPLETED';
  }

  isPhaseFinished(phaseUser: PhaseUser): boolean {
    return phaseUser.status === 'COMPLETED';
  }

  isCurrentPhase(phaseUser: PhaseUser): boolean {
    return phaseUser.status === 'AVAILABLE';
  }

  calculateAccuracy(phaseUser: PhaseUser): number {
    if (phaseUser.status === 'COMPLETED') {
      return Math.min(Math.round((phaseUser.reputation / 200) * 100), 100);
    }
    return 0;
  }

  getCharacterImagePath(phaseUser: PhaseUser): string {
    return FileUrlBuilder.character(phaseUser.phase.character.filePath);
  }

  // ✅ Métodos de compatibilidade
  setGameMapId(newGameMapId: number) {
    this.gameMapId = newGameMapId;
    this.associateUserToGameMap();
  }

  setUserId(newUserId: number) {
    this.userId = newUserId;
    this.associateUserToGameMap();
  }

  refreshPhaseUsers() {
    this.associateUserToGameMap();
  }

  toggleStore() {
    this.store.toggle();
  }

  private fetchPhaseTransitions(): Promise<void> {
  return new Promise((resolve) => {
    // chama o serviço e resolve a promise quando terminar (success ou error).
    this.gameMapService.getPhaseTransitionsByGameMapId(this.gameMapId).subscribe({
      next: (transitions) => {
        this.phaseTransitions = transitions || [];
        console.log('Transições carregadas (fetchPhaseTransitions):', this.phaseTransitions);
        resolve();
      },
      error: (error) => {
        console.error('Erro ao carregar transições (fetchPhaseTransitions):', error);
        // mantém phaseTransitions vazio para evitar undefined
        this.phaseTransitions = [];
        // resolve mesmo em caso de erro: assim a UI pode prosseguir e tratar ausência de transições
        resolve();
      }
    });
  });
}

  // ✅ Método para carregar dados do usuário (mantido igual)
  private loadUserData(userId: number) {
    this.userService.getUserById(userId).subscribe({
      next: (user: User) => {
        this.userData = user;
      },
      error: (error) => {
        console.error('⚠️ Erro ao carregar dados atualizados do usuário:', error);
      }
    });
  }

  get userName(): string {
    return this.userData?.name || '';
  }

  // ✅ ADICIONAR: Getter para estado de loading geral
  get isLoading(): boolean {
    return this.isAssociatingUser || this.isLoadingPhases;
  }

  // ✅ ADICIONAR: Getter para mensagens de erro
  get errorMessage(): string {
    return this.associationError || this.phasesError;
  }

  // chamar após carregar phaseUsers e phaseTransitions:
  private prepareGraph() {
    this.idToPhaseUser.clear();
    this.outgoingMap.clear();
    this.incomingCount.clear();

    // mapear PhaseUser por phase.id
    for (const phaseUser of this.phaseUsers) {
      if (phaseUser?.phase?.id) this.idToPhaseUser.set(phaseUser.phase.id as number, phaseUser);
    }

    // montar outgoingMap e incoming counts
    for (const t of this.phaseTransitions) {
      const fromId = t.fromPhase?.id;
      const toId = t.toPhase?.id;
      if (!fromId || !toId) continue;
      if (!this.outgoingMap.has(fromId)) this.outgoingMap.set(fromId, []);
      this.outgoingMap.get(fromId)!.push(t);
      this.incomingCount.set(toId, (this.incomingCount.get(toId) || 0) + 1);
    }
  }

  /**
   * Constrói phaseUsersAvailable seguindo a regra:
   * - começa no start (phase.current === true) ou em um root (sem incoming)
   * - segue seguindo um único caminho vigente (prioriza next cujo phaseUser.status é AVAILABLE|COMPLETED)
   * - se encontra DECISION que NÃO está isCompleted, STOP (não incluir essa DECISION)
   */
  buildPhaseUsersAvailable() {
    this.prepareGraph();
    this.phaseUsersAvailable = [];

    // encontrar start ou root
    let startPhaseUser = null;
    
    // procurar start
    const root = this.phaseUsers.find(phaseUser => !this.incomingCount.has(phaseUser.phase.id!));
    startPhaseUser = root || (this.phaseUsers[0] || null);
   
    if (!startPhaseUser) return;
    
    this.phaseUsersAvailable.push(startPhaseUser);
   

    // seguir adiante por um caminho linear (até encontrar DECISION não-completada)
    let currentPhaseId = startPhaseUser.phase.id!;
    const visited = new Set<number>();
    while (true) {
      if (visited.has(currentPhaseId)) break;
      visited.add(currentPhaseId);

      const outs = this.outgoingMap.get(currentPhaseId) || [];
      if (outs.length === 0) break;

      // priorizar destinos que já estão AVAILABLE/COMPLETED (mantém sequência que já está liberada)
      const preferred = outs.find(t => {
        const toId = t.toPhase?.id;
        const pu = toId ? this.idToPhaseUser.get(toId) : undefined;
        return pu && (pu.status === 'AVAILABLE' || pu.status === 'COMPLETED');
      });
      const nextTransition = preferred || outs[0]; // fallback para o primeiro
      const nextId = nextTransition.toPhase?.id;
      if (!nextId) break;

      const nextPu = this.idToPhaseUser.get(nextId);
      if (!nextPu) break;

      // NOVO: se o nó atual for DECISION e o próximo estiver LOCKED, parar e não incluir
      const currentPu = this.idToPhaseUser.get(currentPhaseId);
      const prevIsDecision = currentPu?.phase?.nodeType === 'DECISION';
      if (prevIsDecision && nextPu.status === 'LOCKED') {
        break;
      }

      // 
      this.phaseUsersAvailable.push(nextPu);
      currentPhaseId = nextId;
      continue;

    }
  }

  // no GameMapComponent
  outgoingMapForPhase(phaseId?: number): PhaseTransition[] {
    if (!phaseId) return [];
    return this.outgoingMap.get(phaseId) || [];
  }

  /**
   * onDecisionChoice: ao escolher uma opção (transition),
   * libera as phaseUsers subsequentes até a próxima DECISION (marcando status=AVAILABLE).
   */
  async onDecisionChoice(currentPu: PhaseUser, transition: PhaseTransition) {
    if(currentPu.current !== true) {
      this.notificationService.showNotification('error', 'Para selecionar uma opção, você deve estar na fase atual do jogo.');
      return;
    }
    const targetId = transition.toPhase?.id;
    if (!targetId) return;

    // coletar ids da sequência a partir do targetId até antes da próxima DECISION
    const idsToUnlock: number[] = [];
    const stack: number[] = [targetId];
    const visited = new Set<number>();

    // vamos percorrer linearmente preferindo primeiro outgoing (padrão); 
    // se houver ramificações, percorre apenas o caminho principal (pode ajustar se quiser liberar múltiplas branches)
    while (stack.length) {
      const pid = stack.shift()!;
      if (visited.has(pid)) break;
      visited.add(pid);

      const pu = this.idToPhaseUser.get(pid);
      if (!pu) break;

      // se encontramos uma DECISION (mesmo que já esteja COMPLETED) paramos (não incluímos)
      if (pu.phase.nodeType === 'DECISION') {
        break;
      }

      // marca para liberar
      idsToUnlock.push(pu.id);

      // pegar próximo (apenas o primeiro outgoing)
      const outs = this.outgoingMap.get(pid) || [];
      if (outs.length === 0) break;
      const next = outs[0].toPhase?.id;
      if (!next) break;
      stack.push(next);
    }

    if (idsToUnlock.length === 0) return;

    // Chamada de API em lote (ou sequencial) para atualizar status das phaseUsers
    try {
      let first = true;
      // exemplo sequencial; você pode implementar endpoint batch atualizando vários de uma vez
      for (const puId of idsToUnlock) {
        const pu = this.phaseUsers.find(p => p.id === puId);
        if (!pu) continue;
        if(first) {
          first = false;
          const updated = { ...pu, status: 'AVAILABLE', current: true } as any;
          await this.phaseUserService.updatePhaseUser(puId, updated).toPromise();
          pu.status = 'AVAILABLE';
          pu.current = true;
        } else {
          const updated = { ...pu, status: 'AVAILABLE' } as any;
          await this.phaseUserService.updatePhaseUser(puId, updated).toPromise();
          // Atualiza localmente para resposta imediata
          pu.status = 'AVAILABLE';
        }
      }

      // ----------------------------
    // NOVO: desmarcar a fase de DECISION como current = false
    // ----------------------------
    try {
      // atualizar objeto local
      const localCurrent = this.phaseUsers.find(p => p.id === currentPu.id);
      if (localCurrent) {
        localCurrent.current = false;
      }

      // preparar payload para backend: apenas marcar current = false (mantendo outros campos)
      const updatedCurrent = { ...currentPu, current: false } as any;

      // persistir no backend
      await this.phaseUserService.updatePhaseUser(currentPu.id, updatedCurrent).toPromise();
    } catch (errUpdateCurrent) {
      console.error('Erro ao desmarcar current da decisão:', errUpdateCurrent);
      // notificar, mas não bloquear o fluxo
      this.notificationService.showNotification('error', 'Não foi possível atualizar o estado da fase atual no servidor, mas localmente ela será tratada como não atual.');
      // garantir que localmente já esteja marcado como falso
      const localCurrentFallback = this.phaseUsers.find(p => p.id === currentPu.id);
      if (localCurrentFallback) localCurrentFallback.current = false;
    }

      // depois de liberar, recalcule a lista disponível
      this.buildPhaseUsersAvailable();

    } catch (err) {
      console.error('Erro ao liberar path da decisão:', err);
    }
  }

  openGamePhase(phaseUser: PhaseUser) {
    if (phaseUser.status === 'AVAILABLE' || phaseUser.status === 'COMPLETED') {
      this.router.navigate(['/game', phaseUser.phase.id]);
    }
  }

  // ✅ Método para construir URL correta da imagem do character
  getCharacterImageUrl(phaseUser: PhaseUser): string {
    return FileUrlBuilder.character(phaseUser.phase.character.filePath);
  }
  

  // adiciona este método na classe
  private initSwiper() {
    // proteção básica
    if (!this.swiperContainer || !this.swiperContainer.nativeElement) return;
    const containerEl = this.swiperContainer.nativeElement as HTMLElement;

    // calcular índice inicial baseado em phase.current === true
    const currentIndex = this.phaseUsersAvailable
      ? this.phaseUsersAvailable.findIndex(pu => !!pu.phase && !!pu.current)
      : -1;
    const initialSlideIndex = currentIndex >= 0 ? currentIndex : 0;

    // esperar próximo ciclo de render e um RAF para garantir que os .swiper-slide estejam no DOM
    Promise.resolve().then(() => {
      requestAnimationFrame(() => {
        const slides = containerEl.querySelectorAll('.swiper-slide');
        if (!slides || slides.length === 0) {
          // nada a inicializar
          return;
        }

        // destruir instancia anterior, se existir
        if (this.swiper) {
          try { this.swiper.destroy(true, true); } catch (e) { /* ignore */ }
          this.swiper = undefined as any;
        }

        // inicializar com initialSlide baseado na currentPhase
        this.swiper = new Swiper(containerEl, {
          modules: [Navigation, Pagination, EffectCoverflow],
          effect: "coverflow",
          slidesPerView: 'auto',
          grabCursor: true,
          centeredSlides: true,
          initialSlide: initialSlideIndex,
          coverflowEffect: {
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          },
          autoHeight: true,
          navigation: {
            nextEl: document.querySelector<HTMLElement>('.wrapper .swiper-button-next'),
            prevEl: document.querySelector<HTMLElement>('.wrapper .swiper-button-prev')
          },
          loop: false,
          spaceBetween: 64,
          speed: 1000
        });

        // Garanta que o Swiper realmente pule para o slide desejado após init
        try {
          if (initialSlideIndex > 0 && this.swiper && typeof this.swiper.slideTo === 'function') {
            // tempo 0 para não animar (apenas posicionar)
            this.swiper.slideTo(initialSlideIndex, 0);
          }
        } catch (e) {
          // ignore se algo falhar aqui
          console.debug('Swiper slideTo failed', e);
        }
      });
    });
  }

    /**
   * Calcula o progresso (%) do usuário no mapa.
   *
   * Lógica:
   * - Por padrão exclui fases com `phase.nodeType === 'DECISION'` do total,
   *   pois são nós de decisão (opcionais para progresso linear).
   * - Se não houver fases "não-DECISION", usa o total completo como fallback.
   * - Retorna um inteiro entre 0 e 100.
   */
  calculateProgress(): number {
    try {
      const all = Array.isArray(this.phaseUsers) ? this.phaseUsers : [];

      // Considera apenas fases que não são DECISION (opcional; altera aqui se quiser incluir DECISION)
      const nonDecision = all.filter(pu => pu && pu.phase && pu.phase.nodeType !== 'DECISION');

      // Se não houver fases não-DECISION, usa fallback para evitar divisão por zero
      const pool = nonDecision.length > 0 ? nonDecision : all;
      const total = pool.length;

      if (total === 0) return 0;

      const completed = pool.filter(pu => pu && pu.status === 'COMPLETED').length;
      const percent = Math.round((completed / total) * 100);

      return Math.max(0, Math.min(100, percent));
    } catch (err) {
      console.error('calculateProgress error', err);
      return 0;
    }
  }

  getUserAvatarUrl(): string {
    // se não houver avatar definido, usa fallback local
    if (!this.userData?.avatar?.filePath) {
      return '';
    }

    return FileUrlBuilder.avatar(this.userData.avatar.filePath);
  }

    /**
   * Retorna true se, para a decision `phaseUser`, a opção representada por `transition`
   * deve estar bloqueada porque outra opção já foi selecionada.
   *
   * Estratégia:
   * - percorre as transições (usando o mapa `outgoingMap`) e checa o PhaseUser alvo (usando `idToPhaseUser`).
   * - se algum target tiver status 'AVAILABLE' ou 'COMPLETED' consideramos que essa foi a opção escolhida.
   * - então bloqueamos todos os botões cuja transition.toPhase.id !== chosenTargetId.
   */
  isDecisionOptionDisabled(phaseUser: PhaseUser, transition: PhaseTransition): boolean {
    try {
      if (!phaseUser || !phaseUser.phase || !phaseUser.phase.id) return false;

      const outs = this.outgoingMap.get(phaseUser.phase.id) || [];
      // procura a opção já escolhida (um target que já foi marcado AVAILABLE/COMPLETED)
      let chosenTargetId: number | null = null;
      for (const t of outs) {
        const toId = t?.toPhase?.id;
        if (!toId) continue;
        const pu = this.idToPhaseUser.get(toId);
        if (pu && (pu.status === 'AVAILABLE' || pu.status === 'COMPLETED')) {
          chosenTargetId = toId;
          break;
        }
      }

      if (chosenTargetId === null) {
        // nenhuma opção escolhida ainda -> nada desabilitado
        return false;
      }

      // desabilita se esta transition NÃO é a escolhida
      const thisToId = transition?.toPhase?.id;
      return thisToId !== chosenTargetId;
    } catch (err) {
      console.error('isDecisionOptionDisabled error', err);
      return false;
    }
  }

  trackByPhaseUser(index: number, pu: PhaseUser) {
    return pu?.id ?? index;
  }

  ngOnDestroy() {
    this.appContextService.setContext('other');
    
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    if (this.swiper) {
      try { this.swiper.destroy(true, true); } catch (e) { }
    }
  }
}
