import { Component, OnInit, Input, OnChanges, SimpleChanges, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { LucideIconsModule } from '../../lucide-icons.module';
import { DataService } from '../../../services/data.service';
import { PhaseUserService } from '../../../services/phase-user.service';
import { UserService, User } from '../../../services/user.service';
import { PhaseUser } from '../../../services/game-map.service';

@Component({
  selector: 'app-dialog-finished-gamephase',
  standalone: true,
  imports: [LucideIconsModule, CommonModule],
  templateUrl: './dialog-finished-gamephase.component.html',
  styleUrl: './dialog-finished-gamephase.component.css'
})
export class DialogFinishedGamephaseComponent implements OnInit {
  visible: boolean = false;
  @Input() accuracy: number = 0;
  @Input() doubleReputationActive: boolean = false;
  @Input() phaseUser: PhaseUser | null | undefined = null; 
  
  reputationSum: number = 0;
  coinsSum: number = 0;

  // ✅ IDs das fases que redirecionam para créditos (finais do jogo)
  private readonly FINAL_PHASE_IDS = [26, 22, 19, 16];

  @Output() backToMenuEvent = new EventEmitter<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private phaseUserService: PhaseUserService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.visible = true;
    this.updateSums();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['accuracy']) {
      this.updateSums();
    }
  }

  // Método principal para atualizar dados
  private updateSums() {
    this.reputationSum = this.calculateReputationSum(this.accuracy);
    this.coinsSum = this.calculateCoinsSum(this.accuracy);

    if(this.doubleReputationActive) {
      this.reputationSum *= 2;
      this.coinsSum *= 2;
    }
    
    this.updateBackendData();
  }

  private updateBackendData() {
    if (!isPlatformBrowser(this.platformId)) return;

    const userData = this.userService.getCurrentUser();
    
    if (!userData || !this.phaseUser) {
      console.warn('⚠️ Dados do usuário ou phaseUser não disponíveis');
      return;
    }

    console.log('💰 Moedas ANTES de finalizar fase:', userData.coins);
    console.log('💰 Moedas que vão ser ADICIONADAS:', this.coinsSum);

    try {
      // ✅ 1. Atualizar PhaseUser com status de conclusão
      const updatedPhaseUser: PhaseUser = {
        ...this.phaseUser,
        isCompleted: true, // Marcar como concluída
        accuracy: this.accuracy, // Salvar acurácia final (se existir campo)
        coins: this.coinsSum,
        reputation: this.reputationSum,
        current: false, // Garantir que não está mais em andamento
        status: 'COMPLETED',
        userDiagram: JSON.stringify(this.phaseUser.userDiagram) // Garantir que o diagrama do usuário seja salvo
      };

      // ✅ 2. Atualizar usuário com recompensas INCREMENTAIS
      const updatedUser: User = {
        ...userData,
        coins: (userData.coins || 0) + this.coinsSum,
        reputation: (userData.reputation || 0) + this.reputationSum,
        progressing: this.reputationSum >= 0
      };

      console.log('💰 Moedas DEPOIS do cálculo:', updatedUser.coins);

      // ✅ 3. Salvar PhaseUser no backend
      this.phaseUserService.updatePhaseUser(this.phaseUser.id, updatedPhaseUser).subscribe({
        next: (savedPhaseUser) => {

          if (updatedPhaseUser.accuracy && updatedPhaseUser.accuracy >= 40) {
            this.phaseUserService.unlockNextPhaseForUser(savedPhaseUser.phase.id!, savedPhaseUser.user.id!).subscribe({
              next: () => {
                console.log('✅ Próxima fase desbloqueada com sucesso!');
              },
              error: (error) => {
                console.error('❌ Erro ao desbloquear próxima fase:', error);
              }
            });
          }
          
          // ✅ 4. Salvar usuário no backend
          this.userService.updateUser(userData.id, updatedUser).subscribe({
            next: (savedUser) => {
              console.log('✅ Usuário atualizado no backend:', savedUser);
              console.log('💰 Moedas salvas no backend:', savedUser.coins);
              
              // ✅ 5. Atualizar localStorage IMEDIATAMENTE
              localStorage.setItem('currentUser', JSON.stringify(savedUser));
              
              // ✅ 6. Atualizar DataService (notifica todos os componentes)
              this.dataService.updateUserData(savedUser);
              
            },
            error: (error) => {
              console.error('❌ Erro ao atualizar usuário:', error);
              // ✅ Fallback: atualizar apenas localmente
              this.updateLocalData(updatedUser);
            }
          });
        },
        error: (error) => {
          console.error('❌ Erro ao atualizar PhaseUser:', error);
          // ✅ Fallback: atualizar apenas dados do usuário localmente
          this.updateLocalData(updatedUser);
        }
      });

    } catch (error) {
      console.error('❌ Erro ao processar dados:', error);
    }
  }

  // ✅ CORRIGIR: Fallback para atualização local usando getCurrentUser
  private updateLocalData(userData: User) {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    this.dataService.updateUserData(userData);
  }

  // ✅ CORRIGIR: Sistema de cálculo mais equilibrado
  calculateReputationSum(accuracy: number): number {
    // ✅ Sistema baseado no que você implementou no game-phase
    if (accuracy >= 80) {
      // Excelente: +40 a +50 reputação
      return Math.floor(40 + (accuracy - 80) * 0.5);
    } else if (accuracy >= 60) {
      // Bom: +10 a +39 reputação
      return Math.floor(10 + (accuracy - 60) * 1.45);
    } else if (accuracy >= 40) {
      // Regular: -10 a +9 reputação
      return Math.floor(-10 + (accuracy - 40) * 0.95);
    } else {
      // Ruim: -25 a -11 reputação
      return Math.floor(-25 + accuracy * 0.35);
    }
  }

  calculateCoinsSum(accuracy: number): number {
    // ✅ Sistema simples: moedas nunca negativas
    return Math.max(0, Math.floor(accuracy));
  }

  // ✅ Verifica se a fase atual é uma fase final (método público para uso no template)
  isFinalPhase(): boolean {
    if (!this.phaseUser?.phase?.id) return false;
    return this.FINAL_PHASE_IDS.includes(this.phaseUser.phase.id);
  }

  backToMenu() {
    // ✅ Se for uma fase final, redirecionar para créditos
    if (this.isFinalPhase()) {
      console.log('🎬 Fase final concluída! Redirecionando para créditos...');
      this.router.navigate(['/credits']);
    } else {
      // ✅ Caso contrário, emitir evento normal para voltar ao mapa
      this.backToMenuEvent.emit();
    }
  }
}
