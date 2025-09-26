import { Component, OnInit, ViewChild, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPanelService, Item } from '../../services/admin-panel.service';
import { GameMapService } from '../../services/game-map.service';
import { Avatar, Phase, Character } from '../../services/phase.service';
import { User } from '../../services/user.service';
import { GameMap } from '../../services/game-map.service';
import { AuthService } from '../auth/auth.service';
import { TipService, Tip, CreateTipRequest } from '../../services/tip.service';
// ✅ Import da configuração global
import { FILES_CONFIG, FileUrlBuilder } from '../../config/files.config';

// ✅ Import do componente de editor de diagramas
import { DiagramEditorComponent } from '../diagram-editor/diagram-editor.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, DiagramEditorComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit, AfterViewInit {
  
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

  // ✅ NEW: Campos para gerenciar falas do personagem
  newDialogue: string = '';
  editingDialogueIndex: number = -1;

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

  // ✅ CORRIGIR: Apenas ViewChildren para capturar ambos os editores
  @ViewChildren(DiagramEditorComponent) diagramEditors!: QueryList<DiagramEditorComponent>;

  // ✅ REMOVER completamente o ViewChild individual
  // @ViewChild('diagramEditor') diagramEditorComponentRef!: DiagramEditorComponent;

  // ✅ ADICIONAR: Propriedades auxiliares para seleção
  selectedGameMapId: number = 0;
  selectedCharacterId: number = 0;

  // ✅ ADICIONAR: Controle de tabs
  activeTab: string = 'avatars'; // Tab ativa por padrão
  
  // Definir as tabs disponíveis
  tabs = [
    { id: 'avatars', name: 'Avatars', icon: '👤' },
    { id: 'characters', name: 'Personagens', icon: '🎭' },
    { id: 'gamemaps', name: 'GameMaps', icon: '🗺️' }, // ✅ NOVA TAB
    { id: 'phases', name: 'Fases', icon: '🎮' },
    { id: 'items', name: 'Items', icon: '🛒' },
    { id: 'tips', name: 'Dicas', icon: '💡' }
  ];

  // ✅ ADICIONAR: Propriedades para gerenciar diagramas corretos
  editingCorrectDiagramIndex: number = -1; // -1 = não está editando
  correctDiagramPreview: string = ''; // Preview do JSON para mostrar na lista

  // ✅ ADICIONAR: Propriedades para GameMap
  gameMap: GameMap = {
    title: '',
    users: [],
    phases: []
  };

  // ✅ ADICIONAR: Estado de edição para GameMap
  editGameMapId?: number;

  // ✅ ADICIONAR: ID da Phase pai selecionada
  selectedParentPhaseId: number = 0;

  constructor(
    private adminService: AdminPanelService, 
    private authService: AuthService,
    private tipService: TipService,
    private gameMapService: GameMapService
  ) {}

  // ✅ ADICIONAR: Método para trocar de tab
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    
    if(this.activeTab === 'phases') {
      // ✅ Aguardar o Angular renderizar o DOM
      setTimeout(() => {
        console.log('🔧 Inicializando editores de diagrama...');
        
        if (this.diagramEditors && this.diagramEditors.length > 0) {
          this.diagramEditors.forEach((editor, index) => {
            console.log(`🔧 Inicializando editor ${index + 1}/${this.diagramEditors.length}`);
            editor.initializeJointJS();
          });
          console.log(`✅ ${this.diagramEditors.length} editores inicializados`);
        } else {
          console.warn('⚠️ Nenhum DiagramEditor encontrado');
        }
      }, 0);
      
    } else if(this.diagramEditors && this.diagramEditors.length > 0) {
      console.log('🧹 Limpando diagramas ao sair da tab de fases');
      this.diagramEditors.forEach((editor, index) => {
        if (editor.isInitialized()) {
          editor.reinitialize();
        }
      });
    }
  }

  // ✅ HELPER: Métodos para obter cada editor específico
  private getInitialDiagramEditor(): DiagramEditorComponent | undefined {
    return this.diagramEditors?.toArray()[0]; // Primeiro editor = diagrama inicial
  }

  private getCorrectDiagramEditor(): DiagramEditorComponent | undefined {
    return this.diagramEditors?.toArray()[1]; // Segundo editor = diagramas corretos
  }

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
  }

  ngAfterViewInit() {

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
      next: (data) => {
        this.phases = data;
        console.log('Phases carregadas:', this.phases);
      },
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
    if (!this.selectedCharacterId || this.selectedCharacterId === 0) {
      alert('Por favor, selecione um personagem para a fase.');
      return;
    }

    if (!this.selectedGameMapId || this.selectedGameMapId === 0) {
      alert('Por favor, selecione um GameMap para a fase.');
      return;
    }
    
    // Buscar dados completos do character e gameMap selecionados
    const selectedCharacter = this.characters.find(c => c.id === Number(this.selectedCharacterId));
    const selectedGameMap = this.gameMaps.find(gm => gm.id === Number(this.selectedGameMapId));

    if (!selectedCharacter) {
      alert('Personagem selecionado não encontrado.');
      return;
    }

    if (!selectedGameMap) {
      alert('GameMap selecionado não encontrado.');
      return;
    }

    // ✅ ADICIONAR: Incluir parentPhaseId na phase
    const completePhase: Phase = {
      ...this.phase,
      character: selectedCharacter,
      gameMap: selectedGameMap,
      parentPhaseId: this.selectedParentPhaseId > 0 ? this.selectedParentPhaseId : undefined // ✅ NOVO
    };

    console.log('Submitting phase with parentPhaseId:', completePhase);
    
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
      characterDialogues: [],
      parentPhaseId: undefined // ✅ ADICIONAR
    };
    
    // ✅ ADICIONAR: Resetar ID da phase pai
    this.selectedParentPhaseId = 0;
    
    // Resetar outros IDs auxiliares
    this.selectedCharacterId = 0;
    this.selectedGameMapId = 0;
    
    this.editPhaseId = undefined;
    
    // Limpar campos de falas
    this.newDialogue = '';
    this.editingDialogueIndex = -1;

    // Limpar edição de diagramas corretos
    this.editingCorrectDiagramIndex = -1;

    // Reinicializar diagrama vazio
    if (this.diagramEditors && this.diagramEditors.length > 0) {
      console.log('🔄 Reinicializando ambos os editores (reset form)');
      this.diagramEditors.forEach((editor, index) => {
        if (editor.isInitialized()) {
          console.log(`🔄 Reinicializando editor ${index + 1}`);
          editor.reinitialize();
        }
      });
    }
  }
  
  editPhase(index: number) {
    console.log(this.phases);
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
      characterDialogues: p.characterDialogues || [],
      parentPhaseId: p.parentPhaseId // ✅ ADICIONAR
    };
    
    // Setar IDs auxiliares para os selects
    this.selectedCharacterId = p.character?.id || 0;
    this.selectedGameMapId = p.gameMap?.id || 0;
    this.selectedParentPhaseId = p.parentPhaseId || 0; // ✅ ADICIONAR

    console.log("Selected GameMap ID:", this.selectedGameMapId);
    console.log("Selected Parent Phase ID:", this.selectedParentPhaseId); // ✅ LOG
    
    this.editPhaseId = p.id;

    // Carregar diagrama inicial no primeiro editor
    const initialEditor = this.getInitialDiagramEditor();
    if (initialEditor?.isInitialized() && p.diagramInitial) {
      try {
        const diagramJSON = JSON.parse(p.diagramInitial);
        if (diagramJSON.cells) {
          initialEditor.reinitialize();
          setTimeout(() => {
            if (initialEditor.graph) {
              initialEditor.graph.fromJSON(diagramJSON);
              console.log('📂 Diagrama inicial carregado para edição');
            }
          }, 100);
        }
      } catch (error) {
        console.warn('⚠️ Erro no JSON, reinicializando vazio:', error);
        initialEditor.reinitialize();
      }
    }
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

  // ✅ NEW: Métodos para gerenciar falas do personagem
  addDialogue() {
    if (this.newDialogue.trim()) {
      if (this.editingDialogueIndex >= 0) {
        // Editando fala existente
        this.phase.characterDialogues[this.editingDialogueIndex] = this.newDialogue.trim();
        this.editingDialogueIndex = -1;
      } else {
        // Adicionando nova fala
        this.phase.characterDialogues.push(this.newDialogue.trim());
      }
      this.newDialogue = '';
    }
  }

  editDialogue(index: number) {
    this.newDialogue = this.phase.characterDialogues[index];
    this.editingDialogueIndex = index;
  }

  removeDialogue(index: number) {
    this.phase.characterDialogues.splice(index, 1);
    // Se estava editando esta fala, cancelar edição
    if (this.editingDialogueIndex === index) {
      this.cancelEditDialogue();
    } else if (this.editingDialogueIndex > index) {
      // Ajustar índice se estava editando uma fala posterior
      this.editingDialogueIndex--;
    }
  }

  cancelEditDialogue() {
    this.newDialogue = '';
    this.editingDialogueIndex = -1;
  }

  moveDialogueUp(index: number) {
    if (index > 0) {
      const temp = this.phase.characterDialogues[index];
      this.phase.characterDialogues[index] = this.phase.characterDialogues[index - 1];
      this.phase.characterDialogues[index - 1] = temp;
      
      // Ajustar índice de edição se necessário
      if (this.editingDialogueIndex === index) {
        this.editingDialogueIndex = index - 1;
      } else if (this.editingDialogueIndex === index - 1) {
        this.editingDialogueIndex = index;
      }
    }
  }

  moveDialogueDown(index: number) {
    if (index < this.phase.characterDialogues.length - 1) {
      const temp = this.phase.characterDialogues[index];
      this.phase.characterDialogues[index] = this.phase.characterDialogues[index + 1];
      this.phase.characterDialogues[index + 1] = temp;
      
      // Ajustar índice de edição se necessário
      if (this.editingDialogueIndex === index) {
        this.editingDialogueIndex = index + 1;
      } else if (this.editingDialogueIndex === index + 1) {
        this.editingDialogueIndex = index;
      }
    }
  }

  // ✅ ADICIONAR: Métodos simples para gerenciar o diagrama
  saveDiagramToPhase() {
    const editor = this.getInitialDiagramEditor();
    
    if (!editor?.isInitialized()) {
      alert('⚠️ Editor de diagrama inicial não está inicializado');
      return;
    }

    const currentJSON = editor.getCurrentDiagramJSON();
    
    if (currentJSON && currentJSON.cells && currentJSON.cells.length > 0) {
      this.phase.diagramInitial = JSON.stringify(currentJSON);
      alert('✅ Diagrama inicial salvo!');
      console.log('Diagrama inicial salvo:', currentJSON);
    } else {
      alert('⚠️ Adicione elementos ao diagrama antes de salvar');
    }
  }

  // ✅ CORRIGIR: clearDiagram para limpar apenas o editor específico
  clearDiagram() {
    const initialEditor = this.getInitialDiagramEditor();
    
    if (!initialEditor?.isInitialized()) {
      alert('⚠️ Editor de diagrama inicial não está disponível');
      return;
    }

    if (confirm('🗑️ Limpar o diagrama inicial?')) {
      initialEditor.reinitialize();
      this.phase.diagramInitial = '';
      alert('🗑️ Diagrama inicial limpo!');
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

  // ✅ CORRIGIR: saveCorrectDiagram usando segundo editor
  saveCorrectDiagram() {
    const editor = this.getCorrectDiagramEditor();
    
    if (!editor?.isInitialized()) {
      alert('⚠️ Editor de diagramas corretos não está inicializado');
      return;
    }

    const currentJSON = editor.getCurrentDiagramJSON();
    
    if (!currentJSON || !currentJSON.cells || currentJSON.cells.length === 0) {
      alert('⚠️ Crie um diagrama antes de salvá-lo como correto');
      return;
    }

    try {
      const jsonString = JSON.stringify(currentJSON);
      
      if (this.editingCorrectDiagramIndex >= 0) {
        this.phase.correctDiagrams[this.editingCorrectDiagramIndex] = jsonString;
        this.editingCorrectDiagramIndex = -1;
        alert('✅ Diagrama correto atualizado!');
      } else {
        this.phase.correctDiagrams = this.phase.correctDiagrams || [];
        this.phase.correctDiagrams.push(jsonString);
        alert('✅ Diagrama correto adicionado!');
      }

      editor.reinitialize();
      console.log('Diagrama correto salvo:', currentJSON);
    } catch (error) {
      console.error('❌ Erro ao salvar diagrama correto:', error);
      alert('❌ Erro ao salvar diagrama correto');
    }
  }

  // ✅ CORRIGIR: editCorrectDiagram usando segundo editor
  editCorrectDiagram(index: number) {
    try {
      const diagramJSON = JSON.parse(this.phase.correctDiagrams[index]);
      const editor = this.getCorrectDiagramEditor();
      
      if (!editor?.isInitialized()) {
        alert('⚠️ Editor de diagramas corretos não está inicializado');
        return;
      }

      editor.reinitialize();
      setTimeout(() => {
        if (editor.graph) {
          editor.graph.fromJSON(diagramJSON);
          this.editingCorrectDiagramIndex = index;
          console.log('📂 Diagrama correto carregado para edição:', diagramJSON);
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Erro ao carregar diagrama para edição:', error);
      alert('❌ Erro ao carregar diagrama para edição');
    }
  }

  // ✅ CORRIGIR: cancelEditCorrectDiagram usando segundo editor
  cancelEditCorrectDiagram() {
    this.editingCorrectDiagramIndex = -1;
    
    const editor = this.getCorrectDiagramEditor();
    if (editor?.isInitialized()) {
      editor.reinitialize();
    }
  }

    // ✅ ADICIONAR: Método específico para limpar editor de diagramas corretos
  clearCorrectDiagram() {
    const correctEditor = this.getCorrectDiagramEditor();
    
    if (!correctEditor?.isInitialized()) {
      alert('⚠️ Editor de diagramas corretos não está disponível');
      return;
    }

    if (confirm('🗑️ Limpar o editor de diagramas corretos?')) {
      correctEditor.reinitialize();
      // Cancelar edição se estiver editando
      this.editingCorrectDiagramIndex = -1;
      alert('🗑️ Editor de diagramas corretos limpo!');
    }
  }

  // ✅ Método utilitário para mostrar preview do JSON
  getCorrectDiagramPreview(jsonString: string): string {
    try {
      const diagram = JSON.parse(jsonString);
      const elementsCount = diagram.cells ? diagram.cells.length : 0;
      const actors = diagram.cells?.filter((cell: any) => cell.type === 'custom.Actor').length || 0;
      const useCases = diagram.cells?.filter((cell: any) => cell.type === 'custom.UseCase').length || 0;
      const connections = diagram.cells?.filter((cell: any) => cell.type?.includes('Link') || cell.type?.includes('custom.')).length || 0;
      
      return `📊 ${elementsCount} elementos (👤 ${actors} atores, 🎯 ${useCases} casos de uso)`;
    } catch (error) {
      return '❌ JSON inválido';
    }
  }

  // ✅ ADICIONAR: Método para remover diagrama correto
  removeCorrectDiagram(index: number) {
    if (confirm('🗑️ Remover este diagrama correto?')) {
      this.phase.correctDiagrams.splice(index, 1);
      
      // ✅ Se estava editando este diagrama, cancelar edição
      if (this.editingCorrectDiagramIndex === index) {
        this.cancelEditCorrectDiagram();
      } else if (this.editingCorrectDiagramIndex > index) {
        // ✅ Ajustar índice se estava editando um diagrama posterior
        this.editingCorrectDiagramIndex--;
      }
      
      alert('🗑️ Diagrama correto removido!');
    }
  }

  // ✅ ADICIONAR: Método para mover diagrama correto para cima
  moveCorrectDiagramUp(index: number) {
    if (index > 0) {
      const temp = this.phase.correctDiagrams[index];
      this.phase.correctDiagrams[index] = this.phase.correctDiagrams[index - 1];
      this.phase.correctDiagrams[index - 1] = temp;
      
      // ✅ Ajustar índice de edição se necessário
      if (this.editingCorrectDiagramIndex === index) {
        this.editingCorrectDiagramIndex = index - 1;
      } else if (this.editingCorrectDiagramIndex === index - 1) {
        this.editingCorrectDiagramIndex = index;
      }
      
      console.log('⬆️ Diagrama correto movido para cima');
    }
  }

  // ✅ ADICIONAR: Método para mover diagrama correto para baixo
  moveCorrectDiagramDown(index: number) {
    if (index < this.phase.correctDiagrams.length - 1) {
      const temp = this.phase.correctDiagrams[index];
      this.phase.correctDiagrams[index] = this.phase.correctDiagrams[index + 1];
      this.phase.correctDiagrams[index + 1] = temp;
      
      // ✅ Ajustar índice de edição se necessário
      if (this.editingCorrectDiagramIndex === index) {
        this.editingCorrectDiagramIndex = index + 1;
      } else if (this.editingCorrectDiagramIndex === index + 1) {
        this.editingCorrectDiagramIndex = index;
      }
      
      console.log('⬇️ Diagrama correto movido para baixo');
    }
  }

  // ✅ ADICIONAR: Métodos CRUD para GameMap
  onSubmitGameMap() {
    if (!this.gameMap.title.trim()) {
      alert('Por favor, digite um título para o GameMap.');
      return;
    }
    
    if (this.editGameMapId != null) {
      this.gameMapService.updateGameMap(this.editGameMapId, this.gameMap).subscribe({
        next: () => {
          this.loadGameMaps();
          this.resetGameMapForm();
          alert('✅ GameMap atualizado com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao atualizar gameMap:', error);
          alert('❌ Erro ao atualizar GameMap');
        }
      });
    } else {
      // ✅ Criar novo GameMap
      const newGameMap: Omit<GameMap, 'id'> = {
        title: this.gameMap.title.trim(),
        users: [],
        phases: [],
        createdAt: new Date().toISOString(),
        createdByUser: this.user ? this.user : undefined
      };

      this.gameMapService.createGameMap(newGameMap).subscribe({
        next: () => {
          this.loadGameMaps();
          this.resetGameMapForm();
          alert('✅ GameMap criado com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao criar gameMap:', error);
          alert('❌ Erro ao criar GameMap');
        }
      });
    }
  }

  resetGameMapForm() {
    this.gameMap = {
      title: '',
      users: [],
      phases: []
    };
    this.editGameMapId = undefined;
  }

  editGameMap(index: number) {
    const gm = this.gameMaps[index];
    this.gameMap = { 
      id: gm.id,
      title: gm.title,
      users: gm.users || [],
      phases: gm.phases || [],
      createdAt: gm.createdAt,
      createdByUser: gm.createdByUser
    };
    this.editGameMapId = gm.id;
  }

  deleteGameMap(index: number) {
    const gm = this.gameMaps[index];
    if (gm.id != null) {
      if (confirm(`🗑️ Remover o GameMap "${gm.title}"?\n\nAtenção: Isso pode afetar as fases vinculadas.`)) {
        this.gameMapService.deleteGameMap(gm.id).subscribe({
          next: () => {
            this.loadGameMaps();
            alert('🗑️ GameMap removido com sucesso!');
          },
          error: (error) => {
            console.error('Erro ao deletar gameMap:', error);
            alert('❌ Erro ao remover GameMap');
          }
        });
      }
    }
  }

  // ✅ ADICIONAR: Método utilitário para formatar data
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  }

  getAvailableParentPhases(): Phase[] {
    if (!this.selectedGameMapId) {
      return [];
    }

    // Filtrar phases do mesmo GameMap, excluindo a fase atual se estiver editando
    return this.phases.filter(phase => {
      // Deve ser do mesmo GameMap
      const sameGameMap = phase.gameMap?.id === this.selectedGameMapId;
      
      // Não pode ser a própria phase (ao editar)
      const notSelf = this.editPhaseId ? phase.id !== this.editPhaseId : true;
      
      // ✅ OPCIONAL: Evitar loops - fase pai não pode ter como pai a fase atual
      const notCircular = this.editPhaseId ? phase.parentPhaseId !== this.editPhaseId : true;
      
      return sameGameMap && notSelf && notCircular;
    });
  }

  // ✅ ADICIONAR: Método para obter nome da phase pai
  getParentPhaseName(parentPhaseId?: number): string {
    if (!parentPhaseId) return 'Nenhuma';
    
    const parentPhase = this.phases.find(p => p.id === parentPhaseId);
    return parentPhase ? parentPhase.title : `Fase #${parentPhaseId}`;
  }
}
