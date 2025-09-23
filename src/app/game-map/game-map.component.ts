import { Component, ViewChild, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';
import { Subscription } from 'rxjs';
import { StorageService } from '../../services/storage.service';
import { StoreComponent } from "../store/store.component";
import { AuthService } from '../auth/auth.service';
import { DataService, UserResponse } from '../../services/data.service';
import { User, UserService } from '../../services/user.service';
import { Router, RouterModule } from '@angular/router';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { NodeActivityComponent } from './node-activity/node-activity.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';

// ✅ Imports atualizados - usando PhaseUser diretamente
import { GameMapService, PhaseUser } from '../../services/game-map.service';
import { Phase, Character } from '../../services/phase.service';

@Component({
  selector: 'game-map',
  standalone: true,
  imports: [
    HeaderComponent,
    LucideIconsModule,
    RouterModule,
    ConfirmDialogComponent,
    NodeActivityComponent,
    CommonModule
  ],
  templateUrl: './game-map.component.html',
  styleUrl: './game-map.component.css'
})
export class GameMapComponent implements OnInit {

  // User data
  userData?: User;
  userLoadError: string = '';

  @ViewChild(StoreComponent) store!: StoreComponent;
  private userDataSubscription?: Subscription;

  confirmDialogVisible: boolean = false;
  confirmDialogTitle: string = '';
  confirmDialogMessage: string = '';
  private confirmCallback: (() => void) | null = null;

  // ✅ Usando PhaseUser diretamente
  phaseUsers: PhaseUser[] = [];
  gameMapId: number = 1; // ID do GameMap - você pode fazer isso dinâmico
  userId: number = 0; // ID do usuário logado
  isLoadingPhases: boolean = false;
  phasesError: string = '';

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private userService: UserService,
    private router: Router,
    private gameMapService: GameMapService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userIdStr = localStorage.getItem('userId');
      if (userIdStr) {
        this.userId = Number(userIdStr);
        
        // Inscreve-se nas atualizações de dados do usuário
        this.userDataSubscription = this.dataService.userData$.subscribe(userData => {
          if (userData) {
            this.userData = userData;
          }
        });

        // Carrega os dados iniciais
        this.loadUserData(this.userId);
        
        // ✅ Carrega as fases do GameMap para este usuário
        this.loadPhaseUsers();
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  // ✅ Método renomeado e simplificado
  public loadPhaseUsers() {
    this.isLoadingPhases = true;
    this.phasesError = '';
        
    this.gameMapService.getAllPhasesByUser(this.gameMapId, this.userId).subscribe({
      next: (phaseUsers: PhaseUser[]) => {
        this.phaseUsers = phaseUsers;
        this.isLoadingPhases = false;
      },
      error: (error) => {
        console.error('❌ Erro ao carregar fases:', error);
        this.isLoadingPhases = false;
        
        if (error.status === 404) {
          this.phasesError = 'GameMap não encontrado ou usuário sem fases';
        } else {
          this.phasesError = 'Erro ao carregar fases do mapa';
        }
        
        // ✅ Fallback para dados estáticos se a API falhar
        this.loadStaticPhaseUsers();
      }
    });
  }

  // ✅ Fallback usando PhaseUser diretamente
  private loadStaticPhaseUsers() {
    console.log('📝 Carregando dados estáticos como fallback');
    this.phaseUsers = [
      {
        id: 1,
        phase: {
          id: 1,
          title: 'Explorar o Campus',
          description: 'Primeira fase do jogo',
          type: 'BUILD',
          mode: 'BASIC',
          maxTime: 3600,
          character: { 
            id: 1, 
            name: 'Professor', 
            filePath: 'character_teacher_01.png' 
          },
          gameMap: {
            id: 1,
            title: 'Campus Virtual',
            users: [],
            phases: []
          },
          diagramInitial: '',
          correctDiagrams: [],
          characterDialogues: []
        },
        user: this.userData!,
        status: 'COMPLETED',
        reputation: 140,
        coins: 50
      },
      {
        id: 2,
        phase: {
          id: 2,
          title: 'Construir Diagrama',
          description: 'Segunda fase do jogo',
          type: 'BUILD',
          mode: 'BASIC',
          maxTime: 3600,
          character: { 
            id: 1, 
            name: 'Professor', 
            filePath: 'character_teacher_01.png' 
          },
          gameMap: {
            id: 1,
            title: 'Campus Virtual',
            users: [],
            phases: []
          },
          diagramInitial: '',
          correctDiagrams: [],
          characterDialogues: []
        },
        user: this.userData!,
        status: 'AVAILABLE',
        reputation: 0,
        coins: 0
      },
      {
        id: 3,
        phase: {
          id: 3,
          title: 'Corrigir Erros',
          description: 'Terceira fase do jogo',
          type: 'FIX',
          mode: 'INTERMEDIATE',
          maxTime: 2400,
          character: { 
            id: 1, 
            name: 'Professor', 
            filePath: 'character_teacher_01.png' 
          },
          gameMap: {
            id: 1,
            title: 'Campus Virtual',
            users: [],
            phases: []
          },
          diagramInitial: '',
          correctDiagrams: [],
          characterDialogues: []
        },
        user: this.userData!,
        status: 'LOCKED',
        reputation: 0,
        coins: 0
      }
    ];
  }

  // ✅ Métodos auxiliares usando PhaseUser
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
      // Exemplo: accuracy baseado na reputation (pode ajustar a fórmula)
      return Math.min(Math.round((phaseUser.reputation / 200) * 100), 100);
    }
    return 0;
  }

  getCharacterImagePath(phaseUser: PhaseUser): string {
    return `http://localhost:9090/uploads/characters/${phaseUser.phase.character.filePath}`;
  }

  // ✅ Método para atualizar GameMap ID dinamicamente
  setGameMapId(newGameMapId: number) {
    this.gameMapId = newGameMapId;
    this.loadPhaseUsers();
  }

  // ✅ Método para atualizar User ID dinamicamente (se necessário)
  setUserId(newUserId: number) {
    this.userId = newUserId;
    this.loadPhaseUsers();
  }

  // ✅ Método para recarregar dados quando necessário
  refreshPhaseUsers() {
    this.loadPhaseUsers();
  }

  toggleStore() {
    this.store.toggle();
  }

  logout() {
    this.openConfirmDialog(
      'Tem certeza que deseja fazer logout?',
      'Você precisará fazer o login novamente caso deseje entrar',
    );
  }

  confirmLogout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userId');
    }
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onCancel() {
    this.confirmDialogVisible = false;
  }

  private loadUserData(userId: number) {
    this.userService.getUserById(userId).subscribe({
      next: (user: User) => {
        this.userData = user;
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

  openConfirmDialog(title: string, message: string) {
    this.confirmDialogTitle = title;
    this.confirmDialogMessage = message;
    this.confirmDialogVisible = true;
  }

  openGamePhase() {
    this.router.navigate(["/game"]);
  }

  ngOnDestroy() {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }
}
