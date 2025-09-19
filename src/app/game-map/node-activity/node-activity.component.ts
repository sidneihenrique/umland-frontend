import { Component, Input, Output } from '@angular/core';
import { LucideIconsModule } from '../../lucide-icons.module';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PhaseUser } from '../../../services/game-map.service';
// ✅ Import da configuração global
import { FileUrlBuilder } from '../../../config/files.config';

export interface Character {
  name: string;
  filePath: string;
}

@Component({
  selector: 'node-activity',
  standalone: true,
  imports: [
    LucideIconsModule,
    RouterModule,
    CommonModule
],
  templateUrl: './node-activity.component.html',
  styleUrl: './node-activity.component.css'
})
export class NodeActivityComponent {

  @Input() phase!: PhaseUser;
  @Input() last!: boolean;

  constructor(private router: Router) {

  }

  // ✅ Método para construir URL correta da imagem do character
  getCharacterImageUrl(): string {
    return FileUrlBuilder.character(this.phase.phase.character.filePath);
  }

  openGamePhase() {
    if (this.phase.status === 'AVAILABLE' || this.phase.status === 'COMPLETED') {
      this.router.navigate(['/game', this.phase.phase.id]);
    }
  }
}
