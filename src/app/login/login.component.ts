import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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

  constructor(private router: Router) { }

  onSubmit() {
    if (this.username === 'tiago') {
      localStorage.setItem('userId', '1');
      this.router.navigate(['/game']).then(
        () => console.log('Navegação para game bem-sucedida'),
        (error) => console.error('Erro na navegação:', error)
      );
    } else if (this.username === 'maria') {
      localStorage.setItem('userId', '33');
      this.router.navigate(['/game']).then(
        () => console.log('Navegação para game bem-sucedida'),
        (error) => console.error('Erro na navegação:', error)
      );
    } else {
      this.errorMessage = 'Usuário ou senha inválidos';
    }
  }
}
