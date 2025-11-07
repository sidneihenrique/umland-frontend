import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-game-over',
  imports: [],
  templateUrl: './game-over.component.html',
  styleUrl: './game-over.component.css'
})
export class GameOverComponent {

  constructor(private router: Router,
              private userService: UserService
  ) {}

  goToMapSelection() {
    this.userService.resetCurrentUserGameData().subscribe({
      next: (updatedUser) => {
        // merge: preserva campos locais não retornados pelo backend
        const local = this.userService.getCurrentUser() || {};
        const merged = { ...local, ...updatedUser };
        try { localStorage.setItem('currentUser', JSON.stringify(merged)); } catch (e) { console.warn(e); }

        // navegar só depois de processar a resposta
        this.router.navigate(['/select-map']);
      },
      error: (err) => {
        console.error('Erro ao resetar dados do usuário', err);
        // opcional: notificar o usuário; ainda podemos navegar
        this.router.navigate(['/select-map']);
      }
    });
  }

}
