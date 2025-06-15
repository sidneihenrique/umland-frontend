import { Component, ElementRef, OnInit, AfterViewInit, OnDestroy, ViewChild, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as joint from '@joint/core';
import { UMLElementUtil } from '../utils/uml-element.util';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { LucideIconsModule } from '../lucide-icons.module';

@Component({
  standalone: true,
  selector: 'diagram-editor',
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './diagram-editor.component.html',
  styleUrl: './diagram-editor.component.css'
})
export class DiagramEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('speechSwiper', { static: false }) speechSwiperRef?: ElementRef;
  private paper: joint.dia.Paper | null = null;
  private graph: joint.dia.Graph | null = null;
  private zoomLevel: number = 1;
  private readonly zoomMin: number = 0.2;
  private readonly zoomMax: number = 3;
  private readonly zoomStep: number = 0.03;

  // Botão de remover elemento
  private removeBtn: HTMLButtonElement | null = null;
  private currentCellView: joint.dia.ElementView | null = null;

  // Editor inline
  private currentInlineEditor: HTMLDivElement | null = null;
  private currentEditingCellView: joint.dia.ElementView | null = null;

  showTeacher = true;
  teacherDialogues = [
    'Olá! Bem-vindo ao jogo. Vou te ajudar a entender como funciona.',
    'Aqui você pode criar diagramas UML facilmente.',
    'Clique nos botões acima para acessar dicas rápidas!'
  ];
  private teacherSwiper?: Swiper;

  @ViewChild('paperContainer', { static: true }) paperContainer!: ElementRef;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.showTeacher = true;
      }, 500);
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeJointJS();
      
      // Inicializa o Swiper com um pequeno delay para garantir que o DOM esteja pronto
      setTimeout(() => {
        if (this.speechSwiperRef && !this.teacherSwiper) {
          this.teacherSwiper = new Swiper(this.speechSwiperRef.nativeElement, {
            navigation: {
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev'
            },
            slidesPerView: 1,
            allowTouchMove: false
          } as SwiperOptions);
        }
      }, 100);
    }
  }
  

  private initializeJointJS(): void {
    this.graph = new joint.dia.Graph();

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
      this.updateRemoveButtonPosition(this.currentCellView);
      this.updateInlineEditorPosition(this.currentEditingCellView);
    });

    // Configura o zoom do paper
    this.paper.on('element:pointerdblclick', (cellView: joint.dia.ElementView, evt: joint.dia.Event) => {
      this.showInlineEditor(cellView, evt);
    });

    // Adiciona o evento de clique para adicionar elementos
    this.paper.on('element:pointerclick', (cellView: joint.dia.ElementView, evt: joint.dia.Event) => {
      this.showRemoveButton(cellView);
    });

    // Esconde o botão de remover ao clicar fora do elemento
    this.paper.on('blank:pointerdown', () => {
      this.hideRemoveButton();
    });

    // Atualiza a posição do botão de remover ao mover o mouse sobre o elemento
    this.paper.on('element:pointermove', (cellView: joint.dia.ElementView) => {
      this.updateRemoveButtonPosition(cellView);
    });

    this.paper.on('element:pointermove', (cellView: joint.dia.ElementView) => {
      if (this.currentEditingCellView === cellView) {
        this.updateInlineEditorPosition(cellView);
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
    this.updateRemoveButtonPosition(this.currentCellView);
    this.updateInlineEditorPosition(this.currentEditingCellView);
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

  private showInlineEditor(cellView: joint.dia.ElementView, evt: joint.dia.Event): void {
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

    // Texto atual do elemento
    const label = element.attr(['label', 'text']) || '';
    inputDiv.innerText = label;

    // Insere no body
    document.body.appendChild(inputDiv);

    this.currentInlineEditor = inputDiv;
    this.currentEditingCellView = cellView;
    this.updateInlineEditorPosition(cellView);

    // Foco automático
    inputDiv.focus();


    // Finalizar edição (Enter ou clicar fora)
    const finishEditing = () => {
      const newText = inputDiv.innerText.trim();
      element.attr(['label', 'text'], newText);

      // Ajusta o tamanho do elemento conforme o tamanho do .inline-editor
      const editorRect = inputDiv.getBoundingClientRect();
      // Adicione um padding se desejar
      const paddingX = 32;
      const paddingY = 16;

      if(element.get('type') === 'custom.UseCase') {
        element.resize(editorRect.width + paddingX, editorRect.height + paddingY);
        this.updateRemoveButtonPosition(cellView);
      }

      inputDiv.removeEventListener('blur', finishEditing);
      paper.off('paper:pointerdown', finishEditing);
      inputDiv.remove();
    };

    inputDiv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditing();
      }
    });

    
    inputDiv.addEventListener('blur', finishEditing);
    paper.on('paper:pointerdown', finishEditing);

  }

  private showRemoveButton(cellView: joint.dia.ElementView) {
    this.hideRemoveButton(); // Remove botão anterior, se existir
    this.currentCellView = cellView;

    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.innerText = 'X';
    btn.style.position = 'absolute';
    btn.style.zIndex = '1000';

    btn.onclick = () => {
      // Remove o elemento do graph
      cellView.model.remove();
      this.hideRemoveButton();
    };

    document.body.appendChild(btn);
    this.removeBtn = btn;
    this.updateRemoveButtonPosition(cellView);
  }

  private updateRemoveButtonPosition(cellView: joint.dia.ElementView | null) {
    if (!this.removeBtn || !cellView) return;
    const bbox = cellView.getBBox();
    // Supondo que o botão tenha 28px de largura (ajuste se necessário)
    const buttonWidth = 20;
    const point = this.paper!.localToClientPoint({ x: bbox.x - buttonWidth, y: bbox.y });
    this.removeBtn.style.left = `${point.x + window.scrollX}px`;
    this.removeBtn.style.top = `${point.y + window.scrollY}px`;
  }

  private hideRemoveButton() {
    if (this.removeBtn && this.removeBtn.parentNode) {
      this.removeBtn.parentNode.removeChild(this.removeBtn);
      this.removeBtn = null;
      this.currentCellView = null;
    }
  }

  private updateInlineEditorPosition(cellView: joint.dia.ElementView | null) {
    if (!this.currentInlineEditor || !cellView) return;
    const labelNode = cellView.el.querySelector('text') as SVGTextElement;
    if (!labelNode) return;
    const labelRect = labelNode.getBoundingClientRect();
    this.currentInlineEditor.style.left = `${labelRect.left + window.scrollX}px`;
    this.currentInlineEditor.style.top = `${labelRect.top + window.scrollY}px`;
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
    if (this.teacherSwiper) {
      this.teacherSwiper.destroy(true, true);
      this.teacherSwiper = undefined;
    }
  }

}
