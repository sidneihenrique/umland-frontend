import { Component, Input, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';
import { GameMapService, PhaseUser } from '../../services/game-map.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-map',
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent {
  @Input() currentPhaseId?: number;
  @Input() gameMapId?: number;
  
  isOpen: boolean = false;
  private phaseUsers: PhaseUser[] = [];

  // Mapeamento de IDs de fase para nomes de arquivos SVG
  private phaseMapSvg: Record<number, string> = {
    2: '0.svg',
    5: '01.svg',
    6: '02.svg',
    7: 'D1.svg',
    8: 'R1_1.svg',
    9: 'R1_2.svg',
    12: 'D2.svg',
    14: 'R1A_1.svg',
    15: 'R1A_2.svg',
    16: 'F1.svg',
    17: 'R1B_1.svg',
    18: 'R1B_2.svg',
    19: 'F2.svg',
    10: 'R2_1.svg',
    11: 'R2_2.svg',
    13: 'D3.svg',
    20: 'R2A_1.svg',
    21: 'R2A_2.svg',
    22: 'F3.svg',
    23: 'R2B_1.svg',
    24: 'R2B_2.svg',
    26: 'F4.svg'
  };

  constructor(
    private gameMapService: GameMapService,
    private userService: UserService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  show() {
    this.isOpen = true;
  }

  hide() {
    this.isOpen = false;
  }

  close() {
    this.isOpen = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isOpen) {
      this.close();
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    
    // Se não tiver currentPhaseId mas tiver gameMapId, buscar última fase
    if (this.isOpen && !this.currentPhaseId && this.gameMapId && isPlatformBrowser(this.platformId)) {
      this.loadLastPhase();
    }
  }

  private loadLastPhase() {
    const currentUser = this.userService.getCurrentUser();
    
    if (!currentUser || !currentUser.id || !this.gameMapId) {
      return;
    }

    this.gameMapService.getAllPhasesByUser(this.gameMapId, currentUser.id).subscribe({
      next: (phaseUsers: PhaseUser[]) => {
        this.phaseUsers = phaseUsers;
        
        // Encontrar a última fase AVAILABLE ou COMPLETED
        const lastPhase = this.findLastAvailablePhase(phaseUsers);
        
        if (lastPhase && lastPhase.phase.id) {
          this.currentPhaseId = lastPhase.phase.id;
        }
      },
      error: (error: any) => {
        console.error('❌ Erro ao carregar fases do usuário:', error);
      }
    });
  }

  private findLastAvailablePhase(phaseUsers: PhaseUser[]): PhaseUser | null {
    // Filtrar fases AVAILABLE ou COMPLETED
    const availablePhases = phaseUsers.filter(pu => 
      pu.status === 'AVAILABLE' || pu.status === 'COMPLETED'
    );

    if (availablePhases.length === 0) {
      return null;
    }

    // Prioridade: primeira fase AVAILABLE (a atual do jogador)
    const firstAvailable = availablePhases.find(pu => pu.status === 'AVAILABLE');
    if (firstAvailable) {
      return firstAvailable;
    }

    // Se não houver AVAILABLE, pegar a última COMPLETED
    const completedPhases = availablePhases.filter(pu => pu.status === 'COMPLETED');
    if (completedPhases.length > 0) {
      // Ordenar por ID decrescente
      completedPhases.sort((a, b) => {
        const idA = a.phase.id || 0;
        const idB = b.phase.id || 0;
        return idB - idA;
      });
      return completedPhases[0];
    }

    return null;
  }

  getMapSvgUrl(): string | null {
    if (!this.currentPhaseId || !this.phaseMapSvg[this.currentPhaseId]) {
      return null;
    }
    
    const svgFileName = this.phaseMapSvg[this.currentPhaseId];
    return `assets/map/${svgFileName}`;
  }

  hasMap(): boolean {
    return !!(this.currentPhaseId && this.phaseMapSvg[this.currentPhaseId]);
  }
}
