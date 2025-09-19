import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPanelService, Item } from '../../services/admin-panel.service';
import { Avatar, Phase, Character } from '../../services/phase.service';
import { User } from '../../services/user.service';
import { GameMap } from '../../services/game-map.service';
import { AuthService } from '../auth/auth.service';
import { TipService, Tip, CreateTipRequest } from '../../services/tip.service';
// ✅ Import da configuração global
import { FILES_CONFIG, FileUrlBuilder } from '../../config/files.config';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  
  // ✅ Form models corrigidos
  avatar: Avatar = {};
  
  character: Character = { 
    id: undefined, 
    name: '', 
    filePath: '' 
  };
  
  phase: Phase = { 
    id: undefined, 
    title: '', 
    description: '', 
    type: 'BUILD', 
    mode: 'BASIC',
    maxTime: 3600,
    character: {
      id: undefined,
      name: '',
      filePath: ''
    },
    gameMap: {
      id: undefined,
      title: '',
      users: [],
      phases: []
    },
    diagramInitial: '',
    correctDiagrams: [],
    characterDialogues: []
  };
  
  item: Item = { 
    title: '', 
    description: '', 
    price: 0 
  };
  
  tip: CreateTipRequest = { 
    tip: '' 
  };

  // ✅ Data arrays
  avatars: Avatar[] = [];
  characters: Character[] = [];
  phases: Phase[] = [];
  items: Item[] = [];
  tips: Tip[] = [];
  gameMaps: GameMap[] = [];

  // ✅ Edit state IDs
  editAvatarId?: number;
  editCharacterId?: number;
  editPhaseId?: number;
  editItemId?: number;
  editTipId?: number;

  // ✅ File handling
  avatarImageFile?: File;
  characterImageFile?: File;
  itemImageFile?: File;

  avatarPreview?: string;
  characterPreview?: string;
  itemPreview?: string;

  // ✅ User data - usando configuração global
  user?: User | null;
  filesPath: string = FILES_CONFIG.BASE_URL;

  constructor(
    private adminService: AdminPanelService, 
    private authService: AuthService,
    private tipService: TipService
  ) {}

  // ✅ Métodos utilitários para URLs de imagem
  getAvatarImageUrl(fileName: string): string {
    return FileUrlBuilder.avatar(fileName);
  }

  getCharacterImageUrl(fileName: string): string {
    return FileUrlBuilder.character(fileName);
  }

  getItemImageUrl(fileName: string): string {
    return FileUrlBuilder.item(fileName);
  }

  ngOnInit() {
    this.loadAll();
    this.user = this.authService.getCurrentUser();
    console.log('Current user:', this.user);
  }

  // ✅ Load all data
  loadAll() {
    this.loadAvatars();
    this.loadCharacters();
    this.loadPhases();
    this.loadItems();
    this.loadTips();
    this.loadGameMaps();
  }

  loadAvatars() {
    this.adminService.getAvatars().subscribe({
      next: (data) => this.avatars = data,
      error: (error) => console.error('Erro ao carregar avatars:', error)
    });
  }

  loadCharacters() {
    this.adminService.getCharacters().subscribe({
      next: (data) => this.characters = data,
      error: (error) => console.error('Erro ao carregar characters:', error)
    });
  }

  loadPhases() {
    this.adminService.getPhases().subscribe({
      next: (data) => this.phases = data,
      error: (error) => console.error('Erro ao carregar phases:', error)
    });
  }

  loadItems() {
    this.adminService.getItems().subscribe({
      next: (data) => this.items = data,
      error: (error) => console.error('Erro ao carregar items:', error)
    });
  }

  loadTips() {
    this.tipService.getAllTips().subscribe({
      next: (data) => this.tips = data,
      error: (error) => console.error('Erro ao carregar tips:', error)
    });
  }

  loadGameMaps() {
    this.adminService.getAllGameMaps().subscribe({
      next: (data) => this.gameMaps = data,
      error: (error) => console.error('Erro ao carregar gameMaps:', error)
    });
  }

  // ✅ CRUD Avatar
  onSubmitAvatar() {
    if (!this.avatarImageFile && !this.editAvatarId) {
      alert('Por favor, selecione uma imagem para o avatar.');
      return;
    }
    
    if (this.editAvatarId != null) {
      this.adminService.updateAvatar(this.editAvatarId, this.avatar, this.avatarImageFile).subscribe({
        next: () => {
          this.loadAvatars();
          this.resetAvatarForm();
        },
        error: (error) => console.error('Erro ao atualizar avatar:', error)
      });
    } else {
      this.adminService.createAvatar(this.avatar, this.avatarImageFile!).subscribe({
        next: () => {
          this.loadAvatars();
          this.resetAvatarForm();
        },
        error: (error) => console.error('Erro ao criar avatar:', error)
      });
    }
  }
  
  resetAvatarForm() {
    this.avatar = {};
    this.avatarImageFile = undefined;
    this.avatarPreview = undefined;
    this.editAvatarId = undefined;
    
    // Limpar input de arquivo
    const fileInput = document.querySelector('input[name="avatarImage"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
  
  onAvatarImageChange(event: any) {
    const file = event.target?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.avatarImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.avatarPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }
  
  editAvatar(index: number) {
    const a = this.avatars[index];
    this.avatar = { ...a };
    this.editAvatarId = a.id;
    // ✅ Usando método utilitário
    this.avatarPreview = a.filePath ? this.getAvatarImageUrl(a.filePath) : undefined;
  }

  deleteAvatar(index: number) {
    const a = this.avatars[index];
    if (a.id != null) {
      this.adminService.deleteAvatar(a.id).subscribe({
        next: () => this.loadAvatars(),
        error: (error) => console.error('Erro ao deletar avatar:', error)
      });
    }
  }

  // ✅ CRUD Character
  onSubmitCharacter() {
    if (!this.characterImageFile && !this.editCharacterId) {
      alert('Por favor, selecione uma imagem para o personagem.');
      return;
    }
    
    if (this.editCharacterId != null) {
      this.adminService.updateCharacter(this.editCharacterId, this.character, this.characterImageFile).subscribe({
        next: () => {
          this.loadCharacters();
          this.resetCharacterForm();
        },
        error: (error) => console.error('Erro ao atualizar character:', error)
      });
    } else {
      this.adminService.createCharacter(this.character, this.characterImageFile!).subscribe({
        next: () => {
          this.loadCharacters();
          this.resetCharacterForm();
        },
        error: (error) => console.error('Erro ao criar character:', error)
      });
    }
  }
  
  resetCharacterForm() {
    this.character = { id: undefined, name: '', filePath: '' };
    this.characterImageFile = undefined;
    this.characterPreview = undefined;
    this.editCharacterId = undefined;
    
    // Limpar input de arquivo
    const fileInput = document.querySelector('input[name="characterImage"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
  
  onCharacterImageChange(event: any) {
    const file = event.target?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.characterImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.characterPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }
  
  editCharacter(index: number) {
    const c = this.characters[index];
    this.character = { ...c };
    this.editCharacterId = c.id;
    // ✅ Usando método utilitário
    this.characterPreview = c.filePath ? this.getCharacterImageUrl(c.filePath) : undefined;
  }

  deleteCharacter(index: number) {
    const c = this.characters[index];
    if (c.id != null) {
      this.adminService.deleteCharacter(c.id).subscribe({
        next: () => this.loadCharacters(),
        error: (error) => console.error('Erro ao deletar character:', error)
      });
    }
  }

  // ✅ CRUD Phase - CORRIGIDO
  onSubmitPhase() {
    if (!this.phase.character.id || this.phase.character.id === 0) {
      alert('Por favor, selecione um personagem para a fase.');
      return;
    }

    if (!this.phase.gameMap.id || this.phase.gameMap.id === 0) {
      alert('Por favor, selecione um GameMap para a fase.');
      return;
    }
    
    // ✅ Converter para number antes da busca
    const characterId = Number(this.phase.character.id);
    const gameMapId = Number(this.phase.gameMap.id);
    
    // Buscar dados completos do character e gameMap selecionados
    const selectedCharacter = this.characters.find(c => c.id === characterId);
    const selectedGameMap = this.gameMaps.find(gm => gm.id === gameMapId);

    if (!selectedCharacter) {
      alert('Personagem selecionado não encontrado.');
      return;
    }

    if (!selectedGameMap) {
      alert('GameMap selecionado não encontrado.');
      return;
    }

    // Preencher dados completos
    const completePhase: Phase = {
      ...this.phase,
      character: selectedCharacter,
      gameMap: selectedGameMap
    };

    console.log('Submitting phase:', completePhase);
    
    if (this.editPhaseId != null) {
      this.adminService.updatePhase(this.editPhaseId, completePhase).subscribe({
        next: () => {
          this.loadPhases();
          this.resetPhaseForm();
        },
        error: (error) => console.error('Erro ao atualizar phase:', error)
      });
    } else {
      this.adminService.createPhase(completePhase).subscribe({
        next: () => {
          this.loadPhases();
          this.resetPhaseForm();
        },
        error: (error) => console.error('Erro ao criar phase:', error)
      });
    }
  }
  
  resetPhaseForm() {
    this.phase = { 
      id: 0,
      title: '', 
      description: '', 
      type: 'BUILD', 
      mode: 'BASIC',
      maxTime: 3600,
      character: {
        id: 0,
        name: '',
        filePath: ''
      },
      gameMap: {
        id: 0,
        title: '',
        users: [],
        phases: []
      },
      diagramInitial: '',
      correctDiagrams: [],
      characterDialogues: []
    };
    this.editPhaseId = undefined;
  }
  
  editPhase(index: number) {
    const p = this.phases[index];
    this.phase = { 
      id: p.id,
      title: p.title, 
      description: p.description || '', 
      type: p.type,
      mode: p.mode,
      maxTime: p.maxTime,
      character: {
        id: p.character?.id || 0,
        name: p.character?.name || '',
        filePath: p.character?.filePath || ''
      },
      gameMap: p.gameMap || {
        id: 0,
        title: '',
        users: [],
        phases: []
      },
      diagramInitial: p.diagramInitial || '',
      correctDiagrams: p.correctDiagrams || [],
      characterDialogues: p.characterDialogues || []
    };
    this.editPhaseId = p.id;
  }

  deletePhase(index: number) {
    const p = this.phases[index];
    if (p.id != null) {
      this.adminService.deletePhase(p.id).subscribe({
        next: () => this.loadPhases(),
        error: (error) => console.error('Erro ao deletar phase:', error)
      });
    }
  }

  // ✅ CRUD Item
  onSubmitItem() {
    if (!this.itemImageFile && !this.editItemId) {
      alert('Por favor, selecione uma imagem para o item.');
      return;
    }
    
    if (this.editItemId != null) {
      this.adminService.updateItem(this.editItemId, this.item, this.itemImageFile).subscribe({
        next: () => {
          this.loadItems();
          this.resetItemForm();
        },
        error: (error) => console.error('Erro ao atualizar item:', error)
      });
    } else {
      this.adminService.createItem(this.item, this.itemImageFile!).subscribe({
        next: () => {
          this.loadItems();
          this.resetItemForm();
        },
        error: (error) => console.error('Erro ao criar item:', error)
      });
    }
  }
  
  resetItemForm() {
    this.item = { title: '', description: '', price: 0 };
    this.itemImageFile = undefined;
    this.itemPreview = undefined;
    this.editItemId = undefined;
    
    // Limpar input de arquivo
    const fileInput = document.querySelector('input[name="itemImage"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
  
  onItemImageChange(event: any) {
    const file = event.target?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.itemImageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.itemPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    }
  }
  
  editItem(index: number) {
    const it = this.items[index];
    this.item = { ...it };
    this.editItemId = it.id;
    // ✅ Usando método utilitário
    this.itemPreview = it.filePath ? this.getItemImageUrl(it.filePath) : undefined;
  }

  deleteItem(index: number) {
    const it = this.items[index];
    if (it.id != null) {
      this.adminService.deleteItem(it.id).subscribe({
        next: () => this.loadItems(),
        error: (error) => console.error('Erro ao deletar item:', error)
      });
    }
  }

  // ✅ CRUD Tip
  onSubmitTip() {
    if (!this.tip.tip.trim()) {
      alert('Por favor, digite uma dica.');
      return;
    }
    
    if (this.editTipId != null) {
      this.tipService.updateTip(this.editTipId, this.tip).subscribe({
        next: () => {
          this.loadTips();
          this.resetTipForm();
        },
        error: (error) => console.error('Erro ao atualizar tip:', error)
      });
    } else {
      this.tipService.createTip(this.tip).subscribe({
        next: () => {
          this.loadTips();
          this.resetTipForm();
        },
        error: (error) => console.error('Erro ao criar tip:', error)
      });
    }
  }
  
  resetTipForm() {
    this.tip = { tip: '' };
    this.editTipId = undefined;
  }
  
  editTip(index: number) {
    const t = this.tips[index];
    this.tip = { tip: t.tip };
    this.editTipId = t.id;
  }
  
  deleteTip(index: number) {
    const t = this.tips[index];
    if (t.id != null) {
      this.tipService.deleteTip(t.id).subscribe({
        next: () => this.loadTips(),
        error: (error) => console.error('Erro ao deletar tip:', error)
      });
    }
  }

  // ✅ Utility methods
  formatTime(seconds: number): string {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}
