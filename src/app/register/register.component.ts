import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';

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

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
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
      const { nome, email, senha, personagem } = this.registerForm.value;
      const newUser = {
        id: 0, // ID will be assigned by the backend
        nome,
        email,
        senha,
        reputacao: 1000, // Default reputation
        moedas: 0, // Default coins
        faseAtual: null, // No current phase initially
        personagem // Add the selected character
      };
      this.dataService.registerUser(newUser).subscribe({
        next: (response) => {
          console.log('User registered successfully', response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error registering user', error);
        }
      });
    }
  }
}
