
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPanelService, Avatar, Character, Phase, Item } from '../../services/admin-panel.service';
import { User } from '../../services/user.service';
import { AuthService } from '../auth/auth.service';
import { TipService, Tip, CreateTipRequest } from '../../services/tip.service';


@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  avatar: Avatar = {};
  character: Character = { name: '' };
  phase: Phase = { title: '', description: '', type: 'BUILD', characterId: undefined };
  item: Item = { title: '', description: '', price: 0 };
  tip: CreateTipRequest = { tip: '' };

  avatars: Avatar[] = [];
  characters: Character[] = [];
  phases: Phase[] = [];
  items: Item[] = [];
  tips: Tip[] = [];

  editAvatarId?: number;
  editCharacterId?: number;
  editPhaseId?: number;
  editItemId?: number;
  editTipId?: number;

  avatarImageFile?: File;
  characterImageFile?: File;
  itemImageFile?: File;

  avatarPreview?: string;
  characterPreview?: string;
  itemPreview?: string;

  user?: User | null;
  filesPath?: string;

  constructor(
    private adminService: AdminPanelService, 
    private authService: AuthService,
    private tipService: TipService
  ) {}

  ngOnInit() {
    this.loadAll();
    this.user = this.authService.getCurrentUser();
    console.log(this.user);
    this.filesPath = 'http://localhost:9090/uploads/';
  }

  loadAll() {
    this.adminService.getAvatars().subscribe(data => this.avatars = data);
    this.adminService.getCharacters().subscribe(data => this.characters = data);
    this.adminService.getPhases().subscribe(data => this.phases = data);
    this.adminService.getItems().subscribe(data => this.items = data);
    this.tipService.getAllTips().subscribe(data => this.tips = data);
  }

  // CRUD Avatar
  onSubmitAvatar() {
    if (!this.avatarImageFile) {
      alert('Por favor, selecione uma imagem para o avatar.');
      return;
    }
    
    if (this.editAvatarId != null) {
      this.adminService.updateAvatar(this.editAvatarId, this.avatar, this.avatarImageFile).subscribe(() => {
        this.loadAll();
        this.resetAvatarForm();
      });
    } else {
      this.adminService.createAvatar(this.avatar, this.avatarImageFile).subscribe(() => {
        this.loadAll();
        this.resetAvatarForm();
      });
    }
  }
  
  resetAvatarForm() {
    this.avatar = {};
    this.avatarImageFile = undefined;
    this.avatarPreview = undefined;
    this.editAvatarId = undefined;
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
    this.avatarPreview = a.filePath ? `${this.filesPath}${a.filePath}` : undefined;
  }
  deleteAvatar(index: number) {
    const a = this.avatars[index];
    if (a.id != null) {
      this.adminService.deleteAvatar(a.id).subscribe(() => this.loadAll());
    }
  }

  // CRUD Character
  onSubmitCharacter() {
    if (!this.characterImageFile) {
      alert('Por favor, selecione uma imagem para o personagem.');
      return;
    }
    
    if (this.editCharacterId != null) {
      this.adminService.updateCharacter(this.editCharacterId, this.character, this.characterImageFile).subscribe(() => {
        this.loadAll();
        this.resetCharacterForm();
      });
    } else {
      this.adminService.createCharacter(this.character, this.characterImageFile).subscribe(() => {
        this.loadAll();
        this.resetCharacterForm();
      });
    }
  }
  
  resetCharacterForm() {
    this.character = { name: '' };
    this.characterImageFile = undefined;
    this.characterPreview = undefined;
    this.editCharacterId = undefined;
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
    this.characterPreview = c.filePath ? `${this.filesPath}${c.filePath}` : undefined;
  }
  deleteCharacter(index: number) {
    const c = this.characters[index];
    if (c.id != null) {
      this.adminService.deleteCharacter(c.id).subscribe(() => this.loadAll());
    }
  }

  // CRUD Phase
  onSubmitPhase() {
    if (!this.phase.characterId) {
      alert('Por favor, selecione um personagem para a fase.');
      return;
    }
    
    if (this.editPhaseId != null) {
      this.adminService.updatePhase(this.editPhaseId, this.phase).subscribe(() => {
        this.loadAll();
        this.resetPhaseForm();
      });
    } else {
      this.adminService.createPhase(this.phase).subscribe(() => {
        this.loadAll();
        this.resetPhaseForm();
      });
    }
  }
  
  resetPhaseForm() {
    this.phase = { title: '', description: '', type: 'BUILD', characterId: undefined };
    this.editPhaseId = undefined;
  }
  
  editPhase(index: number) {
    const p = this.phases[index];
    this.phase = { 
      title: p.title, 
      description: p.description, 
      type: p.type,
      mode: p.mode,
      maxTime: p.maxTime,
      status: p.status,
      characterId: p.character?.id || p.characterId,
      diagramInitial: p.diagramInitial
    };
    this.editPhaseId = p.id;
  }
  deletePhase(index: number) {
    const p = this.phases[index];
    if (p.id != null) {
      this.adminService.deletePhase(p.id).subscribe(() => this.loadAll());
    }
  }

  // CRUD Item
  onSubmitItem() {
    if (!this.itemImageFile) {
      alert('Por favor, selecione uma imagem para o item.');
      return;
    }
    
    if (this.editItemId != null) {
      this.adminService.updateItem(this.editItemId, this.item, this.itemImageFile).subscribe(() => {
        this.loadAll();
        this.resetItemForm();
      });
    } else {
      this.adminService.createItem(this.item, this.itemImageFile).subscribe(() => {
        this.loadAll();
        this.resetItemForm();
      });
    }
  }
  
  resetItemForm() {
    this.item = { title: '', description: '', price: 0 };
    this.itemImageFile = undefined;
    this.itemPreview = undefined;
    this.editItemId = undefined;
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
    this.itemPreview = it.filePath ? `${this.filesPath}${it.filePath}` : undefined;
  }
  deleteItem(index: number) {
    const it = this.items[index];
    if (it.id != null) {
      this.adminService.deleteItem(it.id).subscribe(() => this.loadAll());
    }
  }

  // CRUD Tip
  onSubmitTip() {
    if (!this.tip.tip.trim()) {
      alert('Por favor, digite uma dica.');
      return;
    }
    
    if (this.editTipId != null) {
      this.tipService.updateTip(this.editTipId, this.tip).subscribe(() => {
        this.loadAll();
        this.resetTipForm();
      });
    } else {
      this.tipService.createTip(this.tip).subscribe(() => {
        this.loadAll();
        this.resetTipForm();
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
      this.tipService.deleteTip(t.id).subscribe(() => this.loadAll());
    }
  }

  // Utility methods
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
