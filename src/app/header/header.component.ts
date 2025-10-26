import { Component, OnInit, EventEmitter, Input, Output, ViewChild, ViewContainerRef, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { LucideIconsModule } from '../lucide-icons.module';
import { StorageService } from '../../services/storage.service';
import { StoreComponent } from "../store/store.component";
import { BackpackComponent } from "../backpack/backpack.component";
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

import { FileUrlBuilder } from '../../config/files.config';

@Component({
  selector: 'app-header',
  imports: [
    LucideIconsModule, 
    StoreComponent, 
    BackpackComponent, 
    CommonModule,
    ConfirmDialogComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy{

  @Output() exitEvent = new EventEmitter<void>();
  @Output() storeToggleEvent = new EventEmitter<boolean>();

  @Input() parentType!: 'game-phase' | 'game-map' | 'game-map-select';

  userData?: User;

  @ViewChild(StoreComponent) store!: StoreComponent;
  @ViewChild(BackpackComponent) backpack!: BackpackComponent;

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
    if (this.parentType === 'game-phase') {
      this.startTimer();
    }

    this.checkIfInMapRoute();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfInMapRoute();
    });
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
  
  onStoreStateChanged(isOpen: boolean) {
    this.storeToggleEvent.emit(isOpen);
  }

  private loadUserData() {
    const currentUser = this.userService.getCurrentUser();
    
    if (currentUser) {
      this.userData = currentUser;
      console.log('✅ Dados do usuário carregados no header:', this.userData);
    } else {
      console.error('❌ Usuário não encontrado no localStorage');
      this.router.navigate(['/login']);
    }
  }

  private subscribeToUserData() {
    this.userDataSubscription = this.dataService.userData$.subscribe(userData => {
      if (userData) {
        this.userData = userData;
        console.log('✅ Dados do usuário atualizados no header:', this.userData);
      }
    });
  }

  public refreshUserData(): void {
    this.loadUserData();
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
    if (!this.watchTimerInterval) {
      this.timerPaused = true;
      this.pausedTime = Date.now();

      this.watchStartTime = Date.now();
      this.watchTimerInterval = setInterval(() => {
        const remainingTime = this.watchDuration - (Date.now() - this.watchStartTime);

        if (remainingTime <= 0) {
          clearInterval(this.watchTimerInterval);
          this.watchTimerInterval = null;
          this.watchTime = '';

          this.timerPaused = false;
          const pauseDuration = Date.now() - this.pausedTime;
          this.startTime += pauseDuration;
        } else {
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

  getUserAvatarUrl(): string {
    if (!this.userData?.avatar?.filePath) {
      return 'assets/images/characters/default-avatar.png';
    }
    
    return FileUrlBuilder.avatar(this.userData.avatar.filePath);
  }

  onAvatarImageError(event: Event): void {
  }
}
