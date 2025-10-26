import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
export class RegisterComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('matrixCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationInterval: any;
  private letters: string[] = [];
  private drops: number[] = [];
  private fontSize: number = 10;
  private columns: number = 0;
  private isBrowser: boolean;
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
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmSenha: ['', Validators.required],
      avatar: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.loadAvatars();
    
    const letterString = 'ABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZABCDEFGHIJKLMNOPQRSTUVXYZ';
    this.letters = letterString.split('');
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    
    setTimeout(() => {
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      this.ctx = ctx;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      this.columns = canvas.width / this.fontSize;
      
      for (let i = 0; i < this.columns; i++) {
        if (Math.random() > 0.85) {
          this.drops[i] = Math.floor(Math.random() * -100);
        }
      }
      
      this.animationInterval = setInterval(() => this.draw(), 100);
      
      window.addEventListener('resize', () => this.handleResize());
    }, 100);
  }

  private draw(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, .08)';
    this.ctx.fillRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    
    for (let i = 0; i < this.drops.length; i++) {
      if (this.drops[i] !== undefined) {
        const text = this.letters[Math.floor(Math.random() * this.letters.length)];
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);
        this.drops[i]++;
        
        if (this.drops[i] * this.fontSize > this.canvasRef.nativeElement.height) {
          if (Math.random() > 0.95) {
            this.drops[i] = Math.floor(Math.random() * -200);
          } else {
            delete this.drops[i];
          }
        }
      } else if (Math.random() > 0.99) {
        this.drops[i] = Math.floor(Math.random() * -100);
      }
    }
  }

  private handleResize(): void {
    if (!this.isBrowser) return;
    
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    this.columns = canvas.width / this.fontSize;
    this.drops = [];
    
    for (let i = 0; i < this.columns; i++) {
      if (Math.random() > 0.85) {
        this.drops[i] = Math.floor(Math.random() * -100);
      }
    }
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    
    window.removeEventListener('resize', () => this.handleResize());
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
