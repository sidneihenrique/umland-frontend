import { Component, OnInit, EventEmitter, Input, Output, ViewChild, ViewContainerRef, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { LucideIconsModule } from '../lucide-icons.module';
import { StorageService } from '../../services/storage.service';
import { StoreComponent } from "../store/store.component";
import { BackpackComponent } from "../backpack/backpack.component";
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component'; // ✅ ADICIONAR
import { DataService, UserResponse } from '../../services/data.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { User } from '../../services/user.service';
import { AuthService } from '../auth/auth.service'; // ✅ ADICIONAR
import { isPlatformBrowser } from '@angular/common';

import { FileUrlBuilder } from '../../config/files.config';

@Component({
  selector: 'app-header',
  imports: [
    LucideIconsModule, 
    StoreComponent, 
    BackpackComponent, 
    CommonModule,
    ConfirmDialogComponent // ✅ ADICIONAR
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy{

  @Output() exitEvent = new EventEmitter<void>();
  @Output() storeToggleEvent = new EventEmitter<boolean>();
  // ✅ REMOVER: logoutEvent (agora é tratado internamente)

  @Input() parentType!: 'game-phase' | 'game-map' | 'game-map-select'; // ✅ ADICIONAR: novo tipo

  userData?: User;

  // Referência para o componente Store (loja de itens)
  @ViewChild(StoreComponent) store!: StoreComponent;

  // Referência para o componente Backpack (mochila)
  @ViewChild(BackpackComponent) backpack!: BackpackComponent;

  // ✅ ADICIONAR: Propriedades para o modal de logout
  confirmDialogVisible: boolean = false;
  confirmDialogTitle: string = '';
  confirmDialogMessage: string = '';

  currentTime: string = '00:00:00';
  watchTime: string = '';
  private timerInterval: any;
  private watchTimerInterval: any;
  private timerPaused: boolean = false;
  private pausedTime: number = 0;
  private watchStartTime: number = 0;
  private watchDuration: number = 59 * 1000; // 59 seconds
  private startTime: number = 0;

  constructor(
    private dataService: DataService,
    private userService: UserService,
    private authService: AuthService, // ✅ ADICIONAR
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object // ✅ ADICIONAR
  ) {}

  ngOnInit(): void {
    // ✅ ATUALIZAR: Usar getCurrentUser() ao invés de getUserById()
    this.loadUserData();
    if (this.parentType === 'game-phase') {
      this.startTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.watchTimerInterval) {
      clearInterval(this.watchTimerInterval);
    }
  }

  // ✅ ALTERAR: Método logout agora abre o modal
  logout() {
    this.openConfirmDialog(
      'Tem certeza que deseja fazer logout?',
      'Você precisará fazer o login novamente caso deseje entrar'
    );
  }

  // ✅ ADICIONAR: Método para confirmar logout
  confirmLogout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.authService.logout();
    this.router.navigate(['/login']);
    this.confirmDialogVisible = false;
  }

  // ✅ ADICIONAR: Método para cancelar logout
  onCancel() {
    this.confirmDialogVisible = false;
  }

  // ✅ ADICIONAR: Método para abrir modal de confirmação
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

  // ✅ ATUALIZAR: Método para carregar dados do usuário usando getCurrentUser()
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

  // ✅ ADICIONAR: Método para atualizar dados do usuário (chamado quando houver mudanças)
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
      // Pause the main timer
      this.timerPaused = true;
      this.pausedTime = Date.now();

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

  getUserAvatarUrl(): string {
    if (!this.userData?.avatar?.filePath) {
      // Fallback para avatar padrão
      return 'assets/images/characters/default-avatar.png';
    }
    
    // Usar FileUrlBuilder para construir URL correta
    return FileUrlBuilder.avatar(this.userData.avatar.filePath);
  }

  onAvatarImageError(event: Event): void {
    // Tratamento de erro de imagem se necessário
  }
}
