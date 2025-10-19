import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../auth/auth.service';
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
  avatars: Avatar[] = [];
  selectedAvatar: Avatar | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  isLoadingAvatars: boolean = false;
  avatarsLoadError: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private authService: AuthService,
    private router: Router,
    private userService: UserService
  ) {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmSenha: ['', Validators.required],
      avatar: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadAvatars();
  }

  loadAvatars() {
    this.isLoadingAvatars = true;
    this.errorMessage = '';
    this.avatarsLoadError = false;

    this.userService.getAllAvatars().subscribe({
      next: (avatars: Avatar[]) => {
        this.avatars = avatars;
        
        if (this.avatars.length > 0) {
          this.selectAvatar(this.avatars[0]);
        }
        
        this.isLoadingAvatars = false;
        this.avatarsLoadError = false;
      },
      error: (error) => {
        console.error('Erro ao carregar avatares:', error);
        this.isLoadingAvatars = false;
        this.avatarsLoadError = true;
      }
    });
  }


  retryLoadAvatars() {
    this.loadAvatars();
  }

  getAvatarImageUrl(avatar: Avatar): string {
    if (avatar.filePath?.startsWith('assets/')) {
      return `assets/images/characters/${avatar.filePath.split('/').pop()}`;
    }
    if (avatar.filePath) {
      return FileUrlBuilder.avatar(avatar.filePath);
    }
    return 'assets/images/characters/default-avatar.png';
  }


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
        idAvatar: this.selectedAvatar.id?.toString() || this.selectedAvatar.filePath || '1'
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.router.navigate(['/login'], { 
            queryParams: { message: 'Registro realizado com sucesso! Faça login para continuar.' }
          });
        },
        error: (error) => {
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

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
