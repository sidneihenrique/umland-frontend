import { Component, ViewChild, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';
import { Subscription } from 'rxjs';
import { StorageService } from '../../services/storage.service';
import { StoreComponent } from "../store/store.component";
import { AuthService } from '../auth/auth.service';
import { DataService, UserResponse } from '../../services/data.service';
import { User, UserService } from '../../services/user.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NodeActivityComponent } from './node-activity/node-activity.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';

// ✅ Imports atualizados
import { GameMapService, PhaseUser } from '../../services/game-map.service';
import { Phase, Character } from '../../services/phase.service';

@Component({
  selector: 'game-map',
  standalone: true,
  imports: [
    HeaderComponent,
    LucideIconsModule,
    RouterModule,
    NodeActivityComponent,
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
  gameMapId: number = 0;
  userId: number = 0;
  isLoadingPhases: boolean = false;
  phasesError: string = '';

  // ✅ ADICIONAR: Estado da associação GameMap-User
  isAssociatingUser: boolean = false;
  associationError: string = '';

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private gameMapService: GameMapService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // ✅ Obter gameMapId da URL
      this.gameMapId = Number(this.route.snapshot.paramMap.get('id'));
      console.log('🗺️ GameMapId obtido da URL:', this.gameMapId);

      // ✅ Verificar se gameMapId é válido
      if (!this.gameMapId || this.gameMapId <= 0) {
        console.error('❌ GameMapId inválido:', this.gameMapId);
        this.router.navigate(['/select-map']);
        return;
      }

      // ✅ Usar getCurrentUser()
      const currentUser = this.userService.getCurrentUser();
      
      if (currentUser && currentUser.id) {
        this.userId = currentUser.id;
        this.userData = currentUser;
        console.log('👤 Usuário atual obtido:', { id: this.userId, name: currentUser.name });
        
        // Inscreve-se nas atualizações de dados do usuário
        this.userDataSubscription = this.dataService.userData$.subscribe(userData => {
          if (userData) {
            this.userData = userData;
          }
        });

        // ✅ NOVO: Primeiro associar usuário ao GameMap, depois carregar fases
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
    
    console.log('🔗 Associando usuário ao GameMap:', { 
      gameMapId: this.gameMapId, 
      userId: this.userId 
    });

    this.gameMapService.setGameMapToUser(this.gameMapId, this.userId).subscribe({
      next: (gameMap) => {
        console.log('✅ Usuário associado ao GameMap com sucesso:', gameMap);
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
          console.log('📝 GameMap ou usuário não encontrado');
          this.associationError = 'GameMap ou usuário não encontrado';
          
          // ✅ Tentar carregar mesmo assim (pode já estar associado)
          this.loadUserData(this.userId);
          this.loadPhaseUsers();
          
        } else if (error.status === 400) {
          console.log('⚠️ Dados inválidos - usuário pode já estar associado');
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
    
    console.log('📡 Carregando fases do mapa:', { 
      gameMapId: this.gameMapId, 
      userId: this.userId 
    });
        
    this.gameMapService.getAllPhasesByUser(this.gameMapId, this.userId).subscribe({
      next: (phaseUsers: PhaseUser[]) => {
        this.phaseUsers = phaseUsers;
        this.isLoadingPhases = false;
        console.log('✅ Fases carregadas:', phaseUsers.length);
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

  // ✅ Fallback usando PhaseUser diretamente (mantido igual)
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
            id: this.gameMapId,
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
            id: this.gameMapId,
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
            id: this.gameMapId,
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

  // ✅ Métodos auxiliares (mantidos iguais)
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
    return `http://localhost:9090/uploads/characters/${phaseUser.phase.character.filePath}`;
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

  // ✅ Método para carregar dados do usuário (mantido igual)
  private loadUserData(userId: number) {
    this.userService.getUserById(userId).subscribe({
      next: (user: User) => {
        this.userData = user;
        console.log('✅ Dados do usuário atualizados do backend:', user);
      },
      error: (error) => {
        console.error('⚠️ Erro ao carregar dados atualizados do usuário:', error);
        console.log('📱 Usando dados do localStorage como fallback');
      }
    });
  }

  get userName(): string {
    return this.userData?.name || '';
  }

  openGamePhase() {
    this.router.navigate(["/game"]);
  }

  // ✅ ADICIONAR: Getter para estado de loading geral
  get isLoading(): boolean {
    return this.isAssociatingUser || this.isLoadingPhases;
  }

  // ✅ ADICIONAR: Getter para mensagens de erro
  get errorMessage(): string {
    return this.associationError || this.phasesError;
  }

  ngOnDestroy() {
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }
}
