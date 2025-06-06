import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GamePhaseComponent } from './game-phase/game-phase.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, GamePhaseComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'umland-frontend';
}
