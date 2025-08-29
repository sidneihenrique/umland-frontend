import { Component, ViewChild, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';
import { Subscription } from 'rxjs';
import { StorageService } from '../../services/storage.service';
import { StoreComponent } from "../store/store.component";
import { AuthService } from '../auth/auth.service';
import { DataService, User, UserResponse } from '../../services/data.service';
import { Router, RouterModule } from '@angular/router';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'game-map',
  standalone: true,
  imports: [
    LucideIconsModule,
    RouterModule,
    ConfirmDialogComponent
  ],
  templateUrl: './game-map.component.html',
  styleUrl: './game-map.component.css'
})
export class GameMapComponent implements OnInit{

  // User data
  userData?: User;
  userLoadError: string = '';

  @ViewChild(StoreComponent) store!: StoreComponent;
  private userDataSubscription?: Subscription;

  confirmDialogVisible: boolean = false;
  confirmDialogTitle: string = '';
  confirmDialogMessage: string = '';
  private confirmCallback: (() => void) | null = null;

  constructor(
      private authService: AuthService,
      @Inject(PLATFORM_ID) private platformId: Object,
      private dataService: DataService,
      private router: Router) {

  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        // Inscreve-se nas atualizações de dados do usuário
        this.userDataSubscription = this.dataService.userData$.subscribe(userData => {
          if (userData) {
            this.userData = userData;
          }
        });

        // Carrega os dados iniciais
        this.loadUserData(userId);
      } else {
        this.router.navigate(['/login']);
      }
    }
  }


  toggleStore() {
    this.store.toggle();
  }

  logout() {
    this.openConfirmDialog(
      'Tem certeza que deseja fazer logout?',
      'Você precisará fazer o login novamente caso deseje entrar',
      () => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('userId');
        }
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    );
  }

  confirmLogout() {

  }

  onCancel() {
    this.confirmDialogVisible = false;
  }


  private loadUserData(userId: string) {
    this.dataService.getUserById(userId).subscribe({
      next: (response: UserResponse) => {
        this.userData = response.user;
      },
      error: (error) => {
        console.error('Erro ao carregar dados do usuário:', error);
        this.userLoadError = 'Erro ao carregar dados do usuário';
        this.router.navigate(['/login']);
      }
    });
  }

  get userName(): string {
    return this.userData?.name || '';
  }

  openConfirmDialog(title: string, message: string, onConfirm: () => void) {
    this.confirmDialogTitle = title;
    this.confirmDialogMessage = message;
    this.confirmLogout = onConfirm;
    this.confirmDialogVisible = true;
  }

  openGamePhase(){
    this.router.navigate(["/game"]);
  }

}
