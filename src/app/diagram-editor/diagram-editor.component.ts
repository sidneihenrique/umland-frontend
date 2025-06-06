import { Component, ElementRef, OnInit, AfterViewInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { dia, shapes, util, elementTools, linkTools, connectors, layout } from '@joint/core'
import { UMLElementUtil } from '../utils/uml-element.util';

@Component({
  standalone: true,
  selector: 'diagram-editor',
  imports: [],
  templateUrl: './diagram-editor.component.html',
  styleUrl: './diagram-editor.component.css'
})
export class DiagramEditorComponent implements OnInit, AfterViewInit, OnDestroy {

  private paper: dia.Paper | null = null;
  private graph: dia.Graph | null = null;
  private zoomLevel: number = 1;
  private readonly zoomMin: number = 0.2;
  private readonly zoomMax: number =  3;
  private readonly zoomStep: number = 0.03;

  @ViewChild('paperContainer', { static: true }) paperContainer!: ElementRef;

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.graph = new dia.Graph();

    const container = this.paperContainer.nativeElement as HTMLElement;
    const width = 2000;
    const height = 2000;

    this.paper = new dia.Paper({
      el: this.paperContainer.nativeElement,
      model: this.graph,
      width: width,
      height: height,
      gridSize: 10,
      drawGrid: true,
      defaultLink: new shapes.standard.Link(),

    });

    const rect = new shapes.standard.Rectangle();
    rect.position(25, 100);
    rect.resize(100, 40);
    rect.attr({
      body: {
        fill: 'blue',
      },
      label: {
        text: 'Hello',
        fill: 'white',
      },
    });
    rect.addTo(this.graph);

    // Ativar zoom com o scroll do mouse
    container.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });

    // Aciona o editor inline ao dar duplo clique em um elemento
    this.paper.on('element:pointerdblclick', (cellView, evt) => {
      this.showInlineEditor(cellView, evt);
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

  private showInlineEditor(cellView: dia.CellView, evt: dia.Event): void {
    const element = cellView.model;
    const paper = cellView.paper;

    console.log('Element clicked:', element);

    // Verifica se o elemento e o paper estão definidos
    if (!element || !paper) return;

    // Remove editores anteriores, se houver
    const existingEditor = document.querySelector('.inline-editor');
    if (existingEditor) {
      existingEditor.remove();
    }

    // Posição absoluta do elemento clicado
    const bbox = cellView.getBBox();
    const paperRect = this.paperContainer.nativeElement.getBoundingClientRect();

    console.log('Bounding box:', bbox);
    console.log('Paper rect:', paperRect);

    const left = paperRect.left + bbox.x * this.zoomLevel;
    const top = paperRect.top + bbox.y * this.zoomLevel;

    // Cria o editor
    const inputDiv = document.createElement('div');
    inputDiv.className = 'inline-editor';
    inputDiv.contentEditable = 'true';
    inputDiv.style.position = 'absolute';
    inputDiv.style.left = `${left}px`;
    inputDiv.style.top = `${top}px`;

    // Texto atual do elemento
    const label = element.attr(['label', 'text']) || '';
    inputDiv.innerText = label;

    // Insere no body
    document.body.appendChild(inputDiv);

    // Foco automático
    inputDiv.focus();

    // Finalizar edição (Enter ou clicar fora)
    const finishEditing = () => {
      const newText = inputDiv.innerText.trim();
      element.attr(['label', 'text'], newText);
      inputDiv.remove();
    };

    inputDiv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditing();
      }
    });

    inputDiv.addEventListener('blur', finishEditing);
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
