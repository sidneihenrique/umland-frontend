import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../auth/auth.service';
// ✅ Imports atualizados
import { UserService } from '../../services/user.service';
import { Avatar } from '../../services/phase.service';
import { FileUrlBuilder } from '../../config/files.config';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  // ✅ Renomeado de characters para avatars
  avatars: Avatar[] = [];
  selectedAvatar: Avatar | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  isLoadingAvatars: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private authService: AuthService,
    private router: Router,
    // ✅ Injeção do UserService
    private userService: UserService
  ) {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmSenha: ['', Validators.required],
      // ✅ Renomeado campo
      avatar: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadAvatars();
  }

  // ✅ Método atualizado para carregar avatares da API
  loadAvatars() {
    this.isLoadingAvatars = true;
    this.errorMessage = '';

    this.userService.getAllAvatars().subscribe({
      next: (avatars: Avatar[]) => {
        this.avatars = avatars;
        
        // Selecionar primeiro avatar por padrão se existir
        if (this.avatars.length > 0) {
          this.selectAvatar(this.avatars[0]);
        }
        
        this.isLoadingAvatars = false;
      },
      error: (error) => {
        console.error('❌ Erro ao carregar avatares:', error);
        this.isLoadingAvatars = false;
        
        // ✅ Fallback para avatares estáticos
        this.loadStaticAvatars();
      }
    });
  }

  // ✅ Fallback para avatares estáticos
  private loadStaticAvatars() {
    console.log('📝 Carregando avatares estáticos como fallback');
    this.avatars = [
      { id: 1, filePath: 'homem1.png' },
      { id: 2, filePath: 'homem2.png' },
      { id: 3, filePath: 'homem3.png' },
      { id: 4, filePath: 'mulher1.png' },
      { id: 5, filePath: 'mulher2.png' },
      { id: 6, filePath: 'robo1.png' }
    ];

    // Selecionar primeiro avatar por padrão
    if (this.avatars.length > 0) {
      this.selectAvatar(this.avatars[0]);
    }
  }

  // ✅ Método para construir URL do avatar usando files.config
  getAvatarImageUrl(avatar: Avatar): string {
    if (avatar.filePath?.startsWith('assets/')) {
      // Se for caminho estático (fallback), retornar como está
      return `assets/images/characters/${avatar.filePath.split('/').pop()}`;
    }
    
    // Se for da API e filePath existir, usar FileUrlBuilder
    if (avatar.filePath) {
      return FileUrlBuilder.avatar(avatar.filePath);
    }
    
    // Fallback se filePath for undefined
    return 'assets/images/characters/default-avatar.png';
  }

  // ✅ Método atualizado
  selectAvatar(avatar: Avatar) {
    this.selectedAvatar = avatar;
    this.registerForm.get('avatar')?.setValue(avatar.id || avatar.filePath);
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('senha')?.value === form.get('confirmSenha')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.registerForm.valid && this.selectedAvatar) {
      this.isLoading = true;
      this.errorMessage = '';

      const { nome, email, senha } = this.registerForm.value;
      const registerData = {
        name: nome,
        email: email,
        password: senha,
        // ✅ Enviar ID do avatar selecionado
        idAvatar: this.selectedAvatar.id?.toString() || this.selectedAvatar.filePath || '1'
      };

      console.log('📤 Enviando dados de registro:', registerData);

      this.authService.register(registerData).subscribe({
        next: (response) => {
          console.log('✅ Usuário registrado com sucesso', response);
          this.router.navigate(['/login'], { 
            queryParams: { message: 'Registro realizado com sucesso! Faça login para continuar.' }
          });
        },
        error: (error) => {
          console.error('❌ Erro ao registrar usuário', error);
          this.errorMessage = error.error?.message || 'Erro ao criar conta. Tente novamente.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente e selecione um avatar.';
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/images/characters/default.png';
    }
  }
}
