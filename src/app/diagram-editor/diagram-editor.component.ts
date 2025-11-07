import { Component, ElementRef, OnInit, AfterViewInit, OnDestroy, ViewChild, HostListener, PLATFORM_ID, Inject, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as joint from '@joint/core';
import { UMLElementUtil } from '../utils/uml-element.util';
import { LucideIconsModule } from '../lucide-icons.module';
import { DataService } from '../../services/data.service';
import { CarouselComponent } from '../utils/carousel/carousel.component';
import { Phase } from '../../services/phase.service';
import { PhaseUser } from '../../services/game-map.service';

import '../utils/uml-shapes'; // ← Isso garante que o registro aconteça
import { FormsModule } from '@angular/forms';


@Component({
  standalone: true,
  selector: 'diagram-editor',
  imports: [CommonModule, LucideIconsModule, CarouselComponent, FormsModule],
  templateUrl: './diagram-editor.component.html',
  styleUrl: './diagram-editor.component.css'
})
export class DiagramEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() accuracyCalculated = new EventEmitter<number>();

  @Input() phaseUser!: PhaseUser | undefined;
  @Input() tips!: string[] | undefined;
  @Input() diagramType!: 'USE_CASE' | 'CLASS';

  tipsVisible: boolean = false;
  
  private paper: joint.dia.Paper | null = null;
  public graph: joint.dia.Graph | null = null;
  private zoomLevel: number = 1;
  private readonly zoomMin: number = 0.2;
  private readonly zoomMax: number = 3;
  private readonly zoomStep: number = 0.03;


  private initialJSON: any;
  
  private correctsJSON: any[] = [];
  

  // Botão de remover elemento
  private removeBtn: HTMLButtonElement | null = null;
  private currentCellView: joint.dia.ElementView | joint.dia.LinkView | null = null;

  private multiplicityBtns: Array<HTMLButtonElement> = [];
  private currentMultiplicityPopup: HTMLDivElement | null = null;
  private multiplicityOptions = ['1', '0..1', '0..*', '*', '1..*', 'Unspecified'];

  private currentMultiplicityPopupAnchor: HTMLButtonElement | null = null;


  // Editor inline
  private currentInlineEditor: HTMLDivElement | null = null;
  private currentEditingCellView: joint.dia.ElementView | joint.dia.LinkView | null = null;

  // Botão de link
  private linkBtn: HTMLButtonElement | null = null;
  private linkingSource: joint.dia.Element | null = null;

  // Tipo de link que está sendo criado
  private linkingType: string | null = null;

  private currentMultiplicityLink: joint.dia.Link | null = null;

  //  Propriedades para controlar botões ativos
  private activeButton: string | null = null;
  private isWaitingForClick: boolean = false;


  @ViewChild('paperContainer', { static: true }) paperContainer!: ElementRef;
  @ViewChild('wrapperBoard', { static: true }) wrapperBoard!: ElementRef<HTMLElement>;
  @ViewChild('clues', { static: false }) clues?: ElementRef<HTMLElement>;
  @ViewChild('inspector', { static: false }) inspectorRef!: ElementRef<HTMLElement>;

  // bound handler for scroll/resize to keep the inspector positioned correctly
  private boundUpdateInspectorPosition = () => this.updateInspectorPosition();
  private boundUpdateCluesPosition = () => this.updateCluesPosition();

  public inconsistencies: string[] = [];

  //  Propriedade para armazenar o handler ativo
  private activeClickHandler: ((evt: MouseEvent) => void) | null = null;

  public inspectorVisible: boolean = false;
  public inspectorTab: 'general' | 'attributes' | 'operations' = 'general';
  public selectedClassElement: joint.dia.Element | null = null;

  public inspectorData: {
    name: string;
    stereotype: string;
    attributes: Array<{ name: string; visibility: string; type: string }>;
    operations: Array<{ signature: string; visibility: string; returnType: string }>;
  } = {
    name: '',
    stereotype: '',
    attributes: [],
    operations: []
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
   
  }
  
  ngAfterViewInit(): void {
    // register scroll/resize listeners so the inspector stays aligned to the visible
    // area of the wrapper-board whenever the user scrolls or resizes the window
    try {
      if (this.wrapperBoard && this.wrapperBoard.nativeElement) {
        this.wrapperBoard.nativeElement.addEventListener('scroll', this.boundUpdateInspectorPosition, { passive: true });
        this.wrapperBoard.nativeElement.addEventListener('scroll', this.boundUpdateCluesPosition, { passive: true });
      }
    } catch (e) {
      // ignore listener registration errors
    }
    window.addEventListener('resize', this.boundUpdateInspectorPosition);
    window.addEventListener('resize', this.boundUpdateCluesPosition);
  }

  public initializeJointJS(phase?: Phase, phaseUser?: PhaseUser): void {
    // ✅ Verificar se os dados estão disponíveis antes de inicializar
    if(phase) {
      console.log('🔧 Inicializando JointJS com Phase fornecido:', phase);
      // Configurando dados do diagrama com PhaseUser fornecido
      this.setupDiagramData(phase);
    } else if (phaseUser) {
      console.log('🔧 Inicializando JointJS com PhaseUser fornecido:', phaseUser);
      // Configurando dados do diagrama com PhaseUser fornecido
      this.setupDiagramData(undefined, phaseUser);
    } else {
      console.log('Iniciando JointJS sem Phase, usando dados padrão ou vazios');
      this.setupDiagramData();
    }

    //  Criar namespace que inclui as classes customizadas
    const cellNamespace = {
      ...joint.shapes,
      custom: (joint.shapes as any).custom
    };

    this.graph = new joint.dia.Graph({}, { cellNamespace: cellNamespace });

    // ✅ Popula o graph APENAS se tiver dados
    if (this.initialJSON) {
      console.log('📊 Carregando diagrama inicial:', this.initialJSON);
      this.graph.fromJSON(this.initialJSON);
    }

    const container = this.paperContainer.nativeElement as HTMLElement;
    const width = 2000;
    const height = 2000;

    this.paper = new joint.dia.Paper({
      el: this.paperContainer.nativeElement,
      model: this.graph,
      width: width,
      height: height,
      gridSize: 10,
      drawGrid: true,
      defaultLink: new joint.shapes.standard.Link(),
    });

    this.paper.initialize();

    
    this.wrapperBoard.nativeElement.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });

    this.wrapperBoard.nativeElement.addEventListener('scroll', () => {
      console.log('Scroll detected, updating floating elements position');
      this.updateFloatingElementsPosition();
    });

    // Adiciona o evento de clique duplo para editar o texto do elemento
    this.paper.on('element:pointerdblclick', (cellView: joint.dia.ElementView, evt: joint.dia.Event) => {
      evt.stopPropagation(); // Impede que o evento se propague para o elemento pai
      this.showInlineEditor(cellView, evt);
    });

    // Adiciona o evento de clique duplo para editar o texto do link
    this.paper.on('link:pointerdblclick', (linkView: joint.dia.LinkView, evt: joint.dia.Event) => {
      evt.stopPropagation(); // Impede que o evento se propague para o elemento pai
      this.showInlineEditor(linkView, evt);
    });

    // Adiciona o evento de clique para adicionar elementos dinâmicos (botão de remover e link)
    this.paper.on('element:pointerclick', (cellView: joint.dia.ElementView) => {
      this.showRemoveButton(cellView);
      this.showLinkButton(cellView);
    });

    // Adiciona o evento de clique para adicionar botão de remover ao link
    this.paper.on('link:pointerclick', (linkView: joint.dia.LinkView) => {
      this.showRemoveButton(linkView);
    });

    // Esconde o botão de remover ao clicar fora do elemento
    this.paper.on('blank:pointerdown', () => {
      this.hideRemoveButton();
      this.hideLinkButton();
      this.showInlineEditor(this.currentCellView);
    });

    // Atualiza a posição do botão de remover ao mover o mouse sobre o elemento
    this.paper.on('element:pointermove', (cellView: joint.dia.ElementView) => {
      this.updateFloatingElementsPosition();
    });

    this.paper.on('element:pointermove', (cellView: joint.dia.ElementView) => {
      if (this.currentEditingCellView === cellView) {
        this.updateFloatingElementsPosition();
      }
    });

    this.paper.on('element:pointerclick', (cellView: joint.dia.ElementView) => {
      const el = cellView.model;
      if (el && el.get('type') === 'custom.Class') {
        // abre inspector
        this.openInspector(el);
      } else {
        this.closeInspector();
      }
    });

    // Esconde inspector quando clicar no espaço em branco
    this.paper.on('blank:pointerdown', () => {
      this.closeInspector();
    });
  }

  private onMouseWheel(event: WheelEvent) {
    if (!this.paper) return;

    // Só faz zoom se for gesto de pinça (ctrlKey ou metaKey)
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();


      const container = document.querySelector('.wrapper-board') as HTMLElement; // container
      const paperElement = container.querySelector('.board') as HTMLElement; // paper

      const zoomIn = event.deltaY < 0;
      let newZoom = this.zoomLevel + (zoomIn ? this.zoomStep : -this.zoomStep);
      newZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, newZoom));

      // Posição do mouse relativa ao container
      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left + container.scrollLeft;
      const mouseY = event.clientY - rect.top + container.scrollTop;

      // Fator de escala
      const scale = newZoom / this.zoomLevel;

      // Ajusta o scroll para manter o ponto do mouse fixo
      container.scrollLeft = (mouseX * scale) - (event.clientX - rect.left);
      container.scrollTop = (mouseY * scale) - (event.clientY - rect.top);

      // Aplica o zoom via CSS transform
      if (paperElement) {
        paperElement.style.transformOrigin = '0 0';
        paperElement.style.transform = `scale(${newZoom})`;

      }

      this.zoomLevel = newZoom;
    }
    // Após aplicar o zoom:
    this.updateFloatingElementsPosition();
  }

  private setCursor(style: string) {
    if (this.paperContainer && this.paperContainer.nativeElement) {
      this.paperContainer.nativeElement.style.cursor = style;
    }
  }

  onDragStart(event: DragEvent, type: string) {
    event.dataTransfer?.setData('uml-type', type);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const type = event.dataTransfer?.getData('uml-type');
    if(this.graph && this.paper) {
      // Verifica se o tipo é válido
      if (!type || (type !== 'actor' && type !== 'usecase' && type !== 'class')) {
        console.error('Invalid UML element type:', type);
        return;
      }

      // Chama a função para adicionar o elemento
      this.addElement(type, event);
    }
  }

  //  Método addElement para gerenciar estado ativo
  addElement(type?: string, event?: MouseEvent) {
    // ✅ CANCELAR operação ativa anterior e limpar handlers
    if (this.isWaitingForClick) {
      this.cancelActiveOperation();
    }

    // Verifica se o graph e o paper foram inicializados
    if (this.graph && this.paper) {
      const container = this.paperContainer.nativeElement as HTMLElement;

      // Se não recebeu o evento, adiciona um listener de click para capturar o próximo clique
      if(!event) {
        // ✅ Ativar botão e aguardar clique
        this.setActiveButton(type || '');
        this.isWaitingForClick = true;

        //  Remover handler anterior se existir
        if (this.activeClickHandler) {
          container.removeEventListener('click', this.activeClickHandler);
        }

        // ✅ Criar novo handler e armazenar referência
        this.activeClickHandler = (evt: MouseEvent) => {
          // Remove o listener após o clique
          container.removeEventListener('click', this.activeClickHandler!);
          this.activeClickHandler = null;
          
          // ✅ Desativar botão após uso
          this.clearActiveButton();
          this.isWaitingForClick = false;
          
          // Chama addElement novamente, agora com o evento
          this.addElement(type, evt);
        };

        // ✅ Adicionar o novo handler
        container.addEventListener('click', this.activeClickHandler);
        
        // Muda o cursor para indicar que está aguardando o clique
        this.setCursor('crosshair');
        return;
        
      } else if (event && type) {
        const rect = container.getBoundingClientRect();

        // Posição do mouse relativa ao container
        const clientX = event.clientX - rect.left + container.scrollLeft;
        const clientY = event.clientY - rect.top + container.scrollTop;

        // Ajuste para o zoom atual
        const scaledX = clientX / this.zoomLevel;
        const scaledY = clientY / this.zoomLevel;

        switch (type) {
          case 'actor': {
            const actor = UMLElementUtil.createActor(scaledX, scaledY);
            actor.addTo(this.graph);
            break;
          }
          case 'usecase': {
            const useCase = UMLElementUtil.createUseCase(scaledX, scaledY);
            useCase.addTo(this.graph);
            break;
          }
          case 'class': {
            // Insere a classe na posição do mouse (mesma lógica de actor/usecase)
            const cls = UMLElementUtil.createClass(scaledX, scaledY, {
              name: 'NewClass',
              attributes: ['+ attr1: type'],
              operations: ['+ operation(): void']
            });
            cls.addTo(this.graph);
            break;
          }
          // Adicione outros tipos conforme necessário
          default:
            console.error('Unknown element type:', type);
            break;
        }
        // Voltar o cursor ao normal após adicionar o elemento
        this.setCursor('default');
      }
    } else {
      console.error('Graph or paper not initialized');
      return;
    }

  }

  // Método addLink para gerenciar estado ativo
  addLink(type: string) {
    // Cancelar operação ativa 
    if (this.isWaitingForClick) {
      this.cancelActiveOperation();
    }
    // Ativar botão de link
    this.setActiveButton(`link-${type}`);
    this.isWaitingForClick = true;

    this.linkingType = type;
    this.linkingSource = null;

    // Aguarda o primeiro clique (origem)
    const selectSource = (cellView: joint.dia.ElementView) => {
      this.linkingSource = cellView.model;

      // Aguarda o segundo clique (destino)
      const selectTarget = (targetView: joint.dia.ElementView) => {
        if (this.linkingSource && targetView.model.id !== this.linkingSource.id) {
          // Cria o link usando o utilitário
          const link = UMLElementUtil.createLink(this.linkingSource, targetView.model, this.linkingType!);
          link.addTo(this.graph!);
        }

        // ✅ Desativar botão após completar o link
        this.clearActiveButton();
        this.isWaitingForClick = false;

        // Limpa listeners
        this.paper!.off('element:pointerclick', selectTarget);
        this.linkingSource = null;
        this.linkingType = null;
      };

      this.paper!.once('element:pointerclick', selectTarget);
      // Remove listener de origem para evitar múltiplos triggers
      this.paper!.off('element:pointerclick', selectSource);
    };

    this.paper!.on('element:pointerclick', selectSource);
  }

  // Método para definir botão ativo
  private setActiveButton(buttonType: string): void {
    this.activeButton = buttonType;
  }

  // Método para limpar botão ativo
  private clearActiveButton(): void {
    this.activeButton = null;
  }

  //  Método público para verificar se um botão está ativo
  public isButtonActive(buttonType: string): boolean {
    return this.activeButton === buttonType;
  }

  //  Método para cancelar operação ativa
  public cancelActiveOperation(): void {
    if (this.isWaitingForClick) {
      this.clearActiveButton();
      this.isWaitingForClick = false;
      this.setCursor('default');
      
      //  Remover handler ativo de elemento
      if (this.activeClickHandler) {
        const container = this.paperContainer.nativeElement as HTMLElement;
        container.removeEventListener('click', this.activeClickHandler);
        this.activeClickHandler = null;
      }
      
      // Limpar operações de link se estiver ativas
      if (this.linkingType) {
        this.paper?.off('element:pointerclick');
        this.linkingSource = null;
        this.linkingType = null;
      }
    }
  }

  private showInlineEditor(cellView: joint.dia.ElementView | null | joint.dia.LinkView, evt?: joint.dia.Event): void {
    if(!cellView || !this.paper) {
      // Remove editores anteriores, se houver
      const existingEditor = document.querySelector('.inline-editor');
      if (existingEditor) {
        existingEditor.remove();
      }
      return
    };

    this.currentCellView = cellView;
    
    const element = cellView.model;
    const paper = cellView.paper;

    const labelNode = cellView.el.querySelector('text') as SVGTextElement;

    if (!labelNode) return;

    const labelRect = labelNode.getBoundingClientRect();

    console.log('Element clicked:', element);

    // Verifica se o elemento e o paper estão definidos
    if (!element || !paper) return;

    // Remove editores anteriores, se houver
    const existingEditor = document.querySelector('.inline-editor');
    if (existingEditor) {
      existingEditor.remove();
    }

    // Cria o editor
    const inputDiv = document.createElement('div');
    inputDiv.className = 'inline-editor';
    inputDiv.contentEditable = 'true';
    inputDiv.style.position = 'absolute';
    inputDiv.style.minWidth = `${labelRect.width}px`;
    inputDiv.style.left = `${labelRect.left + window.scrollX}px`;
    inputDiv.style.top = `${labelRect.top + window.scrollY}px`;
    inputDiv.style.zIndex = '1000';

    // Texto atual do elemento ou link
    const label = element.isLink()
      ? (element.label(0)?.attrs?.['text']?.text || '')
      : (element.attr(['label', 'text']) || '');
    inputDiv.innerText = label;

    // Insere no body
    document.body.appendChild(inputDiv);

    this.currentInlineEditor = inputDiv;
    this.currentEditingCellView = cellView;

    this.updateFloatingElementsPosition();

    // Foco automático
    inputDiv.focus();


    // Finalizar edição (Enter ou clicar fora)
    const finishEditing = () => {
      const newText = inputDiv.innerText.trim();

      // Verifica se o elemento é um link ou um elemento normal
      if (element.isLink()) {
        element.label(0, {
          attrs: {
            text: { text: newText, fontSize: 14, fill: '#000' },
            rect: { fill: '#fff', stroke: '#000', strokeWidth: 0 }
          },
          position: { distance: 0.5 }
        });
      } else {
        element.attr(['label', 'text'], newText);

        // Ajusta o tamanho do elemento conforme o tamanho do .inline-editor
        const editorRect = inputDiv.getBoundingClientRect();
        // Adicione um padding se desejar
        const paddingX = 32;
        const paddingY = 16;

        if(element.get('type') === 'custom.UseCase') {
          element.resize(editorRect.width + paddingX, editorRect.height + paddingY);
          this.updateFloatingElementsPosition();
        }
      }
      inputDiv.remove();
    };

    inputDiv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditing();
        this.currentCellView = null;
      }
    });


  }

  private showRemoveButton(cellView: joint.dia.ElementView | joint.dia.LinkView) {
    this.hideRemoveButton(); // Remove botão anterior, se existir
    this.currentCellView = cellView;

    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.style.position = 'absolute';
    btn.style.zIndex = '7';

    //Cria o ícone do Lucide
    const lucideIcon = document.createElement('img');
    lucideIcon.setAttribute('src', 'assets/icons/trash-2.svg'); // Caminho para o ícone
    lucideIcon.classList.add('lucide-icon');
    btn.appendChild(lucideIcon);

    btn.onclick = () => {
      // Remove o elemento do graph
      cellView.model.remove();
      this.hideRemoveButton();
      this.hideLinkButton(); // Esconde o botão de link se existir
      this.currentCellView = null;
      this.currentEditingCellView = null; // Limpa o editor inline atual
    };

    document.body.appendChild(btn);
    this.removeBtn = btn;

    // Se for um link, adiciona botões extras (multiplicidade) se estiver ligado a duas classes
    if (cellView.model.isLink()) {
      const link = cellView.model as joint.dia.Link;
      // Check if both ends are connected to elements of type custom.Class
      const srcElem = link.getSourceElement();
      const tgtElem = link.getTargetElement();

      if (srcElem && tgtElem && srcElem.get('type') === 'custom.Class' && tgtElem.get('type') === 'custom.Class') {
        // cria botões de multiplicidade (esquerda/direita)
        this.showMultiplicityButtons(link);
      }
    }
    
    this.updateFloatingElementsPosition();
  }

  private showLinkButton(cellView: joint.dia.ElementView) {
    this.hideLinkButton(); // Remove botão anterior, se existir

    const bbox = cellView.getBBox();
    const point = this.paper!.localToClientPoint({ x: bbox.x + bbox.width, y: bbox.y + 32 }); // Ajuste Y para não sobrepor o remover

    const btn = document.createElement('button');
    btn.className = 'link-btn';
    btn.innerHTML = '-';
    btn.style.position = 'absolute';
    btn.style.left = `${point.x + window.scrollX}px`;
    btn.style.top = `${point.y + window.scrollY}px`;

    btn.onclick = () => {
      this.linkingSource = cellView.model;
      btn.classList.add('active');
      
      // Aguarda o próximo clique em outro elemento
      this.paper!.once('element:pointerclick', (targetView: joint.dia.ElementView) => {
        if (targetView.model.id !== this.linkingSource!.id) {
          const link = new joint.shapes.standard.Link();
          link.source(this.linkingSource!);
          link.target(targetView.model);
          // Remove a seta do final
          link.attr('line/targetMarker', { d: '' });
          link.addTo(this.graph!);
        }
        this.linkingSource = null;
        this.hideLinkButton();
      });
    };

    document.body.appendChild(btn);
    this.linkBtn = btn;
  }

  private hideRemoveButton() {
    if (this.removeBtn && this.removeBtn.parentNode) {
      this.removeBtn.parentNode.removeChild(this.removeBtn);
      this.removeBtn = null;
      this.currentCellView = null;
    }

    // Remove botões de multiplicidade
    if (this.multiplicityBtns && this.multiplicityBtns.length) {
      for (const mb of this.multiplicityBtns) {
        if (mb.parentNode) mb.parentNode.removeChild(mb);
      }
      this.multiplicityBtns = [];
    }

    // limpa link atual de multiplicity
    this.currentMultiplicityLink = null;

    // Remove popup se existir
    if (this.currentMultiplicityPopup && this.currentMultiplicityPopup.parentNode) {
      this.currentMultiplicityPopup.parentNode.removeChild(this.currentMultiplicityPopup);
      this.currentMultiplicityPopup = null;
      this.currentMultiplicityPopupAnchor = null; // limpa anchor
    }
  }

  /**
   * Cria e posiciona (inicialmente) os botões de multiplicidade para um link que conecta duas classes.
   * Um botão será posicionado próximo à extremidade de origem e outro na extremidade de destino.
   * A posição real fica a cargo de updateFloatingElementsPosition() para garantir atualização contínua.
   */
  private showMultiplicityButtons(link: joint.dia.Link) {
    if (!this.paper) return;
    // remove anteriores por segurança
    this.multiplicityBtns.forEach(b => { if (b.parentNode) b.parentNode.removeChild(b); });
    this.multiplicityBtns = [];

    try {
      const srcElem = link.getSourceElement();
      const tgtElem = link.getTargetElement();
      if (!srcElem || !tgtElem) return;

      // marque qual link está com botões ativos
      this.currentMultiplicityLink = link;

      // cria botão para source (posição inicial temporária; será recomputada)
      const btnSrc = document.createElement('button');
      btnSrc.className = 'multiplicity-btn';
      btnSrc.type = 'button';
      btnSrc.innerText = '*';
      btnSrc.style.position = 'absolute';
      btnSrc.style.left = `0px`;
      btnSrc.style.top = `0px`;
      btnSrc.style.zIndex = '40';
      document.body.appendChild(btnSrc);
      this.multiplicityBtns.push(btnSrc);

      // cria botão para target (posição inicial temporária; será recomputada)
      const btnTgt = document.createElement('button');
      btnTgt.className = 'multiplicity-btn';
      btnTgt.type = 'button';
      btnTgt.innerText = '*';
      btnTgt.style.position = 'absolute';
      btnTgt.style.left = `0px`;
      btnTgt.style.top = `0px`;
      btnTgt.style.zIndex = '40';
      document.body.appendChild(btnTgt);
      this.multiplicityBtns.push(btnTgt);

      // Handler: open popup com opções perto do botão (createMultiplicityPopup usa o botão como âncora)
      btnSrc.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.createMultiplicityPopup(link, 'source', btnSrc);
      });
      btnTgt.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.createMultiplicityPopup(link, 'target', btnTgt);
      });

      // força uma computação imediata da posição via a rotina centralizada
      this.updateFloatingElementsPosition();

    } catch (err) {
      console.warn('showMultiplicityButtons failed', err);
    }
  }

    /**
   * Cria pequeno popup com opções de multiplicidade e o posiciona perto do botão passado.
   * side = 'source' | 'target'
   */
  private createMultiplicityPopup(link: joint.dia.Link, side: 'source' | 'target', anchorBtn: HTMLButtonElement) {
    // limpa popup antigo
    if (this.currentMultiplicityPopup && this.currentMultiplicityPopup.parentNode) {
      this.currentMultiplicityPopup.parentNode.removeChild(this.currentMultiplicityPopup);
      this.currentMultiplicityPopup = null;
    }

    const popup = document.createElement('div');
    popup.className = 'multiplicity-popup';
    popup.style.position = 'absolute';
    popup.style.zIndex = '10';
    popup.style.background = '#fff';
    popup.style.border = '1px solid rgba(0,0,0,0.12)';
    popup.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
    popup.style.padding = '8px';
    popup.style.borderRadius = '6px';
    popup.style.minWidth = '120px';
    popup.style.marginLeft = '12px';

    // populate options
    for (const opt of this.multiplicityOptions) {
      const item = document.createElement('div');
      item.className = 'multiplicity-option';
      item.innerText = opt;
      item.style.padding = '6px 8px';
      item.style.cursor = 'pointer';
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        // aplica multiplicidade no link
        this.setLinkMultiplicity(link, side, opt === 'Unspecified' ? '' : opt);
        // remove popup
        if (popup.parentNode) popup.parentNode.removeChild(popup);
        this.currentMultiplicityPopup = null;
        this.currentMultiplicityPopupAnchor = null; // limpa a âncora
      });
      popup.appendChild(item);
    }

    // position popup near anchorBtn
    const rect = anchorBtn.getBoundingClientRect();
    popup.style.left = `${rect.left + window.scrollX + 20}px`;
    popup.style.top = `${rect.top + window.scrollY - 8}px`;

    document.body.appendChild(popup);
    this.currentMultiplicityPopup = popup;
    this.currentMultiplicityPopupAnchor = anchorBtn; // guarda a âncora

    // close popup when clicking elsewhere
    const closeFn = (ev: MouseEvent) => {
      if (this.currentMultiplicityPopup && !this.currentMultiplicityPopup.contains(ev.target as Node)) {
        if (this.currentMultiplicityPopup.parentNode) this.currentMultiplicityPopup.parentNode.removeChild(this.currentMultiplicityPopup);
        this.currentMultiplicityPopup = null;
        document.removeEventListener('click', closeFn);
      }
    };
    // use next tick to avoid immediate close from the click that opened the popup
    setTimeout(() => document.addEventListener('click', closeFn), 0);
  }

    /**
   * Set/link multiplicity metadata and update the label shown on the link.
   * side: 'source' or 'target'
   */
  private setLinkMultiplicity(link: joint.dia.Link, side: 'source' | 'target', value: string) {
    // store metadata
    const uml = (link as any).get('uml') || {};
    if (side === 'source') {
      uml.sourceMultiplicity = value || '';
    } else {
      uml.targetMultiplicity = value || '';
    }
    link.set('uml', uml);

    // Update link labels: ensure two labels exist (source index 0, target index 1)
    try {
      const srcLabelText = uml.sourceMultiplicity || '';
      const tgtLabelText = uml.targetMultiplicity || '';

      // If link has labels, we will try to preserve existing other labels, but here we specifically set indexes 0 and 1
      // distances near the ends
      const labels = [
        {
          attrs: {
            text: { text: srcLabelText, fontSize: 12, fill: '#333' },
            rect: { fill: 'transparent', stroke: 'none' }
          },
          position: { distance: 0.1, offset: -10 }
        },
        {
          attrs: {
            text: { text: tgtLabelText, fontSize: 12, fill: '#333' },
            rect: { fill: 'transparent', stroke: 'none' }
          },
          position: { distance: 0.90, offset: -10 }
        }
      ];

      link.labels(labels);
    } catch (err) {
      console.warn('setLinkMultiplicity error', err);
    }
  }

    /**
   * Convenience: read multiplicity value stored on link ('' if unspecified)
   */
  private getLinkMultiplicity(link: joint.dia.Link, side: 'source' | 'target'): string {
    const uml = (link as any).get('uml') || {};
    return side === 'source' ? (uml.sourceMultiplicity || '') : (uml.targetMultiplicity || '');
  }

  private hideLinkButton() {
    if (this.linkBtn && this.linkBtn.parentNode) {
      this.linkBtn.parentNode.removeChild(this.linkBtn);
      this.linkBtn = null;
    }
  }

  private updateFloatingElementsPosition() {
    // Atualiza posição do botão de remover
    if (this.removeBtn && this.currentCellView) {
      if(this.currentCellView.model.isLink()) {
        // Se for um link, posiciona o botão no meio do link
        const bbox = this.currentCellView.getBBox();
        const point = this.paper!.localToClientPoint({ x: bbox.x + bbox.width / 2, y: (bbox.y + 8) + bbox.height / 2 });
        this.removeBtn.style.left = `${point.x + window.scrollX}px`;
        this.removeBtn.style.top = `${point.y + window.scrollY}px`;
      } else {
        const bbox = this.currentCellView.getBBox();
        const point = this.paper!.localToClientPoint({ x: bbox.x - 28, y: bbox.y }); // Exemplo: botão à esquerda
        this.removeBtn.style.left = `${point.x + window.scrollX}px`;
        this.removeBtn.style.top = `${point.y + window.scrollY}px`;
      }
    }

    // Atualiza posição do inline-editor
    if (this.currentInlineEditor && this.currentEditingCellView) {
      const labelNode = this.currentEditingCellView.el.querySelector('text') as SVGTextElement;
      if (labelNode) {
        const labelRect = labelNode.getBoundingClientRect();
        this.currentInlineEditor.style.left = `${labelRect.left + window.scrollX}px`;
        this.currentInlineEditor.style.top = `${labelRect.top + window.scrollY}px`;
      }
    }

    // Atualiza posição do botão de linkar
    if (this.linkBtn && this.currentCellView) {
      const bbox = this.currentCellView.getBBox();
      const point = this.paper!.localToClientPoint({ x: bbox.x + bbox.width, y: bbox.y + 32 });
      this.linkBtn.style.left = `${point.x + window.scrollX}px`;
      this.linkBtn.style.top = `${point.y + window.scrollY}px`;
    }


    if (this.multiplicityBtns && this.multiplicityBtns.length && this.currentMultiplicityLink && this.paper) {
      try {
        const link = this.currentMultiplicityLink;

        // Preferir os pontos reais de conexão do link (cobre vertical/diagonal/camada de vértices)
        let srcLocalPoint: { x: number; y: number } | null = null;
        let tgtLocalPoint: { x: number; y: number } | null = null;

        // joint.dia.Link possui getSourcePoint/getTargetPoint que retornam pontos no sistema do paper
        if (typeof (link as any).getSourcePoint === 'function' && typeof (link as any).getTargetPoint === 'function') {
          try {
            srcLocalPoint = (link as any).getSourcePoint();
            tgtLocalPoint = (link as any).getTargetPoint();
          } catch (e) {
            srcLocalPoint = null;
            tgtLocalPoint = null;
          }
        }

        if (srcLocalPoint && tgtLocalPoint) {
          // obtém elementos conectados para ler suas alturas (paper coords)
          const srcElem = link.getSourceElement ? link.getSourceElement() : null;
          const tgtElem = link.getTargetElement ? link.getTargetElement() : null;
          const srcView = srcElem && this.paper ? (this.paper as any).findViewByModel(srcElem) : null;
          const tgtView = tgtElem && this.paper ? (this.paper as any).findViewByModel(tgtElem) : null;

          // ajusta a coordenada Y adicionando metade da altura do elemento (se disponível)
          let adjSrcLocal = { ...srcLocalPoint };
          let adjTgtLocal = { ...tgtLocalPoint };

          if (srcView && typeof srcView.getBBox === 'function') {
            try {
              const bboxSrc = srcView.getBBox();
              adjSrcLocal.y = adjSrcLocal.y + (bboxSrc.height / 2);
            } catch (e) { /* fallback: mantém srcLocalPoint */ }
          }

          if (tgtView && typeof tgtView.getBBox === 'function') {
            try {
              const bboxTgt = tgtView.getBBox();
              adjTgtLocal.y = adjTgtLocal.y + (bboxTgt.height / 2);
            } catch (e) { /* fallback: mantém tgtLocalPoint */ }
          }

          // converte para client coords
          const startClient = this.paper!.localToClientPoint(adjSrcLocal);
          const endClient   = this.paper!.localToClientPoint(adjTgtLocal);

          const btnSrc = this.multiplicityBtns[0];
          const btnTgt = this.multiplicityBtns[1];

          // centraliza os botões subtraindo metade da largura/altura do botão
          if (btnSrc) {
            const halfW = (btnSrc.offsetWidth || 24) / 2;
            const halfH = (btnSrc.offsetHeight || 24) / 2;
            btnSrc.style.left = `${startClient.x + window.scrollX - halfW}px`;
            btnSrc.style.top  = `${startClient.y + window.scrollY - halfH + 24}px`;
          }
          if (btnTgt) {
            const halfW = (btnTgt.offsetWidth || 24) / 2;
            const halfH = (btnTgt.offsetHeight || 24) / 2;
            btnTgt.style.left = `${endClient.x + window.scrollX - halfW}px`;
            btnTgt.style.top  = `${endClient.y + window.scrollY - halfH + 24}px`;
          }

          // manter removeBtn no meio do link (comportamento anterior)
          if (this.removeBtn && this.currentCellView && this.currentCellView.model.isLink()) {
            const bbox = this.currentCellView.getBBox();
            const mid = this.paper!.localToClientPoint({ x: bbox.x + bbox.width / 2, y: (bbox.y + 8) + bbox.height / 2 });
            this.removeBtn.style.left = `${mid.x + window.scrollX}px`;
            this.removeBtn.style.top = `${mid.y + window.scrollY}px`;
          }
        }
      } catch (err) {
        console.warn('Failed to reposition multiplicity buttons', err);
      }
    }

    if (this.currentMultiplicityPopup) {
      try {
        const popup = this.currentMultiplicityPopup;
        // prefere a âncora que abriu o popup; fallback para o primeiro multiplicity button
        const anchor = this.currentMultiplicityPopupAnchor || (this.multiplicityBtns && this.multiplicityBtns[0]) || null;
        if (anchor && typeof anchor.getBoundingClientRect === 'function') {
          const rect = anchor.getBoundingClientRect();
          popup.style.left = `${rect.left + window.scrollX + 20}px`;
          popup.style.top  = `${rect.top + window.scrollY - 8}px`;
        }
      } catch (err) {
        console.warn('Failed to reposition multiplicity popup', err);
      }
    }
  }

  /**
   * Position the inspector element so it stays fixed to the visible corner of the wrapper-board.
   */
  private updateInspectorPosition() {
    try {
      if (!this.inspectorRef || !this.inspectorRef.nativeElement) return;
      if (!this.wrapperBoard || !this.wrapperBoard.nativeElement) return;
      if (!this.inspectorVisible) return;

      const wrapperRect = this.wrapperBoard.nativeElement.getBoundingClientRect();
      const inspectorEl = this.inspectorRef.nativeElement as HTMLElement;

      inspectorEl.style.position = 'fixed';
      inspectorEl.style.zIndex = '8';

      const margin = 12;
      const inspectorWidth = inspectorEl.offsetWidth || 320;

      const top = Math.max(8, wrapperRect.top + margin);
      const left = wrapperRect.left + wrapperRect.width - inspectorWidth - margin;

      inspectorEl.style.top = `${top}px`;
      inspectorEl.style.left = `${Math.max(8, left)}px`;
    } catch (err) {
      // ignore
    }
  }

  /**
   * Position the clues element so it stays fixed to the visible corner (top-left)
   * of the wrapper-board. Works similarly to updateInspectorPosition.
   */
  private updateCluesPosition() {
    try {
      if (!this.clues || !this.clues.nativeElement) return;
      if (!this.wrapperBoard || !this.wrapperBoard.nativeElement) return;

      console.warn('Updating clues position');

      const wrapperRect = this.wrapperBoard.nativeElement.getBoundingClientRect();
      const cluesEl = this.clues.nativeElement as HTMLElement;

      cluesEl.style.position = 'fixed';
      cluesEl.style.zIndex = '8';

      const margin = 12;
      const cluesWidth = cluesEl.offsetWidth;

      const top = Math.max(8, wrapperRect.top + margin);
      const left = wrapperRect.left + wrapperRect.width - cluesWidth - margin;

      cluesEl.style.top = `${top}px`;
      cluesEl.style.left = `${left}px`;
    } catch (err) {
      // ignore positioning errors
    }
  }

  // Cálcula se o graph do usuário está correto
  calculateGraphAccuracy(): number {
    if (!this.graph || !this.correctsJSON.length) {
      this.accuracyCalculated.emit(0);
      return 0;
    }

    let bestAccuracy = 0;

    for (const correctJSON of this.correctsJSON) {
      const formattedCorrectJSON = JSON.parse(correctJSON);
      const graphJSONCorrect = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
      graphJSONCorrect.fromJSON(formattedCorrectJSON);

      const userElements = this.graph.getElements();
      const userLinks = this.graph.getLinks();
      const modelElements = graphJSONCorrect.getElements();
      const modelLinks = graphJSONCorrect.getLinks();

      let totalChecks = 0;   // denominador
      let correctChecks = 0; // numerador
      let globalPenaltyMultiplier = 1; // aplica 0.8 quando alguma classe nome diverge

      // helpers simples
      const normalize = (v: any) => {
        try {
          if (v === undefined || v === null) return '';
          return String(v)
            // separa caracteres base + diacríticos, remove diacríticos (acentos)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            // normaliza linhas; para cada linha remove espaços e pontuação no começo/fim (p.ex. '.' no final)
            .split('\n')
            .map(s => s.trim().replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''))
            .filter(s => s.length > 0)
            .join('\n')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        } catch {
          return '';
        }
      };

      const parseAttr = (line: string) => {
        const t = String(line || '').trim();
        const vis = (t.match(/^([+#\-~])\s*/) || [])[1] || '';
        const rest = vis ? t.replace(/^([+#\-~])\s*/, '').trim() : t;
        const parts = rest.split(':');
        return { visibility: vis, name: (parts[0] || '').trim(), type: (parts.slice(1).join(':') || '').trim() };
      };

      const parseOp = (line: string) => {
        const t = String(line || '').trim();
        const vis = (t.match(/^([+#\-~])\s*/) || [])[1] || '';
        const rest = vis ? t.replace(/^([+#\-~])\s*/, '').trim() : t;
        const parts = rest.split(':');
        return { visibility: vis, signature: (parts[0] || '').trim(), returnType: (parts.slice(1).join(':') || '').trim() };
      };

      // --- elementos (mantemos contagem de elementos como antes) ---
      totalChecks += modelElements.length;
      for (const modelElem of modelElements) {
        const modelType = typeof modelElem?.get === 'function' ? modelElem.get('type') : undefined;

        // label defensivo
        let modelLabelRaw = '';
        try { modelLabelRaw = modelElem.attr(['label','text']) || modelElem.attr('label/text') || modelElem.attr('title/text') || modelElem.attr(['title','text']) || ''; } catch {}
        const modelLabel = normalize(modelLabelRaw);

        // procura candidato do usuário (prefere mesmo tipo+mesmo nome se modelo especificou nome)
        let candidateUserElem: joint.dia.Element | undefined = userElements.find(ue => {
          try {
            const ut = typeof ue?.get === 'function' ? ue.get('type') : undefined;
            if (ut !== modelType) return false;
            if (modelLabel) {
              const ulRaw = ue.attr ? (ue.attr(['label','text']) || ue.attr('label/text') || ue.attr('title/text') || ue.attr(['title','text']) || '') : '';
              return normalize(ulRaw) === modelLabel;
            }
            return true;
          } catch {
            return false;
          }
        });

        // fallback: primeiro elemento do mesmo tipo (se existir)
        if (!candidateUserElem) {
          candidateUserElem = userElements.find(ue => {
            try { return (typeof ue?.get === 'function' ? ue.get('type') : undefined) === modelType; } catch { return false; }
          });
        }

        // pontuação do elemento (nome/tipo): se modelo especificou nome, só soma quando nomes iguais
        if (candidateUserElem) {
          let userLabelRaw = '';
          try { userLabelRaw = candidateUserElem.attr(['label','text']) || candidateUserElem.attr('label/text') || candidateUserElem.attr('title/text') || candidateUserElem.attr(['title','text']) || ''; } catch {}
          const userLabel = normalize(userLabelRaw);
          if (!modelLabel || modelLabel === userLabel) {
            correctChecks += 1; // elemento correto (mesmo comportamento de antes)
          } else {
            // nome da classe divergiu -> aplica multiplicador global de 0.8 e NÃO executa attrs/ops/stereotype
            globalPenaltyMultiplier *= 0.8;
            // contagem dos membros do modelo será adicionada abaixo (para penalizar ausências)
          }
        } // else nenhum elemento do usuário correspondente -> element point = 0

        // --- se for classe, tratar atributos e operações ---
        if (modelType === 'custom.Class') {
          // ler membros do modelo
          let modelAttrsRaw = '';
          let modelOpsRaw = '';
          try { modelAttrsRaw = modelElem.attr('attrsText/text') || ''; } catch {}
          try { modelOpsRaw = modelElem.attr('opsText/text') || ''; } catch {}

          const modelAttrs = String(modelAttrsRaw).split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const modelOps = String(modelOpsRaw).split('\n').map(l => l.trim()).filter(l => l.length > 0);

          // adiciona ao denominador (cada membro conta 1)
          totalChecks += modelAttrs.length + modelOps.length;

          // Se modelo especificou nome E usuário não bate com modelo, pulamos as verificações de membros
          if (modelLabel) {
            // busca label do candidato (novamente) para decidir se pulamos
            let userLabelForCheck = '';
            if (candidateUserElem) {
              try { userLabelForCheck = candidateUserElem.attr(['label','text']) || candidateUserElem.attr('label/text') || candidateUserElem.attr('title/text') || candidateUserElem.attr(['title','text']) || ''; } catch {}
              userLabelForCheck = normalize(userLabelForCheck);
            }
            if (!candidateUserElem || userLabelForCheck !== modelLabel) {
              // nomes divergem -> membros do modelo já foram adicionados ao totalChecks, mas não avaliamos (são penalizados)
              continue;
            }
          }

          // se chegamos aqui: ou modelo NÃO especificou nome, ou especificou e nomes batem -> realizar scoring parcial por membro

          // preparar linhas do usuário (para comparação)
          let userAttrsRaw = '';
          let userOpsRaw = '';
          try { userAttrsRaw = candidateUserElem ? (candidateUserElem.attr('attrsText/text') || '') : ''; } catch {}
          try { userOpsRaw = candidateUserElem ? (candidateUserElem.attr('opsText/text') || '') : ''; } catch {}

          const userAttrs = String(userAttrsRaw).split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const userOps = String(userOpsRaw).split('\n').map(l => l.trim()).filter(l => l.length > 0);

          // Atributos: para cada atributo do modelo
          for (const ma of modelAttrs) {
            const m = parseAttr(ma);
            const mNameLower = (m.name || '').toLowerCase();
            if (!mNameLower) continue; // modelo malformado -> conta no denominador, mas soma 0
            // procura pelo nome no usuário
            const userLine = userAttrs.find(ua => (parseAttr(ua).name || '').toLowerCase() === mNameLower);
            if (!userLine) {
              // não encontrou pelo nome => 0 ponto para esse membro
              continue;
            }
            // nome encontrado: base = 1
            let score = 1;
            const u = parseAttr(userLine);

            // visibilidade incorreta -> -10% do membro
            if (m.visibility && u.visibility && m.visibility !== u.visibility) {
              score -= 0.10;
            }

            // tipo incorreto -> -25% do membro (se modelo especificou tipo)
            const mType = (m.type || '').toLowerCase();
            const uType = (u.type || '').toLowerCase();
            if (mType) {
              if (!uType || mType !== uType) {
                score -= 0.25;
              }
            }

            // clamp e somar
            score = Math.max(0, Math.min(1, score));
            correctChecks += score;
          }

          // Operações: mesma lógica (signature/name + visibility + returnType)
          for (const mo of modelOps) {
            const m = parseOp(mo);
            const mSigLower = (m.signature || '').toLowerCase();
            if (!mSigLower) continue;
            const userLine = userOps.find(uo => (parseOp(uo).signature || '').toLowerCase() === mSigLower);
            if (!userLine) continue;
            let score = 1;
            const u = parseOp(userLine);

            if (m.visibility && u.visibility && m.visibility !== u.visibility) {
              score -= 0.10;
            }

            const mRet = (m.returnType || '').toLowerCase();
            const uRet = (u.returnType || '').toLowerCase();
            if (mRet) {
              if (!uRet || mRet !== uRet) {
                score -= 0.25;
              }
            }

            score = Math.max(0, Math.min(1, score));
            correctChecks += score;
          }

          // Stereotype: só verificar se nomes de classe batem (se modelo especificou). Não soma pontos separados,
          // apenas aplica uma penalidade de 20% sobre a contribuição do elemento se estereótipo estiver errado.
          if (modelLabel && candidateUserElem) {
            let modelStereo = '';
            let userStereo = '';
            try { modelStereo = modelElem.attr('stereotype/text') || ''; } catch {}
            try { userStereo = candidateUserElem.attr('stereotype/text') || ''; } catch {}
            modelStereo = normalize(modelStereo);
            userStereo = normalize(userStereo);
            if (modelStereo && modelStereo !== userStereo) {
              // aplicar 20% de desconto sobre a contribuição do element (já contada como +1 acima)
              // subtrair 0.20 se o elemento já foi contado como correto
              // note: element ponto foi +1 se nomes bateram; então removemos 0.20
              correctChecks = Math.max(0, correctChecks - 0.20);
            }
          }
        } // fim custom.Class
      } // fim modelElements

      // penalizações por elementos extras/ausentes (mantive comportamento anterior)
      if (userElements.length > modelElements.length) {
        totalChecks += userElements.length - modelElements.length;
        correctChecks -= (userElements.length - modelElements.length);
      }
      if (modelElements.length > userElements.length) {
        totalChecks += modelElements.length - userElements.length;
      }

      // --- links (mantive verificação simples e defensiva) ---
      totalChecks += modelLinks.length;
      for (const modelLink of modelLinks) {
        // leitura defensiva das extremidades do modelo
        const modelSourceElem = (typeof modelLink.getSourceElement === 'function') ? modelLink.getSourceElement() : null;
        const modelTargetElem = (typeof modelLink.getTargetElement === 'function') ? modelLink.getTargetElement() : null;

        const modelSourceLabel = normalize(
          modelSourceElem ? (modelSourceElem.attr(['label', 'text']) || modelSourceElem.attr('title/text') || '') : ''
        );
        const modelTargetLabel = normalize(
          modelTargetElem ? (modelTargetElem.attr(['label', 'text']) || modelTargetElem.attr('title/text') || '') : ''
        );

        const modelLinkLabel = normalize(
          (typeof modelLink.label === 'function') ? (modelLink.label(0)?.attrs?.['text']?.text || '') : ''
        );

        // tipo do link do modelo (ex.: 'custom.Association', 'custom.Aggregation', etc.)
        const modelLinkType = (typeof modelLink.get === 'function') ? String(modelLink.get('type') || '') : '';
        const modelLinkTypeNorm = normalize(modelLinkType);

        // multiplicidades declaradas no modelo (pode ser undefined/'' se não declarado)
        const modelUml = (typeof modelLink.get === 'function') ? (modelLink.get('uml') || {}) : {};
        const modelSrcMult = String(modelUml?.sourceMultiplicity || '').trim();
        const modelTgtMult = String(modelUml?.targetMultiplicity || '').trim();

        const isAssociationModel = modelLinkTypeNorm.includes('association') || modelLinkTypeNorm === 'association';

        const match = userLinks.find(userLink => {
          try {
            const userSourceElem = (typeof userLink.getSourceElement === 'function') ? userLink.getSourceElement() : null;
            const userTargetElem = (typeof userLink.getTargetElement === 'function') ? userLink.getTargetElement() : null;
            if (!userSourceElem || !userTargetElem) return false;

            const userSourceLabel = normalize(
              userSourceElem.attr(['label', 'text']) || userSourceElem.attr('title/text') || ''
            );
            const userTargetLabel = normalize(
              userTargetElem.attr(['label', 'text']) || userTargetElem.attr('title/text') || ''
            );
            const userLinkLabel = normalize(
              (typeof userLink.label === 'function') ? (userLink.label(0)?.attrs?.['text']?.text || '') : ''
            );

            // tipo do link do usuário (defensivo)
            const userLinkType = (typeof userLink.get === 'function') ? String(userLink.get('type') || '') : '';
            const userLinkTypeNorm = normalize(userLinkType);

            // multiplicidades do usuário (defensivo)
            const userUml = (typeof userLink.get === 'function') ? (userLink.get('uml') || {}) : {};
            let userSrcMult = String(userUml?.sourceMultiplicity || '').trim();
            let userTgtMult = String(userUml?.targetMultiplicity || '').trim();

            // Verificação de sentido:
            // - Se o modelo for Association: aceitamos correspondência com direção invertida.
            // - Caso contrário: exigir que source->target do usuário siga source->target do modelo.
            let matchedDirection = false;
            let inverted = false;

            if (isAssociationModel) {
              // tenta match no sentido direto
              if ((modelSourceLabel === '' || userSourceLabel === modelSourceLabel) &&
                  (modelTargetLabel === '' || userTargetLabel === modelTargetLabel)) {
                matchedDirection = true;
                inverted = false;
              }
              // tenta match invertido (source<->target)
              if (!matchedDirection &&
                  (modelSourceLabel === '' || userTargetLabel === modelSourceLabel) &&
                  (modelTargetLabel === '' || userSourceLabel === modelTargetLabel)) {
                matchedDirection = true;
                inverted = true;
                // quando invertido, vamos trocar as multiplicidades para comparação abaixo
                const tmp = userSrcMult; userSrcMult = userTgtMult; userTgtMult = tmp;
              }
            } else {
              // exige direção (source->target)
              if ((modelSourceLabel === '' || userSourceLabel === modelSourceLabel) &&
                  (modelTargetLabel === '' || userTargetLabel === modelTargetLabel)) {
                matchedDirection = true;
                inverted = false;
              } else {
                return false;
              }
            }

            if (!matchedDirection) return false;

            // se o modelo especificou um rótulo no link, exigir igualdade também
            if (modelLinkLabel && userLinkLabel !== modelLinkLabel) return false;

            // se o modelo especificou um tipo, exigir correspondência de tipo
            if (modelLinkTypeNorm && userLinkTypeNorm !== modelLinkTypeNorm) return false;

            // multiplicidades: se o modelo declarou, exigir igualdade na respectiva extremidade
            if (modelSrcMult && userSrcMult !== modelSrcMult) return false;
            if (modelTgtMult && userTgtMult !== modelTgtMult) return false;

            return true;
          } catch (err) {
            return false;
          }
        });

        if (match) correctChecks++;
      }
      if (userLinks.length > modelLinks.length) {
        totalChecks += userLinks.length - modelLinks.length;
        correctChecks -= (userLinks.length - modelLinks.length);
      }
      if (modelLinks.length > userLinks.length) {
        totalChecks += modelLinks.length - userLinks.length;
      }

      correctChecks = Math.max(0, correctChecks);
      const accuracy = totalChecks > 0 ? (correctChecks / totalChecks) * 100 : 0;
      const finalAccuracy = Math.round(accuracy * globalPenaltyMultiplier);

      if (finalAccuracy > bestAccuracy) bestAccuracy = finalAccuracy;
    }

    this.accuracyCalculated.emit(bestAccuracy);
    return bestAccuracy;
  }

  checkUMLInconsistencies(): boolean {
    if (!this.graph) return false;

    this.inconsistencies = []; // Limpa as mensagens anteriores

    const elements = this.graph.getElements();
    const links = this.graph.getLinks();

    // Helpers
    const linesOf = (text?: string): string[] =>
      (text ? String(text) : '').split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const getElementLabel = (el: any): string => {
      return (el?.attr && (
        el.attr(['label', 'text']) ||
        el.attr('label/text') ||
        el.attr('title/text') ||
        el.attr(['title', 'text'])
      )) || '';
    };

    // Reset visual state: elementos e links
    elements.forEach(el => {
      const type = el.get('type');
      if (type === 'custom.Actor') {
        el.attr('body/stroke', 'none');
        el.attr('body/strokeWidth', 0);
      } else {
        el.attr('body/stroke', '#000');
        el.attr('body/strokeWidth', 2);
      }
    });
    links.forEach(link => {
      try {
        link.attr('line/stroke', '#000');
        link.attr('line/strokeWidth', 1);
      } catch (e) {
        // ignore
      }
    });

    // Collect class names to detect duplicates
    const classNameCounts: Record<string, number> = {};
    const classElements: any[] = [];

    // First pass: class-specific collection and generic element checks
    for (const el of elements) {
      const type = el.get('type');
      // collect class elements for later detailed checks
      if (type === 'custom.Class') {
        classElements.push(el);
        const name = String(el.attr('title/text') || '').trim();
        const key = name || `__ANON__:${el.id || el.cid}`;
        classNameCounts[key] = (classNameCounts[key] || 0) + 1;
      }
    }

    // Generic element checks (works for actors/use-cases and classes partially)
    elements.forEach(el => {
      let inconsistent = false;
      const type = el.get('type');
      const label = String(getElementLabel(el) || '').trim();
      const elName = label || String(type || '');

      // 1. Elemento sem título (general)
      if (!label || label === '') {
        inconsistent = true;
        this.inconsistencies.push(`O elemento "${type}" está sem título.`);
      }

      // 2. Elemento sem conexão (general) - verifica se está ligado em algum link
      const isConnected = links.some((link: any) =>
        link.getSourceElement && link.getTargetElement &&
        (link.getSourceElement() === el || link.getTargetElement() === el)
      );
      if (!isConnected) {
        inconsistent = true;
        this.inconsistencies.push(`O elemento "${elName}" não está conectado a nenhum outro elemento.`);
      }

      // Aplica borda vermelha se inconsistente (somente se for elemento com body)
      if (inconsistent) {
        try {
          el.attr('body/stroke', '#FF0000');
          el.attr('body/strokeWidth', 3);
        } catch (e) {
          // ignore
        }
      }
    });

    // Class-specific validations
    try {
      const validVisibility = new Set(['+', '-', '#', '~']);

      for (const cls of classElements) {
        const id = cls.id || cls.cid || '(sem-id)';
        const name = String(cls.attr('title/text') || '').trim();
        let classInconsistent = false;

        // 1) classe sem nome
        if (!name) {
          classInconsistent = true;
          this.inconsistencies.push(`Classe sem nome encontrada. Informe um nome para a classe.`);
        }

        // 2) atributos: extrai linhas de attrsText
        const attrsText = String(cls.attr('attrsText/text') || '');
        const attrLines = linesOf(attrsText);
        const attrNamesCount: Record<string, number> = {};

        attrLines.forEach((line, idx) => {
          const lineNo = idx + 1;
          // verifica visibilidade inicial (opcional)
          const visMatch = line.match(/^([+#\-~])\s*/);
          if (visMatch && !validVisibility.has(visMatch[1])) {
            classInconsistent = true;
            this.inconsistencies.push(`Visibilidade inválida no atributo (linha ${lineNo}) da classe "${name || id}": "${visMatch[1]}"`);
          }

          const withoutVis = line.replace(/^([+#\-~])\s*/, '').trim();
          const parts = withoutVis.split(':');
          const namePart = (parts[0] || '').trim();
          const typePart = (parts.slice(1).join(':') || '').trim();

          if (!namePart) {
            classInconsistent = true;
            this.inconsistencies.push(`Atributo sem nome na classe "${name || id}" (linha ${lineNo}).`);
          }

          if (!typePart) {
            classInconsistent = true;
            // usa namePart se houver, senão mostra a linha bruta
            const shown = namePart || withoutVis || '(linha vazia)';
            this.inconsistencies.push(`Atributo sem tipo na classe "${name || id}" - "${shown}" (linha ${lineNo}).`);
          }

          if (namePart) {
            attrNamesCount[namePart] = (attrNamesCount[namePart] || 0) + 1;
            if (attrNamesCount[namePart] > 1) {
              classInconsistent = true;
              this.inconsistencies.push(`Atributo duplicado "${namePart}" na classe "${name || id}".`);
            }
          }
        });

        // 3) operações: extrai linhas e valida
        const opsText = String(cls.attr('opsText/text') || '');
        const opLines = linesOf(opsText);
        const opSignaturesCount: Record<string, number> = {};

        opLines.forEach((line, idx) => {
          const lineNo = idx + 1;
          if (!line || line.trim() === '') {
            classInconsistent = true;
            this.inconsistencies.push(`Operação vazia na classe "${name || id}" (linha ${lineNo}).`);
            return;
          }

          const visMatch = line.match(/^([+#\-~])\s*/);
          if (visMatch && !validVisibility.has(visMatch[1])) {
            classInconsistent = true;
            this.inconsistencies.push(`Visibilidade inválida na operação (linha ${lineNo}) da classe "${name || id}": "${visMatch[1]}"`);
          }

          const withoutVis = line.replace(/^([+#\-~])\s*/, '').trim();
          const parts = withoutVis.split(':');
          const signature = (parts[0] || '').trim();
          const returnType = (parts.slice(1).join(':') || '').trim();

          if (!signature) {
            classInconsistent = true;
            this.inconsistencies.push(`Operação sem assinatura na classe "${name || id}" (linha ${lineNo}).`);
          }

          if (!returnType) {
            classInconsistent = true;
            const shownSig = signature || withoutVis || '(linha sem assinatura)';
            this.inconsistencies.push(`Operação sem tipo de retorno na classe "${name || id}" - "${shownSig}" (linha ${lineNo}).`);
          }

          if (signature) {
            opSignaturesCount[signature] = (opSignaturesCount[signature] || 0) + 1;
            if (opSignaturesCount[signature] > 1) {
              classInconsistent = true;
              this.inconsistencies.push(`Operação duplicada "${signature}" na classe "${name || id}".`);
            }
          }
        });

        // Marca a classe visualmente se tiver inconsistências específicas
        if (classInconsistent) {
          try {
            cls.attr('body/stroke', '#FF0000');
            cls.attr('body/strokeWidth', 3);
          } catch (e) {
            // ignore
          }
        }
      }

      // Detectar nomes de classe duplicados (exclui anonymous keys)
      for (const key of Object.keys(classNameCounts)) {
        if (!key.startsWith('__ANON__') && classNameCounts[key] > 1) {
          this.inconsistencies.push(`Nome de classe duplicado: "${key}" aparece ${classNameCounts[key]} vezes.`);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar inconsistências (classes):', err);
      this.inconsistencies.push('Erro ao verificar inconsistências do diagrama de classes (veja console para detalhes).');
    }

    // Link-specific validations
    try {
      for (const link of links) {
        let linkInconsistent = false;
        // Safely obtain label: prefer label(0).attrs.text.text if available, otherwise fallback to link.get('type'), else 'link'
        let label = 'link';
        try {
          const labelFromLabel = (typeof (link as any).label === 'function') ? ((link as any).label(0)?.attrs?.text?.text ?? '') : '';
          const labelFromGet = (typeof (link as any).get === 'function') ? String((link as any).get('type') ?? '') : '';
          label = labelFromLabel || labelFromGet || 'link';
        } catch (e) {
          label = 'link';
        }

        if (!link.getTargetElement || !link.getSourceElement) {
          // defensive: if functions missing, skip
          continue;
        }

        if (!link.getTargetElement()) {
          linkInconsistent = true;
          this.inconsistencies.push(`O link "${label}" não tem um destino definido.`);
        }
        if (!link.getSourceElement()) {
          linkInconsistent = true;
          this.inconsistencies.push(`O link "${label}" não tem uma origem definida.`);
        }

        // multiplicities stored in link UML metadata
        const uml = (link as any).get('uml') || {};
        const srcMult = uml.sourceMultiplicity;
        const tgtMult = uml.targetMultiplicity;
        const allowed = Array.isArray(this.multiplicityOptions) ? this.multiplicityOptions : ['1', '0..1', '0..*', '*', '1..*', 'Unspecified'];

        if (srcMult && !allowed.includes(srcMult)) {
          linkInconsistent = true;
          this.inconsistencies.push(`Link "${label}": multiplicidade de origem inválida: "${srcMult}".`);
        }
        if (tgtMult && !allowed.includes(tgtMult)) {
          linkInconsistent = true;
          this.inconsistencies.push(`Link "${label}": multiplicidade de destino inválida: "${tgtMult}".`);
        }

        if (linkInconsistent) {
          try {
            link.attr('line/stroke', '#FF0000');
            link.attr('line/strokeWidth', 3);
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error('Erro ao verificar inconsistências (links):', err);
      this.inconsistencies.push('Erro ao verificar inconsistências dos links (veja console para detalhes).');
    }

    // Resultado
    return this.inconsistencies.length > 0;
  }

  toggleTips() {
    this.tipsVisible = !this.tipsVisible;
    if (this.tipsVisible) {
      setTimeout(() => this.updateCluesPosition(), 0);
    }
  }

  // método para alternar
  public toggleDiagramType(): void {
    this.diagramType = this.diagramType === 'USE_CASE' ? 'CLASS' : 'USE_CASE';
    // cancelar operação ativa se houver
    this.clearActiveButton();
    this.isWaitingForClick = false;
    // opcional: desfazer estado de link em andamento etc.
  }

  ngOnDestroy(): void {
    // Cancel listeners we registered in ngAfterViewInit
    try {
      this.wrapperBoard?.nativeElement?.removeEventListener('scroll', this.boundUpdateInspectorPosition);
      this.wrapperBoard?.nativeElement?.removeEventListener('scroll', this.boundUpdateCluesPosition);
    } catch (e) {
      // ignore
    }
    try {
      window.removeEventListener('resize', this.boundUpdateInspectorPosition);
      window.removeEventListener('resize', this.boundUpdateCluesPosition);
    } catch (e) {
      // ignore
    }

    // ✅ Cancelar operações ativas antes de destruir
    this.cancelActiveOperation();
    
    if (this.paper) {
      this.paper.remove();
      this.paper = null;
    }
    if (this.graph) {
      this.graph.clear();
      this.graph = null;
    }
  }

  public clearDiagram() {
    if (this.isInitialized() && this.graph) {
      this.graph.clear();
      this.reinitialize();
    }
  }

  // ✅ Adicionar método público para obter JSON do diagrama atual
  public getCurrentDiagramJSON(): any {
    if (!this.graph) {
      return null;
    }
    
    try {
      return this.graph.toJSON();
    } catch (error) {
      console.error('Erro ao obter JSON do diagrama:', error);
      return null;
    }
  }

  // ✅ Método privado para configurar dados do diagrama
  private setupDiagramData(phase?: Phase, phaseUser?: PhaseUser): void {
    
    if(phase?.diagramInitial) {
      console.log('🔍 Configurando dados do diagrama com Phase:', phase);
      this.initialJSON = JSON.parse(phase.diagramInitial);
    } else if (phaseUser) {
      console.log('🔍 Configurando dados do diagrama com PhaseUser:', phaseUser.phase);

      if (phaseUser.userDiagram) {
        try {
          this.initialJSON = JSON.parse(phaseUser.userDiagram);
        } catch (error) {
          console.error('❌ Erro ao fazer parse do userDiagram:', error);
          this.initialJSON = phaseUser.phase?.diagramInitial;
        }
      } else if (!phaseUser?.userDiagram && phaseUser?.phase?.diagramInitial) {
        console.warn('⚠️ Nenhum diagrama do usuário encontrado, usando diagrama inicial da fase.');
        this.initialJSON = JSON.parse(phaseUser.phase?.diagramInitial);
      }
    } else {
      this.initialJSON = null;
      this.correctsJSON = [];
    }


    if(phaseUser) {
      this.correctsJSON = phaseUser.phase?.correctDiagrams || [];
    } else {
      this.correctsJSON = [];
    }
  }

  // ✅ Método público para verificar se está inicializado
  public isInitialized(): boolean {
    return !!(this.graph && this.paper);
  }

  // ✅ Método público para reinicializar se necessário
  public reinitialize(phase?: Phase): void {
    if(phase) {
      this.initializeJointJS(phase); // Inicializa novamente
    } else {
      this.initializeJointJS(); // Inicializa novamente
    }
  }

  // Abre o inspector para um elemento class
  private openInspector(element: joint.dia.Element) {
    this.selectedClassElement = element;
    this.inspectorVisible = true;
    this.inspectorTab = 'general';

    // popula dados
    const name = element.attr('title/text') || '';
    const stereotype = element.attr('stereotype/text') || '';

    const attrsRaw = (element.attr('attrsText/text') || '') as string;
    const opsRaw = (element.attr('opsText/text') || '') as string;

    // parse attributes: linhas "± name: type"
    const attributes = attrsRaw.split('\n').filter(l => l.trim().length).map(line => {
      const trimmed = line.trim();
      // detect visibility symbol
      const visSymbol = ['+','-','#','~'].includes(trimmed[0]) ? trimmed[0] : '';
      let rest = visSymbol ? trimmed.substring(1).trim() : trimmed;
      const parts = rest.split(':');
      const namePart = (parts[0] || '').trim();
      const typePart = (parts.slice(1).join(':') || '').trim();
      return {
        name: namePart,
        type: typePart,
        visibility: this.visibilityFromSymbol(visSymbol)
      };
    });

    // parse operations: linhas "± signature: return"
    const operations = opsRaw.split('\n').filter(l => l.trim().length).map(line => {
      const trimmed = line.trim();
      const visSymbol = ['+','-','#','~'].includes(trimmed[0]) ? trimmed[0] : '';
      let rest = visSymbol ? trimmed.substring(1).trim() : trimmed;
      // if has ": return" split, else everything is signature
      const parts = rest.split(':');
      const signature = (parts[0] || '').trim();
      const returnType = (parts.slice(1).join(':') || '').trim();
      return {
        signature,
        returnType,
        visibility: this.visibilityFromSymbol(visSymbol)
      };
    });

    this.inspectorData = {
      name: name.toString(),
      stereotype: stereotype.toString().replace(/^<<|>>$/g, ''),
      attributes: attributes,
      operations: operations
    };

    // position inspector after it becomes visible and DOM updates
    setTimeout(() => this.updateInspectorPosition(), 0);
  }

  // Fecha o inspector
  public closeInspector() {
    this.inspectorVisible = false;
    this.selectedClassElement = null;
  }

  // helpers de visibilidade
  private visibilityFromSymbol(sym: string) {
    switch (sym) {
      case '+': return 'public';
      case '-': return 'private';
      case '#': return 'protected';
      case '~': return 'package';
      default: return 'private';
    }
  }
  private symbolFromVisibility(vis: string) {
    switch (vis) {
      case 'public': return '+';
      case 'private': return '-';
      case 'protected': return '#';
      case 'package': return '~';
      default: return '-';
    }
  }

  // aplicar mudanças gerais (name/stereotype)
  public applyGeneral() {
    if (!this.selectedClassElement) return;
    this.selectedClassElement.attr('title/text', this.inspectorData.name || '');
    this.selectedClassElement.attr('stereotype/text', this.inspectorData.stereotype ? `<<${this.inspectorData.stereotype}>>` : '');
  }

  // aplicar attributes -> atualiza element.attrsText
  public applyAttributes() {
    if (!this.selectedClassElement) return;
    const lines = this.inspectorData.attributes.map(a => {
      const sym = this.symbolFromVisibility(a.visibility);
      const t = a.type ? `: ${a.type}` : '';
      return `${sym} ${a.name}${t}`.trim();
    });
    this.selectedClassElement.attr('attrsText/text', lines.join('\n'));
    // opcional: redimensiona áreas com base no conteúdo (se implementado)
    if ((this as any).adjustClassAreasToContent) {
      try { (this as any).adjustClassAreasToContent(this.selectedClassElement); } catch(e) {}
    }
  }

  // aplicar operations -> atualiza element.opsText
  public applyOperations() {
    if (!this.selectedClassElement) return;
    const lines = this.inspectorData.operations.map(op => {
      const sym = this.symbolFromVisibility(op.visibility);
      const rt = op.returnType ? `: ${op.returnType}` : '';
      return `${sym} ${op.signature}${rt}`.trim();
    });
    this.selectedClassElement.attr('opsText/text', lines.join('\n'));
    if ((this as any).adjustClassAreasToContent) {
      try { (this as any).adjustClassAreasToContent(this.selectedClassElement); } catch(e) {}
    }
  }

  /**
   * Ajusta a altura de uma área (attrsArea ou opsArea) e redimensiona a CustomClass inteira.
   * delta: positivo para aumentar, negativo para diminuir.
   * area: 'attrs' para attrsArea ou 'ops' para opsArea.
   */
  private adjustClassAreaHeight(el: joint.dia.Element, delta: number, area: 'attrs' | 'ops') {
    if (!el) return;

    const areaSelector = area === 'attrs' ? 'attrsArea' : 'opsArea';
    const otherSelector = area === 'attrs' ? 'opsArea' : 'attrsArea';

    const minAreaHeight = 32;   // mínimo por área
    const headerHeight = 40;    // altura fixa do header conforme defaults
    const widthDefault = 220;
    const totalMinHeightFallback = 104;

    // lê altura atual da área (fallback para 32)
    const rawCurrentArea = Number(el.attr(`${areaSelector}/height`));
    const currentArea = (isNaN(rawCurrentArea) || rawCurrentArea === 0) ? minAreaHeight : rawCurrentArea;

    const newAreaHeight = Math.max(minAreaHeight, currentArea + delta);
    el.attr(`${areaSelector}/height`, newAreaHeight);

    // lê a outra área para garantir um min total coerente
    const rawOther = Number(el.attr(`${otherSelector}/height`));
    const otherAreaHeight = (isNaN(rawOther) || rawOther === 0) ? minAreaHeight : rawOther;

    // calcula novo tamanho total esperado: atual + delta
    const sizeProp = (el as any).size ? (el as any).size() : el.get('size');
    const currentHeight = (sizeProp && sizeProp.height) ? sizeProp.height : totalMinHeightFallback;
    const desiredHeight = currentHeight + delta;

    // garante que a altura final ao menos comporte header + attrs + ops
    const minRequiredHeight = headerHeight + (area === 'attrs' ? newAreaHeight : otherAreaHeight) + (area === 'ops' ? newAreaHeight : otherAreaHeight);
    const finalHeight = Math.max(minRequiredHeight, desiredHeight, totalMinHeightFallback);

    const currentWidth = (sizeProp && sizeProp.width) ? sizeProp.width : widthDefault;
    try {
      (el as any).resize(currentWidth, finalHeight);
    } catch (err) {
      // fallback seguro: set size via attr se resize não estiver disponível
      try {
        el.set('size', { width: currentWidth, height: finalHeight });
      } catch (e) {
        console.warn('adjustClassAreaHeight: resize failed', e);
      }
    }
  }

  public addAttribute() {
    // adiciona um atributo default ao modelo do inspector
    this.inspectorData.attributes.push({ name: 'attribute', visibility: 'public', type: 'string' });
    this.applyAttributes();

    // Ajusta a altura visual da classe no paper (+16)
    const delta = 16;
    const el = this.selectedClassElement;
    if (el) {
      try {
        this.adjustClassAreaHeight(el, delta, 'attrs');
      } catch (err) {
        console.warn('Failed to adjust class height on addAttribute', err);
      }
    }
  }

  public removeAttribute(index: number) {
    if (index < 0 || index >= this.inspectorData.attributes.length) {
      return;
    }

    // remove do modelo do inspector
    this.inspectorData.attributes.splice(index, 1);
    this.applyAttributes();

    // Ajusta a altura visual da classe (-16)
    const delta = -16;
    const el = this.selectedClassElement;
    if (el) {
      try {
        this.adjustClassAreaHeight(el, delta, 'attrs');
      } catch (err) {
        console.warn('Failed to adjust class height on removeAttribute', err);
      }
    }
  }

  public addOperation() {
    // adiciona uma operação default ao modelo do inspector
    this.inspectorData.operations.push({ signature: 'operation()', visibility: 'public', returnType: 'void' });
    this.applyOperations();

    // Ajusta a altura visual da classe no paper (+16)
    const delta = 16;
    const el = this.selectedClassElement;
    if (el) {
      try {
        this.adjustClassAreaHeight(el, delta, 'ops');
      } catch (err) {
        console.warn('Failed to adjust class height on addOperation', err);
      }
    }
  }

  public removeOperation(index: number) {
    if (index < 0 || index >= this.inspectorData.operations.length) {
      return;
    }

    // remove do modelo do inspector
    this.inspectorData.operations.splice(index, 1);
    this.applyOperations();

    // Ajusta a altura visual da classe (-16)
    const delta = -16;
    const el = this.selectedClassElement;
    if (el) {
      try {
        this.adjustClassAreaHeight(el, delta, 'ops');
      } catch (err) {
        console.warn('Failed to adjust class height on removeOperation', err);
      }
    }
  }
}