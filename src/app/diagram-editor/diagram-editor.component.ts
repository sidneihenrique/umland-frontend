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
export class DiagramEditorComponent implements OnInit, AfterViewInit, OnDestroy, AfterViewInit {
  @ViewChild('speechSwiper', { static: false }) speechSwiperRef?: ElementRef;
  private paper: joint.dia.Paper | null = null;
  private graph: joint.dia.Graph | null = null;
  private zoomLevel: number = 1;
  private readonly zoomMin: number = 0.2;
  private readonly zoomMax: number = 3;
  private readonly zoomStep: number = 0.03;

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
    // setTimeout(() => {
    //   this.showTeacher = true;
    //   setTimeout(() => this.initTeacherSwiper(), 100); // Garante que o DOM já renderizou
    // }, 500);
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeJointJS();
    }
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

    const rect = new joint.shapes.standard.Rectangle();
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

    container.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });

    this.paper.on('element:pointerdblclick', (cellView: joint.dia.ElementView, evt: joint.dia.Event) => {
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

  private showInlineEditor(cellView: joint.dia.ElementView, evt: joint.dia.Event): void {
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
    if (this.teacherSwiper) {
      this.teacherSwiper.destroy(true, true);
      this.teacherSwiper = undefined;
    }
  }

}
