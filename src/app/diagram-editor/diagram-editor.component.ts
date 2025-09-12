import { Component, ElementRef, OnInit, AfterViewInit, OnDestroy, ViewChild, HostListener, PLATFORM_ID, Inject, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as joint from '@joint/core';
import { UMLElementUtil } from '../utils/uml-element.util';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { LucideIconsModule } from '../lucide-icons.module';
import { DataService } from '../../services/data.service';
import { CarouselComponent } from '../utils/carousel/carousel.component';
import { Phase } from '../../services/phase.service';

@Component({
  standalone: true,
  selector: 'diagram-editor',
  imports: [CommonModule, LucideIconsModule, CarouselComponent],
  templateUrl: './diagram-editor.component.html',
  styleUrl: './diagram-editor.component.css'
})
export class DiagramEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @Output() accuracyCalculated = new EventEmitter<number>();

  @Input() phase!: Phase | undefined;

  tipsVisible: boolean = false;
  
  private paper: joint.dia.Paper | null = null;
  private graph: joint.dia.Graph | null = null;
  private zoomLevel: number = 1;
  private readonly zoomMin: number = 0.2;
  private readonly zoomMax: number = 3;
  private readonly zoomStep: number = 0.03;


  private initialJSON: any;
  
  private correctsJSON: any[] = [];
  private graphJSONCorrect = new joint.dia.Graph();
  

  // Botão de remover elemento
  private removeBtn: HTMLButtonElement | null = null;
  private currentCellView: joint.dia.ElementView | joint.dia.LinkView | null = null;

  // Editor inline
  private currentInlineEditor: HTMLDivElement | null = null;
  private currentEditingCellView: joint.dia.ElementView | joint.dia.LinkView | null = null;

  // Botão de link
  private linkBtn: HTMLButtonElement | null = null;
  private linkingSource: joint.dia.Element | null = null;

  // Tipo de link que está sendo criado
  private linkingType: string | null = null;


  @ViewChild('paperContainer', { static: true }) paperContainer!: ElementRef;

  public inconsistencies: string[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: DataService
  ) {}
  ngOnInit(): void {
    this.initialJSON = this.phase?.diagramJSON;
    this.correctsJSON = this.phase?.correctDiagramsJson || [];
  }
  
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeJointJS();
    }
  }

  private initializeJointJS(): void {
    this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

    // Popula o graph com o modelo salvo em JSON caso a fase tenha um diagrama inicial
    if(this.initialJSON) {
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


    container.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });

    this.paperContainer.nativeElement.addEventListener('scroll', () => {
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
      console.log(JSON.stringify(this.graph?.toJSON()));
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
      if (!type || (type !== 'actor' && type !== 'usecase')) {
        console.error('Invalid UML element type:', type);
        return;
      }

      // Chama a função para adicionar o elemento
      this.addElement(type, event);
    }
  }

  addElement(type?: string, event?: MouseEvent) {
    // Verifica se o graph e o paper foram inicializados
    if (this.graph && this.paper) {
      const container = this.paperContainer.nativeElement as HTMLElement;

      // Se não recebeu o evento, adiciona um listener de click para capturar o próximo clique
      if(!event) {
        const clickHandler = (evt: MouseEvent) => {
          // Remove o listener após o clique para evitar múltiplas execuções
          container.removeEventListener('click', clickHandler);
          // Chama addElement novamente, agora com o evento
          this.addElement(type, evt);
        };
        container.addEventListener('click', clickHandler);
        
        // Muda o cursor para indicar que está aguardando o clique
        this.setCursor('crosshair');
        return
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
      }
    });


  }

  private showRemoveButton(cellView: joint.dia.ElementView | joint.dia.LinkView) {
    this.hideRemoveButton(); // Remove botão anterior, se existir
    this.currentCellView = cellView;

    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.style.position = 'absolute';
    btn.style.zIndex = '30';

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
  }

  addLink(type: string) {
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
  // Cálcula se o graph do usuário está correto
  calculateGraphAccuracy(): number {
    if (!this.graph || !this.correctsJSON.length) {
      this.accuracyCalculated.emit(0);
      return 0;
    }

    let bestAccuracy = 0;

    for (const correctJSON of this.correctsJSON) {
      const graphJSONCorrect = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
      graphJSONCorrect.fromJSON(correctJSON);

      // Obtenha elementos e links do usuário e do modelo
      const userElements = this.graph.getElements();
      const userLinks = this.graph.getLinks();
      const modelElements = graphJSONCorrect.getElements();
      const modelLinks = graphJSONCorrect.getLinks();

      let totalChecks = 0;
      let correctChecks = 0;

      // --- Verificação de elementos ---
      totalChecks += modelElements.length;
      for (const modelElem of modelElements) {
        const match = userElements.find(userElem =>
          userElem.get('type') === modelElem.get('type') &&
          (userElem.attr(['label', 'text']) || '') === (modelElem.attr(['label', 'text']) || '')
        );
        if (match) correctChecks++;
      }

      // Penaliza elementos extras do usuário
      if (userElements.length > modelElements.length) {
        totalChecks += userElements.length - modelElements.length;
        correctChecks -= (userElements.length - modelElements.length);
      }

      // Penaliza elementos ausentes do usuário
      if (modelElements.length > userElements.length) {
        totalChecks += modelElements.length - userElements.length;
      }

      // --- Verificação de links ---
      totalChecks += modelLinks.length;
      for (const modelLink of modelLinks) {
        const modelSource = modelLink.getSourceElement();
        const modelTarget = modelLink.getTargetElement();
        const modelLabel = modelLink.label(0)?.attrs?.['text']?.text || '';
        const match = userLinks.find(userLink => {
          const userSource = userLink.getSourceElement();
          const userTarget = userLink.getTargetElement();
          const userLabel = userLink.label(0)?.attrs?.['text']?.text || '';
          return (
            userLink.get('type') === modelLink.get('type') &&
            userSource && modelSource &&
            userTarget && modelTarget &&
            (userSource.attr(['label', 'text']) || '') === (modelSource.attr(['label', 'text']) || '') &&
            (userTarget.attr(['label', 'text']) || '') === (modelTarget.attr(['label', 'text']) || '') &&
            userLabel === modelLabel
          );
        });
        if (match) correctChecks++;
      }

      // Penaliza links extras do usuário
      if (userLinks.length > modelLinks.length) {
        totalChecks += userLinks.length - modelLinks.length;
        correctChecks -= (userLinks.length - modelLinks.length);
      }

      // Penaliza links ausentes do usuário
      if (modelLinks.length > userLinks.length) {
        totalChecks += modelLinks.length - userLinks.length;
      }

      // Garante que não fique negativo
      correctChecks = Math.max(0, correctChecks);

      // Calcula a porcentagem
      const accuracy = totalChecks > 0 ? (correctChecks / totalChecks) * 100 : 0;
      const finalAccuracy = Math.round(accuracy);

      // Guarda o melhor resultado
      if (finalAccuracy > bestAccuracy) {
        bestAccuracy = finalAccuracy;
      }
    }

    this.accuracyCalculated.emit(bestAccuracy);
    return bestAccuracy;
  }

  checkUMLInconsistencies() {
    if (!this.graph) return;

    this.inconsistencies = []; // Limpa as mensagens anteriores

    const elements = this.graph.getElements();
    const links = this.graph.getLinks();

    // Limpa bordas vermelhas
    elements.forEach(el => {
      if (el.get('type') === 'custom.Actor') {
        el.attr('body/stroke', 'none');
        el.attr('body/strokeWidth', 0);
      } else {
        el.attr('body/stroke', '#000');
        el.attr('body/strokeWidth', 2);
      }
    });

    // Verifica inconsistências
    elements.forEach(el => {
      let inconsistent = false;
      const label = el.attr(['label', 'text']);
      const elType = el.get('type');
      const elName = label || elType;

      // 1. Elemento sem título
      if (!label || label.trim() === '') {
        inconsistent = true;
        this.inconsistencies.push(`O elemento "${elType}" está sem título.`);
      }

      // 2. Elemento sem conexão
      const isConnected = links.some(link =>
        link.getSourceElement() === el || link.getTargetElement() === el
      );
      if (!isConnected) {
        inconsistent = true;
        this.inconsistencies.push(`O elemento "${elName}" não está conectado a nenhum outro elemento.`);
      }

      // 3. Link sem destino
      if (el.isLink() && !el.getTargetElement()) {
        inconsistent = true;
        this.inconsistencies.push(`O link "${elName}" não tem um destino definido.`);
      }

      // 4. Link sem origem
      if (el.isLink() && !el.getSourceElement()) {
        inconsistent = true;
        this.inconsistencies.push(`O link "${elName}" não tem uma origem definida.`);
      }

      // Aplica borda vermelha se inconsistente
      if (inconsistent) {
        el.attr('body/stroke', '#FF0000');
        el.attr('body/strokeWidth', 3);
      }
    });

    // Opcional: pode retornar a lista de inconsistências se quiser mostrar em tela
    // return elements.filter(el => el.attr('body/stroke') === '#FF0000');
  }

  toggleTips() {
    this.tipsVisible = !this.tipsVisible;
  }

  ngOnDestroy(): void {
    if (this.paper) {
      this.paper.remove();
      this.paper = null;
    }
    if (this.graph) {
      this.graph.clear();
      this.graph = null;
    }
  }

}
