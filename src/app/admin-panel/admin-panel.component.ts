import { Component, OnInit, ViewChild, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPanelService } from '../../services/admin-panel.service';
import { GameMapService } from '../../services/game-map.service';
import { Avatar, Phase, Character } from '../../services/phase.service';
import { User } from '../../services/user.service';
import { GameMap } from '../../services/game-map.service';
import { AuthService } from '../auth/auth.service';
import { TipService, Tip, CreateTipRequest } from '../../services/tip.service';
import { FILES_CONFIG, FileUrlBuilder } from '../../config/files.config';
import { DiagramEditorComponent } from '../diagram-editor/diagram-editor.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, DiagramEditorComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit, AfterViewInit {

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

  tip: CreateTipRequest = {
    tip: ''
  };

  newDialogue: string = '';
  editingDialogueIndex: number = -1;

  avatars: Avatar[] = [];
  characters: Character[] = [];
  phases: Phase[] = [];
  tips: Tip[] = [];
  gameMaps: GameMap[] = [];

  editAvatarId?: number;
  editCharacterId?: number;
  editPhaseId?: number;
  editTipId?: number;

  avatarImageFile?: File;
  characterImageFile?: File;

  avatarPreview?: string;
  characterPreview?: string;

  user?: User | null;
  filesPath: string = FILES_CONFIG.BASE_URL;

  @ViewChildren(DiagramEditorComponent) diagramEditors!: QueryList<DiagramEditorComponent>;


  selectedGameMapId: number = 0;
  selectedCharacterId: number = 0;

  activeTab: string = 'avatars';

  tabs = [
    { id: 'avatars', name: 'Avatars' },
    { id: 'characters', name: 'Personagens' },
    { id: 'gamemaps', name: 'GameMaps' },
    { id: 'phases', name: 'Fases' },
    { id: 'tips', name: 'Dicas' }
  ];

  editingCorrectDiagramIndex: number = -1;
  correctDiagramPreview: string = '';

  gameMap: GameMap = {
    title: '',
    users: [],
    phases: []
  };

  editGameMapId?: number;

  constructor(
    private adminService: AdminPanelService,
    private authService: AuthService,
    private tipService: TipService,
    private gameMapService: GameMapService
  ) { }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;

    if (this.activeTab === 'phases') {
      setTimeout(() => {
        console.log('Inicializando editores de diagrama...');

        if (this.diagramEditors && this.diagramEditors.length > 0) {
          this.diagramEditors.forEach((editor, index) => {
            console.log(`Inicializando editor ${index + 1}/${this.diagramEditors.length}`);
            editor.initializeJointJS();
          });
          console.log(`${this.diagramEditors.length} editores inicializados`);
        } else {
          console.warn('Nenhum DiagramEditor encontrado');
        }
      }, 0);

    } else if (this.diagramEditors && this.diagramEditors.length > 0) {
      console.log('Limpando diagramas ao sair da tab de fases');
      this.diagramEditors.forEach((editor, index) => {
        if (editor.isInitialized()) {
          editor.reinitialize();
        }
      });
    }
  }

  private getInitialDiagramEditor(): DiagramEditorComponent | undefined {
    return this.diagramEditors?.toArray()[0];
  }

  private getCorrectDiagramEditor(): DiagramEditorComponent | undefined {
    return this.diagramEditors?.toArray()[1];
  }

  getAvatarImageUrl(fileName: string): string {
    return FileUrlBuilder.avatar(fileName);
  }

  getCharacterImageUrl(fileName: string): string {
    return FileUrlBuilder.character(fileName);
  }

  ngOnInit() {
    this.loadAll();
    this.user = this.authService.getCurrentUser();
  }

  ngAfterViewInit() {

  }

  loadAll() {
    this.loadAvatars();
    this.loadCharacters();
    this.loadPhases();
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

  onSubmitPhase() {
    if (!this.selectedCharacterId || this.selectedCharacterId === 0) {
      alert('Por favor, selecione um personagem para a fase.');
      return;
    }

    if (!this.selectedGameMapId || this.selectedGameMapId === 0) {
      alert('Por favor, selecione um GameMap para a fase.');
      return;
    }

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

    this.selectedCharacterId = 0;
    this.selectedGameMapId = 0;

    this.editPhaseId = undefined;

    this.newDialogue = '';
    this.editingDialogueIndex = -1;

    this.editingCorrectDiagramIndex = -1;

    if (this.diagramEditors && this.diagramEditors.length > 0) {
      console.log('Reinicializando ambos os editores (reset form)');
      this.diagramEditors.forEach((editor, index) => {
        if (editor.isInitialized()) {
          console.log(`Reinicializando editor ${index + 1}`);
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
      characterDialogues: p.characterDialogues || []
    };

    this.selectedCharacterId = p.character?.id || 0;
    this.selectedGameMapId = p.gameMap?.id || 0;

    console.log("Selected GameMap ID:", this.selectedGameMapId);

    this.editPhaseId = p.id;

    const initialEditor = this.getInitialDiagramEditor();
    if (initialEditor?.isInitialized() && p.diagramInitial) {
      try {
        const diagramJSON = JSON.parse(p.diagramInitial);
        if (diagramJSON.cells) {
          initialEditor.reinitialize();
          setTimeout(() => {
            if (initialEditor.graph) {
              initialEditor.graph.fromJSON(diagramJSON);
              console.log('Diagrama inicial carregado para edição');
            }
          }, 100);
        }
      } catch (error) {
        console.warn('Erro no JSON, reinicializando vazio:', error);
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

  addDialogue() {
    if (this.newDialogue.trim()) {
      if (this.editingDialogueIndex >= 0) {
        this.phase.characterDialogues[this.editingDialogueIndex] = this.newDialogue.trim();
        this.editingDialogueIndex = -1;
      } else {
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
    if (this.editingDialogueIndex === index) {
      this.cancelEditDialogue();
    } else if (this.editingDialogueIndex > index) {
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

      if (this.editingDialogueIndex === index) {
        this.editingDialogueIndex = index + 1;
      } else if (this.editingDialogueIndex === index + 1) {
        this.editingDialogueIndex = index;
      }
    }
  }

  saveDiagramToPhase() {
    const editor = this.getInitialDiagramEditor();

    if (!editor?.isInitialized()) {
      alert('Editor de diagrama inicial não está inicializado');
      return;
    }

    const currentJSON = editor.getCurrentDiagramJSON();

    if (currentJSON && currentJSON.cells && currentJSON.cells.length > 0) {
      this.phase.diagramInitial = JSON.stringify(currentJSON);
      alert('Diagrama inicial salvo!');
      console.log('Diagrama inicial salvo:', currentJSON);
    } else {
      alert('Adicione elementos ao diagrama antes de salvar');
    }
  }

  clearDiagram() {
    const initialEditor = this.getInitialDiagramEditor();

    if (!initialEditor?.isInitialized()) {
      alert('Editor de diagrama inicial não está disponível');
      return;
    }

    if (confirm('Limpar o diagrama inicial?')) {
      initialEditor.reinitialize();
      this.phase.diagramInitial = '';
      alert('Diagrama inicial limpo!');
    }
  }

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

  saveCorrectDiagram() {
    const editor = this.getCorrectDiagramEditor();

    if (!editor?.isInitialized()) {
      alert('Editor de diagramas corretos não está inicializado');
      return;
    }

    const currentJSON = editor.getCurrentDiagramJSON();

    if (!currentJSON || !currentJSON.cells || currentJSON.cells.length === 0) {
      alert('Crie um diagrama antes de salvá-lo como correto');
      return;
    }

    try {
      const jsonString = JSON.stringify(currentJSON);

      if (this.editingCorrectDiagramIndex >= 0) {
        this.phase.correctDiagrams[this.editingCorrectDiagramIndex] = jsonString;
        this.editingCorrectDiagramIndex = -1;
        alert('Diagrama correto atualizado!');
      } else {
        this.phase.correctDiagrams = this.phase.correctDiagrams || [];
        this.phase.correctDiagrams.push(jsonString);
        alert('Diagrama correto adicionado!');
      }

      editor.reinitialize();
      console.log('Diagrama correto salvo:', currentJSON);
    } catch (error) {
      console.error('Erro ao salvar diagrama correto:', error);
      alert('Erro ao salvar diagrama correto');
    }
  }

  editCorrectDiagram(index: number) {
    try {
      const diagramJSON = JSON.parse(this.phase.correctDiagrams[index]);
      const editor = this.getCorrectDiagramEditor();

      if (!editor?.isInitialized()) {
        alert('Editor de diagramas corretos não está inicializado');
        return;
      }

      editor.reinitialize();
      setTimeout(() => {
        if (editor.graph) {
          editor.graph.fromJSON(diagramJSON);
          this.editingCorrectDiagramIndex = index;
          console.log('Diagrama correto carregado para edição:', diagramJSON);
        }
      }, 100);

    } catch (error) {
      console.error('Erro ao carregar diagrama para edição:', error);
      alert('Erro ao carregar diagrama para edição');
    }
  }

  cancelEditCorrectDiagram() {
    this.editingCorrectDiagramIndex = -1;

    const editor = this.getCorrectDiagramEditor();
    if (editor?.isInitialized()) {
      editor.reinitialize();
    }
  }

  clearCorrectDiagram() {
    const correctEditor = this.getCorrectDiagramEditor();

    if (!correctEditor?.isInitialized()) {
      alert('Editor de diagramas corretos não está disponível');
      return;
    }

    if (confirm('Limpar o editor de diagramas corretos?')) {
      correctEditor.reinitialize();
      this.editingCorrectDiagramIndex = -1;
      alert('Editor de diagramas corretos limpo!');
    }
  }

  getCorrectDiagramPreview(jsonString: string): string {
    try {
      const diagram = JSON.parse(jsonString);
      const elementsCount = diagram.cells ? diagram.cells.length : 0;
      const actors = diagram.cells?.filter((cell: any) => cell.type === 'custom.Actor').length || 0;
      const useCases = diagram.cells?.filter((cell: any) => cell.type === 'custom.UseCase').length || 0;
      const connections = diagram.cells?.filter((cell: any) => cell.type?.includes('Link') || cell.type?.includes('custom.')).length || 0;

      return `${elementsCount} elementos (${actors} atores, ${useCases} casos de uso)`;
    } catch (error) {
      return 'JSON inválido';
    }
  }

  removeCorrectDiagram(index: number) {
    if (confirm('Remover este diagrama correto?')) {
      this.phase.correctDiagrams.splice(index, 1);

      if (this.editingCorrectDiagramIndex === index) {
        this.cancelEditCorrectDiagram();
      } else if (this.editingCorrectDiagramIndex > index) {
        this.editingCorrectDiagramIndex--;
      }

      alert('Diagrama correto removido!');
    }
  }

  moveCorrectDiagramUp(index: number) {
    if (index > 0) {
      const temp = this.phase.correctDiagrams[index];
      this.phase.correctDiagrams[index] = this.phase.correctDiagrams[index - 1];
      this.phase.correctDiagrams[index - 1] = temp;

      if (this.editingCorrectDiagramIndex === index) {
        this.editingCorrectDiagramIndex = index - 1;
      } else if (this.editingCorrectDiagramIndex === index - 1) {
        this.editingCorrectDiagramIndex = index;
      }

      console.log('Diagrama correto movido para cima');
    }
  }

  moveCorrectDiagramDown(index: number) {
    if (index < this.phase.correctDiagrams.length - 1) {
      const temp = this.phase.correctDiagrams[index];
      this.phase.correctDiagrams[index] = this.phase.correctDiagrams[index + 1];
      this.phase.correctDiagrams[index + 1] = temp;

      if (this.editingCorrectDiagramIndex === index) {
        this.editingCorrectDiagramIndex = index + 1;
      } else if (this.editingCorrectDiagramIndex === index + 1) {
        this.editingCorrectDiagramIndex = index;
      }

      console.log('Diagrama correto movido para baixo');
    }
  }

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
          alert('GameMap atualizado com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao atualizar gameMap:', error);
          alert('Erro ao atualizar GameMap');
        }
      });
    } else {
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
          alert('GameMap criado com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao criar gameMap:', error);
          alert('Erro ao criar GameMap');
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
      if (confirm(`Remover o GameMap "${gm.title}"?\n\nAtenção: Isso pode afetar as fases vinculadas.`)) {
        this.gameMapService.deleteGameMap(gm.id).subscribe({
          next: () => {
            this.loadGameMaps();
            alert('GameMap removido com sucesso!');
          },
          error: (error) => {
            console.error('Erro ao deletar gameMap:', error);
            alert('Erro ao remover GameMap');
          }
        });
      }
    }
  }

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
}
