import { Component, Input, Output } from '@angular/core';
import { LucideIconsModule } from '../../lucide-icons.module';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Game } from '../game-map.component';

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

  @Input() game!: Game;
  @Input() last!: boolean;

  constructor(private router: Router) {

  }

  openGamePhase() {
    if (this.game.unlocked) {
      this.router.navigate(['/game', this.game.idPhase]);
    }
  }
}
