import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../auth/auth.service';
import { FooterComponent } from '../footer/footer.component';
import { NotificationService } from '../../services/notification.service';
import { AppContextService } from '../../services/app-context.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private dataService: DataService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private appContextService: AppContextService
  ) { }

  ngOnInit() {
    this.appContextService.setContext('login');
  }

  ngOnDestroy() {
    this.appContextService.setContext('other');
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.notificationService.showNotification('error', 'Por favor, preencha todos os campos.');
      // this.notificationService.showNotification('achievement', 'Teste.');
      return;
    }

    this.isLoading = true;

    const credentials = {
      email: this.email.trim(),
      password: this.password
    };


    this.authService.login(credentials).subscribe({
      next: (response) => {
        // ✅ CORRIGIR: Salvar ANTES de navegar
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        console.log('✅ Usuário salvo:', response.user);
        
        // ✅ DEPOIS navegar
        this.router.navigate(['/select-map']).then(
          () => {
            console.log('✅ Navegação realizada com sucesso');
          },
          (error) => {
            console.error('❌ Erro na navegação:', error);
            this.notificationService.showNotification('error', 'Login realizado, mas erro ao navegar.');
            this.isLoading = false;
          }
        );
      },
      error: (error) => {
        console.error('❌ Erro no login:', error);
        const errorMsg = error.error?.message || 'Erro ao fazer login. Verifique suas credenciais.';
        this.notificationService.showNotification('error', errorMsg);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
