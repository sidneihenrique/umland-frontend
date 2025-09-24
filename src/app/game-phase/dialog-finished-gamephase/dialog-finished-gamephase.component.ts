import { Component, OnInit, Input, OnChanges, SimpleChanges, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  @Input() phaseUser: PhaseUser | null | undefined = null; // ✅ ADICIONAR: Receber PhaseUser
  
  reputationSum: number = 0;
  coinsSum: number = 0;

  @Output() backToMenuEvent = new EventEmitter<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService,
    private phaseUserService: PhaseUserService, // ✅ ADICIONAR
    private userService: UserService // ✅ ADICIONAR
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

  // ✅ CORRIGIR: Método principal para atualizar dados
  private updateSums() {
    this.reputationSum = this.calculateReputationSum(this.accuracy);
    this.coinsSum = this.calculateCoinsSum(this.accuracy);
    
    // ✅ Atualizar dados no backend
    this.updateBackendData();
  }

  // ✅ NOVO: Método para atualizar dados no backend
  private updateBackendData() {
    if (!isPlatformBrowser(this.platformId)) return;

    const userJson = localStorage.getItem('user');
    if (!userJson || !this.phaseUser) {
      console.warn('⚠️ Dados do usuário ou phaseUser não disponíveis');
      return;
    }

    try {
      const userData: User = JSON.parse(userJson);

      // ✅ 1. Atualizar PhaseUser com status de conclusão
      const updatedPhaseUser: PhaseUser = {
        ...this.phaseUser,
        isCompleted: true, // Marcar como concluída
        accuracy: this.accuracy, // Salvar acurácia final (se existir campo)
        coins: this.coinsSum,
        reputation: this.reputationSum
      };

      // ✅ 2. Atualizar usuário com recompensas
      const updatedUser: User = {
        ...userData,
        coins: (userData.coins || 0) + this.coinsSum,
        reputation: (userData.reputation || 0) + this.reputationSum,
        progressing: this.reputationSum >= 0
      };

      console.log('💾 Atualizando dados:', {
        phaseUserId: this.phaseUser.id,
        userId: userData.id,
        accuracy: this.accuracy,
        coinsGain: this.coinsSum,
        reputationGain: this.reputationSum
      });

      // ✅ 3. Salvar PhaseUser no backend
      this.phaseUserService.updatePhaseUser(this.phaseUser.id, updatedPhaseUser).subscribe({
        next: (savedPhaseUser) => {
          console.log('✅ PhaseUser atualizada:', savedPhaseUser);
          
          // ✅ 4. Salvar usuário no backend
          this.userService.updateUser(userData.id, updatedUser).subscribe({
            next: (savedUser) => {
              console.log('✅ Usuário atualizado:', savedUser);
              
              // ✅ 5. Atualizar localStorage
              localStorage.setItem('user', JSON.stringify(savedUser));
              
              // ✅ 6. Atualizar DataService
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

  // ✅ NOVO: Fallback para atualização local
  private updateLocalData(userData: User) {
    localStorage.setItem('user', JSON.stringify(userData));
    this.dataService.updateUserData(userData);
    console.log('📱 Dados atualizados localmente como fallback');
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

  backToMenu() {
    this.backToMenuEvent.emit();
  }
}
