import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-over',
  imports: [],
  templateUrl: './game-over.component.html',
  styleUrl: './game-over.component.css'
})
export class GameOverComponent {

  constructor(private router: Router) {}

  goToMapSelection() {
    this.router.navigate(['/select-map']);
  }

}
