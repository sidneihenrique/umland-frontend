import { Component, OnInit } from '@angular/core';
import { LucideIconsModule } from '../lucide-icons.module';

@Component({
  selector: 'app-dialog-finished-gamephase',
  standalone: true,
  imports: [LucideIconsModule],
  templateUrl: './dialog-finished-gamephase.component.html',
  styleUrl: './dialog-finished-gamephase.component.css'
})
export class DialogFinishedGamephaseComponent implements OnInit {
  
  visible: boolean = false;
  reputationSum: number = 0;
  coinsSum: number = 0;
  

  ngOnInit() {
    // Simula a soma de reputação, você pode substituir isso pela lógica real
    this.visible = true; // Torna o diálogo visível quando o componente é inicializado
    this.reputationSum = 100; // Exemplo de valor
    this.coinsSum = 50; // Exemplo de valor
  }


}
