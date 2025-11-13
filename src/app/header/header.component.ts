import { Component, OnInit, EventEmitter, Input, Output, ViewChild, ViewContainerRef, OnDestroy, Inject, PLATFORM_ID, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { LucideIconsModule } from '../lucide-icons.module';
import { StorageService } from '../../services/storage.service';
import { StoreComponent } from "../store/store.component";
import { BackpackComponent } from "../backpack/backpack.component";
import { MapComponent } from "../map/map.component";
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { DataService, UserResponse } from '../../services/data.service';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { User } from '../../services/user.service';
import { AuthService } from '../auth/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TutorialModalComponent } from '../utils/tutorial-modal/tutorial-modal.component';
import { FileUrlBuilder } from '../../config/files.config';

@Component({
  selector: 'app-header',
  imports: [
    LucideIconsModule, 
    StoreComponent, 
    BackpackComponent,
    MapComponent,
    CommonModule,
    ConfirmDialogComponent,
    TutorialModalComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy, OnChanges {

  @Output() exitEvent = new EventEmitter<void>();
  @Output() storeToggleEvent = new EventEmitter<boolean>();
  @Output() timeExpiredEvent = new EventEmitter<void>();

  @Input() parentType!: 'game-phase' | 'game-map' | 'game-map-select';
  @Input() currentPhaseId?: number;
  @Input() gameMapId?: number;
  @Input() maxTime?: number;

  userData?: User;

  @ViewChild(StoreComponent) store!: StoreComponent;
  @ViewChild(BackpackComponent) backpack!: BackpackComponent;
  @ViewChild(MapComponent) map!: MapComponent;

  confirmDialogVisible: boolean = false;
  confirmDialogTitle: string = '';
  confirmDialogMessage: string = '';

  isAccordionOpen: boolean = false;
  isInMapRoute: boolean = false;

  currentTime: string = '00:00:00';
  watchTime: string = '';
  private timerInterval: any;
  private watchTimerInterval: any;
  private timerPaused: boolean = false;
  private pausedTime: number = 0;
  private watchStartTime: number = 0;
  private watchDuration: number = 59 * 1000;
  private startTime: number = 0;
  private userDataSubscription?: Subscription;
  remainingTimeInSeconds: number = 0;

  // ---------- NOVOS CAMPOS PÚBLICOS PARA ITENS ----------
  // indica que o tempo está "congelado" pela mochila (ice)
  public iceActive: boolean = false;

  // badge temporário exibido ao lado do tempo (ex: "+60", "x2")
  public timeBadge: { label: string; class?: string } | null = null;
  private _timeBadgeTimeout: any = null;

  // indica que a reputação está em dobro para a fase atual
  public doubleReputationActive: boolean = false;

  // novo: controla exibição do tutorial
  public showTutorialModal: boolean = false;
  // coloque aqui a URL/ID do vídeo do YouTube que deseja exibir
  public tutorialVideoUrl: string = 'https://youtu.be/bQvr8F2PNwA';

  constructor(
    private dataService: DataService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.subscribeToUserData();

    // Verifica flag no localStorage; se ausente, mostra modal
    const dontShow = localStorage.getItem('dontShowTutorialAnymore');
    if (!dontShow) {
      // Mostra modal (pode esperar pequeno timeout para garantir render)
      setTimeout(() => this.showTutorialModal = true, 150);
    }

    this.checkIfInMapRoute();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfInMapRoute();
    });
  }

  // handler chamado quando tutorial modal fecha (two-way binding cuidará de visibleChange)
  onTutorialVisibleChange(visible: boolean) {
    // se o usuário fechou (visible === false) gravamos flag para não mostrar novamente
    if (!visible) {
      try {
        localStorage.setItem('dontShowTutorialAnymore', '1');
      } catch (e) {
        // ignore storage errors
      }
    }
    this.showTutorialModal = visible;
  }

  tutorialModal() {
    this.showTutorialModal = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['maxTime'] && changes['maxTime'].currentValue && this.parentType === 'game-phase') {
      this.remainingTimeInSeconds = changes['maxTime'].currentValue;
      
      if (!this.timerInterval) {
        this.startTimer();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.watchTimerInterval) {
      clearInterval(this.watchTimerInterval);
    }
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }

  logout() {
    this.openConfirmDialog(
      'Tem certeza que deseja fazer logout?',
      'Você precisará fazer o login novamente caso deseje entrar'
    );
  }

  toggleAccordion() {
    this.isAccordionOpen = !this.isAccordionOpen;
  }

  private checkIfInMapRoute() {
    const currentUrl = this.router.url;
    this.isInMapRoute = /^\/map\/\d+$/.test(currentUrl);
  }

  returnToMapSelection() {
    this.isAccordionOpen = false;
    this.router.navigate(['/select-map']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const accordionButton = target.closest('.accordion-button');
    const accordionMenu = target.closest('.accordion-menu');
    
    if (!accordionButton && !accordionMenu && this.isAccordionOpen) {
      this.isAccordionOpen = false;
    }
  }

  confirmLogout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.authService.logout();
    this.router.navigate(['/login']);
    this.confirmDialogVisible = false;
  }

  onCancel() {
    this.confirmDialogVisible = false;
  }

  openConfirmDialog(title: string, message: string) {
    this.confirmDialogTitle = title;
    this.confirmDialogMessage = message;
    this.confirmDialogVisible = true;
  }

  exitGame() {
    this.exitEvent.emit();
  }

  toggleStore() {
    if (this.store) {
      this.store.toggle();
    }
  }

  toggleBackpack() {
    if (this.backpack) {
      this.backpack.toggle();
    }
  }

  toggleMap() {
    if (this.map) {
      // Atualiza o ID da fase antes de abrir o mapa
      if (this.currentPhaseId) {
        this.map.currentPhaseId = this.currentPhaseId;
      }
      // Se não tiver fase mas tiver gameMapId, passa o gameMapId
      if (this.gameMapId) {
        this.map.gameMapId = this.gameMapId;
      }
      this.map.toggle();
    }
  }
  
  onStoreStateChanged(isOpen: boolean) {
    this.storeToggleEvent.emit(isOpen);
  }

  private loadUserData() {
    const currentUser = this.userService.getCurrentUser();
    
    if (currentUser) {
      this.userData = currentUser;
    } else {
      console.error('❌ Usuário não encontrado no localStorage');
      this.router.navigate(['/login']);
    }
  }

  private subscribeToUserData() {
    this.userDataSubscription = this.dataService.userData$.subscribe(userData => {
      if (userData) {
        this.userData = userData;
        this.checkReputation();
      }
    });
  }

  private checkReputation() {
    if (this.userData && this.userData.reputation < 0) {
      this.router.navigate(['/game-over']);
    }
  }

  public refreshUserData(): void {
    this.loadUserData();
    this.checkReputation();
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.timerPaused && this.remainingTimeInSeconds > 0) {
        this.remainingTimeInSeconds--;
        
        const hours = Math.floor(this.remainingTimeInSeconds / 3600);
        const minutes = Math.floor((this.remainingTimeInSeconds % 3600) / 60);
        const seconds = this.remainingTimeInSeconds % 60;

        this.currentTime = `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
        
        if (this.remainingTimeInSeconds === 0) {
          this.handleTimeExpired();
        }
      }
    }, 1000);
  }

  activateWatch() {
    if (!this.watchTimerInterval) {
      this.timerPaused = true;

      this.watchStartTime = Date.now();
      let watchSecondsRemaining = 59;
      
      this.watchTimerInterval = setInterval(() => {
        watchSecondsRemaining--;

        if (watchSecondsRemaining <= 0) {
          clearInterval(this.watchTimerInterval);
          this.watchTimerInterval = null;
          this.watchTime = '';
          this.timerPaused = false;
        } else {
          const minutes = Math.floor(watchSecondsRemaining / 60);
          const seconds = watchSecondsRemaining % 60;
          this.watchTime = `+${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
        }
      }, 1000);
    }
  }

  private handleTimeExpired(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.watchTimerInterval) {
      clearInterval(this.watchTimerInterval);
    }
    
    this.timeExpiredEvent.emit();
  }

  private padNumber(num: number): string {
    return num.toString().padStart(2, '0');
  }

  getUserAvatarUrl(): string {
    if (!this.userData?.avatar?.filePath) {
      return 'assets/images/characters/default-avatar.png';
    }
    
    return FileUrlBuilder.avatar(this.userData.avatar.filePath);
  }

  onAvatarImageError(event: Event): void {
  }

  /**
   * Exibe um badge ao lado do tempo (p.ex. "+60", "x2") por `durationMs` milissegundos.
   * className recomendado: 'badge-green' | 'badge-yellow' | 'badge-frozen'
   */
  public showTimeBadge(label: string, className: string = 'badge-green', durationMs: number = 600000): void {
    // limpa timeout anterior
    if (this._timeBadgeTimeout) {
      clearTimeout(this._timeBadgeTimeout);
      this._timeBadgeTimeout = null;
    }

    this.timeBadge = { label, class: className };

    if (durationMs > 0) {
      this._timeBadgeTimeout = setTimeout(() => {
        this.timeBadge = null;
        this._timeBadgeTimeout = null;
      }, durationMs);
    }
  }

  /**
   * Marca/desmarca o estado de congelamento do tempo.
   * Quando `active = true`, o timer do header deverá estar pausado externamente.
   */
  public setIceActive(active: boolean): void {
    this.iceActive = !!active;
  }

  /**
   * Marca/desmarca o estado de reputação em dobro.
   */
  public setDoubleReputationActive(active: boolean): void {
    this.doubleReputationActive = !!active;
  }
}
