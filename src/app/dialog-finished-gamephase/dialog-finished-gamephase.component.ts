import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';

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


}
