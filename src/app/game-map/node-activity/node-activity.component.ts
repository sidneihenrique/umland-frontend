import { Component, Input, Output, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideIconsModule } from '../../lucide-icons.module';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PhaseUser } from '../../../services/game-map.service';
import { User, UserService } from '../../../services/user.service';

import { FileUrlBuilder } from '../../../config/files.config';

export interface Character {
  name: string;
  filePath: string;
}

@Component({
  selector: 'node-activity',
  standalone: true,
  imports: [
    LucideIconsModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './node-activity.component.html',
  styleUrl: './node-activity.component.css'
})
export class NodeActivityComponent implements OnInit{

  @Input() phase!: PhaseUser;
  @Input() last!: boolean;

  userData?: User;

  constructor(
    private router: Router,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {

  }

  ngOnInit() {
    this.loadUserData();
  }

  // ✅ Método para construir URL correta da imagem do character
  getCharacterImageUrl(): string {
    return FileUrlBuilder.character(this.phase.phase.character.filePath);
  }

  openGamePhase() {
    if (this.phase.status === 'AVAILABLE' || this.phase.status === 'COMPLETED') {
      this.router.navigate(['/game', this.phase.phase.id]);
    }
  }

  // ✅ Carregar dados do usuário atual
  private loadUserData() {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.userService.getUserById(Number(userId)).subscribe({
          next: (user: User) => {
            this.userData = user;
          },
          error: (error) => {
            console.error('❌ Erro ao carregar dados do usuário no node-activity:', error);
          }
        });
      }
    }
  }

  // ✅ Método para construir URL correta do avatar do usuário
  getUserAvatarUrl(): string {
    if (!this.userData?.avatar?.filePath) {
      // Fallback para avatar padrão
      return 'assets/images/characters/default-avatar.png';
    }
    
    // Usar FileUrlBuilder para construir URL correta
    return FileUrlBuilder.avatar(this.userData.avatar.filePath);
  }

  // ✅ Método para tratar erro de carregamento da imagem do avatar
  onUserAvatarError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.src !== 'assets/images/characters/default-avatar.png') {
      console.warn('Failed to load user avatar in node-activity:', imgElement.src);
      imgElement.src = 'assets/images/characters/default-avatar.png';
    }
  }
}
