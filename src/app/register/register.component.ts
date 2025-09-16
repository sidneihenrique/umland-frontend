import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  characters: string[] = [];
  selectedCharacter: string | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmSenha: ['', Validators.required],
      personagem: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
    this.loadCharacters();
  }

  loadCharacters() {
    this.characters = [
      'assets/images/characters/homem1.png',
      'assets/images/characters/homem2.png',
      'assets/images/characters/homem3.png',
      'assets/images/characters/mulher1.png',
      'assets/images/characters/mulher2.png',
      'assets/images/characters/robo1.png'
    ];
    // Set a default selected character if any exist
    if (this.characters.length > 0) {
      this.selectedCharacter = this.characters[0];
      this.registerForm.get('personagem')?.setValue(this.selectedCharacter);
    }
  }

  selectCharacter(character: string) {
    this.selectedCharacter = character;
    this.registerForm.get('personagem')?.setValue(character);
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('senha')?.value === form.get('confirmSenha')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { nome, email, senha } = this.registerForm.value;
      const registerData = {
        name: nome,
        email: email,
        password: senha
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          console.log('Usuário registrado com sucesso', response);
          // Após registro bem-sucedido, redireciona para login
          this.router.navigate(['/login'], { 
            queryParams: { message: 'Registro realizado com sucesso! Faça login para continuar.' }
          });
        },
        error: (error) => {
          console.error('Erro ao registrar usuário', error);
          this.errorMessage = error.error?.message || 'Erro ao criar conta. Tente novamente.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
    }
  }
}
