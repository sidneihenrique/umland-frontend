import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private dataService: DataService,
    private authService: AuthService
  ) { }

  private initializeUserData(userId: string) {
    // Limpa dados antigos do localStorage
    localStorage.clear();
    
    // Define o ID do usuário atual
    localStorage.setItem('userId', userId);

    // Inicializa os dados do usuário com base no ID
    const userData = userId === '33' ? {
      name: "Maria",
      money: 25,
      reputation: 104,
      progressing: false
    } : {
      name: "Tiago",
      money: 200,
      reputation: 380,
      progressing: true
    };

    // Inicializa o inventário padrão
    const inventory = {
      watch: 0,
      bomb: 0,
      eraser: 0,
      lamp: 0
    };

    // Salva os dados no localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }

  onSubmit() {
    // Remove espaços em branco e converte para minúsculas
    const normalizedUsername = this.username.trim().toLowerCase();

    let userId = '1';
    if (normalizedUsername === 'maria') {
      userId = '33';
    }
    
    this.initializeUserData(userId);

    // Faça login no AuthService (use o userId como token, ou qualquer string)
    this.authService.login(userId);


    // Navega para a página do jogo
    this.router.navigate(['/map']).then(
      () => console.log('Navegação para o mapa bem-sucedida'),
      (error) => console.error('Erro na navegação:', error)
    );
  }
}
