import { Component, OnInit, Input, OnChanges, SimpleChanges, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LucideIconsModule } from '../../lucide-icons.module';
import { DataService } from '../../../services/data.service';

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
  reputationSum: number = 0;
  coinsSum: number = 0;

  @Output() backToMenuEvent = new EventEmitter<void>();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService
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

  private updateSums() {
    this.reputationSum = this.calculateReputationSum(this.accuracy);
    this.coinsSum = this.calculateCoinsSum(this.accuracy);
    this.updateUserData();
  }

  private updateUserData() {
    if (isPlatformBrowser(this.platformId)) {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        
        // Atualiza dinheiro e reputação
        userData.money += this.coinsSum;
        userData.reputation += this.reputationSum;
        
        // Atualiza o progressing com base na reputação ganha
        userData.progressing = this.reputationSum >= 0;
        
        // Salva as alterações usando o DataService
        this.dataService.updateUserData(userData);
      }
    }
  }

  calculateReputationSum(accuracy: number): number {
    // Se accuracy < 50, retorna negativo proporcional
    if (accuracy < 50) {
      return -Math.round(100 - accuracy);
    }
    // Caso contrário, retorna proporcional positivo
    return Math.round(accuracy);
  }

  calculateCoinsSum(accuracy: number): number {
    // Exemplo: moedas máximas 50, proporcional à acurácia
    return Math.round((accuracy / 100) * 50);
  }

  backToMenu () {
    this.backToMenuEvent.emit();
  }
}
