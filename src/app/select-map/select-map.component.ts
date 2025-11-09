import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconsModule } from '../lucide-icons.module';
import { HeaderComponent } from '../header/header.component';
import { AdminPanelService } from '../../services/admin-panel.service';
import { GameMapService } from '../../services/game-map.service';
import { GameMap } from '../../services/game-map.service';
import { Router, RouterModule } from '@angular/router';
import { AppContextService } from '../../services/app-context.service';

@Component({
  selector: 'app-select-map',
  standalone: true,
  imports: [CommonModule, LucideIconsModule, HeaderComponent, RouterModule],
  templateUrl: './select-map.component.html',
  styleUrl: './select-map.component.css'
})
export class SelectMapComponent implements OnInit, OnDestroy {
  isOpen: boolean = true;
  gameMaps: GameMap[] = [];
  loading: boolean = false;

  @Output() mapSelected = new EventEmitter<GameMap>();
  @Output() closeEvent = new EventEmitter<void>();

  constructor(
    private gameMapService: GameMapService,
    private router: Router,
    private appContextService: AppContextService
  ) {}

  ngOnInit() {
    this.appContextService.setContext('select-map');
    this.loadGameMaps();
  }

  ngOnDestroy() {
    this.appContextService.setContext('other');
  }

  show() {
    this.isOpen = true;
    this.loadGameMaps();
  }

  hide() {
    this.isOpen = false;
  }

  close() {
    this.isOpen = false;
    this.closeEvent.emit();
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadGameMaps();
    }
  }

  private loadGameMaps() {
    this.loading = true;
    this.gameMapService.getAllGameMaps().subscribe({
      next: (data: GameMap[]) => {
        this.gameMaps = data;
        this.loading = false;
        console.log('🗺️ GameMaps carregados:', this.gameMaps);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar GameMaps:', error);
        this.loading = false;
      }
    });
  }

  // ✅ ALTERAR: Método para navegar ao invés de apenas emitir evento
  selectMap(gameMap: GameMap, event?: Event) {
    if (event) {
      event.stopPropagation(); // Evita duplo clique
    }
    
    console.log('🎯 GameMap selecionado:', gameMap);
    
    if (gameMap.id) {
      // ✅ NAVEGAR: Para a rota /map/{id}
      this.router.navigate(['/map', gameMap.id]);
      this.close();
    } else {
      console.error('❌ GameMap sem ID válido:', gameMap);
    }
  }

  // ✅ Método utilitário para formatar data
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  }

  // ✅ Método para obter estatísticas do GameMap
  getMapStats(gameMap: GameMap) {
    return {
      phases: gameMap.phases?.length || 0,
      users: gameMap.users?.length || 0,
      createdBy: gameMap.createdByUser?.name || 'Desconhecido'
    };
  }
}
