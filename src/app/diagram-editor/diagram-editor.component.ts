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
export class DiagramEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  private paper: joint.dia.Paper | null = null;
  private graph: joint.dia.Graph | null = null;
  private zoomLevel: number = 1;
  private readonly zoomMin: number = 0.2;
  private readonly zoomMax: number = 3;
  private readonly zoomStep: number = 0.03;

  private graphJSON: any = {
    "cells": [
      {
        "type": "custom.UseCase",
        "attrs": {
          "body": {
            "stroke": "#000",
            "fill": "#FFF7D0"
          },
          "label": {
            "fontSize": 16,
            "fill": "#000",
            "text": "Realizar empréstimo de livro",
            "textWrap": {
              "width": 200,
              "height": null,
              "ellipsis": false,
              "breakWord": true
            }
          }
        },
        "position": {
          "x": 310,
          "y": 1370
        },
        "size": {
          "width": 222.40000915527344,
          "height": 42.39999961853027
        },
        "angle": 0,
        "id": "3489d19a-2cf0-4b02-89fd-da1c045e4c5c",
        "z": 1
      },
      {
        "type": "custom.UseCase",
        "attrs": {
          "body": {
            "stroke": "#000",
            "fill": "#FFF7D0"
          },
          "label": {
            "fontSize": 16,
            "fill": "#000",
            "text": "Devolver livro",
            "textWrap": {
              "width": 200,
              "height": null,
              "ellipsis": false,
              "breakWord": true
            }
          }
        },
        "position": {
          "x": 170,
          "y": 1470
        },
        "size": {
          "width": 127.20000457763672,
          "height": 42.39999961853027
        },
        "angle": 0,
        "id": "6dc7171e-d3df-452e-8301-539d63d7ec7e",
        "z": 2
      },
      {
        "type": "custom.UseCase",
        "attrs": {
          "body": {
            "stroke": "#000",
            "fill": "#FFF7D0"
          },
          "label": {
            "fontSize": 16,
            "fill": "#000",
            "text": "Renovar empréstimo",
            "textWrap": {
              "width": 200,
              "height": null,
              "ellipsis": false,
              "breakWord": true
            }
          }
        },
        "position": {
          "x": 140,
          "y": 1250
        },
        "size": {
          "width": 175.1999969482422,
          "height": 42.39999961853027
        },
        "angle": 0,
        "id": "80a91b24-ed0e-408e-b50c-b82a816536df",
        "z": 3
      },
      {
        "type": "custom.UseCase",
        "attrs": {
          "body": {
            "stroke": "#000",
            "fill": "#FFF7D0"
          },
          "label": {
            "fontSize": 16,
            "fill": "#000",
            "text": "Cadastrar livro no sistema",
            "textWrap": {
              "width": 200,
              "height": null,
              "ellipsis": false,
              "breakWord": true
            }
          }
        },
        "position": {
          "x": 210,
          "y": 1790
        },
        "size": {
          "width": 211.1999969482422,
          "height": 42.39999961853027
        },
        "angle": 0,
        "id": "4dcd4992-80fd-4428-923f-d8e512a766a8",
        "z": 4
      },
      {
        "type": "custom.UseCase",
        "attrs": {
          "body": {
            "stroke": "#000",
            "fill": "#FFF7D0"
          },
          "label": {
            "fontSize": 16,
            "fill": "#000",
            "text": "Remover livro do catálogo",
            "textWrap": {
              "width": 200,
              "height": null,
              "ellipsis": false,
              "breakWord": true
            }
          }
        },
        "position": {
          "x": 260,
          "y": 1580
        },
        "size": {
          "width": 206.40000915527344,
          "height": 42.39999961853027
        },
        "angle": 0,
        "id": "4b134385-96ec-4812-959c-7f6704a1df50",
        "z": 5
      },
      {
        "type": "custom.UseCase",
        "attrs": {
          "body": {
            "stroke": "#000",
            "fill": "#FFF7D0"
          },
          "label": {
            "fontSize": 16,
            "fill": "#000",
            "text": "Gerar relatório de empréstimos",
            "textWrap": {
              "width": 200,
              "height": null,
              "ellipsis": false,
              "breakWord": true
            }
          }
        },
        "position": {
          "x": 250,
          "y": 1690
        },
        "size": {
          "width": 232,
          "height": 59.20000076293945
        },
        "angle": 0,
        "id": "1466696e-7313-4bcd-a978-77e29c2c29cc",
        "z": 6
      },
      {
        "type": "custom.Actor",
        "attrs": {
          "body": {
            "stroke": "none",
            "fill": "transparent"
          },
          "label": {
            "fontSize": 16,
            "fill": "#000",
            "text": "Aluno",
            "refY": "60%"
          },
          "actor": {
            "xlink:href": "assets/uml-svg/actor.svg",
            "width": 48,
            "height": 86,
            "x": 0,
            "y": 0
          }
        },
        "position": {
          "x": 80,
          "y": 1340
        },
        "size": {
          "width": 48,
          "height": 86
        },
        "angle": 0,
        "id": "343b44c5-6cd4-430e-b26c-f9d05ff0ca5e",
        "z": 7
      },
      {
        "type": "custom.Actor",
        "attrs": {
          "body": {
            "stroke": "none",
            "fill": "transparent"
          },
          "label": {
            "fontSize": 16,
            "fill": "#000",
            "text": "Bibliotecário",
            "refY": "60%"
          },
          "actor": {
            "xlink:href": "assets/uml-svg/actor.svg",
            "width": 48,
            "height": 86,
            "x": 0,
            "y": 0
          }
        },
        "position": {
          "x": 80,
          "y": 1590
        },
        "size": {
          "width": 48,
          "height": 86
        },
        "angle": 0,
        "id": "65d80ec9-8709-4b41-8f20-f5ba7baed944",
        "z": 8
      },
      {
        "type": "custom.UseCase",
        "attrs": {
          "body": {
            "stroke": "#000",
            "fill": "#FFF7D0"
          },
          "label": {
            "fontSize": 16,
            "fill": "#000",
            "text": "Consultar disponibilidade",
            "textWrap": {
              "width": 200,
              "height": null,
              "ellipsis": false,
              "breakWord": true
            }
          }
        },
        "position": {
          "x": 330,
          "y": 1260
        },
        "size": {
          "width": 204.8000030517578,
          "height": 42.39999961853027
        },
        "angle": 0,
        "id": "ef5fc98f-9996-4e89-914a-54407061981a",
        "z": 9
      },
      {
        "type": "custom.Association",
        "attrs": {
          "line": {
            "targetMarker": {
              "d": ""
            },
            "strokeDasharray": "none"
          }
        },
        "source": {
          "id": "343b44c5-6cd4-430e-b26c-f9d05ff0ca5e"
        },
        "target": {
          "id": "3489d19a-2cf0-4b02-89fd-da1c045e4c5c"
        },
        "id": "0cdc2b18-f681-4b69-88a5-08fcab504ac4",
        "labels": [
          {
            "attrs": {
              "rect": {
                "fill": "#fff",
                "stroke": "#000",
                "strokeWidth": 0
              }
            },
            "position": {
              "distance": 0.5
            }
          }
        ],
        "z": 10
      },
      {
        "type": "custom.Association",
        "attrs": {
          "line": {
            "targetMarker": {
              "d": ""
            },
            "strokeDasharray": "none"
          }
        },
        "source": {
          "id": "343b44c5-6cd4-430e-b26c-f9d05ff0ca5e"
        },
        "target": {
          "id": "6dc7171e-d3df-452e-8301-539d63d7ec7e"
        },
        "id": "a330c7ed-5ec9-407d-9e63-5a50417c2b1f",
        "labels": [
          {
            "attrs": {
              "rect": {
                "fill": "#fff",
                "stroke": "#000",
                "strokeWidth": 0
              }
            },
            "position": {
              "distance": 0.5
            }
          }
        ],
        "z": 11
      },
      {
        "type": "custom.Include",
        "attrs": {
          "line": {
            "strokeDasharray": "2.2"
          }
        },
        "source": {
          "id": "3489d19a-2cf0-4b02-89fd-da1c045e4c5c"
        },
        "target": {
          "id": "ef5fc98f-9996-4e89-914a-54407061981a"
        },
        "id": "09229805-e6cc-42fc-a108-c1bd2a4aa23b",
        "labels": [
          {
            "attrs": {
              "text": {
                "text": "<<include>>",
                "fontSize": 14,
                "fill": "#000"
              },
              "rect": {
                "fill": "#fff",
                "stroke": "#000",
                "strokeWidth": 0
              }
            },
            "position": {
              "distance": 0.5
            }
          }
        ],
        "z": 12
      },
      {
        "type": "custom.Association",
        "attrs": {
          "line": {
            "targetMarker": {
              "d": ""
            },
            "strokeDasharray": "none"
          }
        },
        "source": {
          "id": "65d80ec9-8709-4b41-8f20-f5ba7baed944"
        },
        "target": {
          "id": "4b134385-96ec-4812-959c-7f6704a1df50"
        },
        "id": "e6ceaf2e-4403-404f-b85d-3d7fb6221adb",
        "labels": [
          {
            "attrs": {
              "rect": {
                "fill": "#fff",
                "stroke": "#000",
                "strokeWidth": 0
              }
            },
            "position": {
              "distance": 0.5
            }
          }
        ],
        "z": 13
      },
      {
        "type": "custom.Association",
        "attrs": {
          "line": {
            "targetMarker": {
              "d": ""
            },
            "strokeDasharray": "none"
          }
        },
        "source": {
          "id": "65d80ec9-8709-4b41-8f20-f5ba7baed944"
        },
        "target": {
          "id": "1466696e-7313-4bcd-a978-77e29c2c29cc"
        },
        "id": "71820ffc-b642-457b-95e4-c2b01f88b54c",
        "labels": [
          {
            "attrs": {
              "rect": {
                "fill": "#fff",
                "stroke": "#000",
                "strokeWidth": 0
              }
            },
            "position": {
              "distance": 0.5
            }
          }
        ],
        "z": 14
      },
      {
        "type": "custom.Association",
        "attrs": {
          "line": {
            "targetMarker": {
              "d": ""
            },
            "strokeDasharray": "none"
          }
        },
        "source": {
          "id": "65d80ec9-8709-4b41-8f20-f5ba7baed944"
        },
        "target": {
          "id": "4dcd4992-80fd-4428-923f-d8e512a766a8"
        },
        "id": "fc305ccc-0020-47f9-ab34-a45c71328081",
        "labels": [
          {
            "attrs": {
              "rect": {
                "fill": "#fff",
                "stroke": "#000",
                "strokeWidth": 0
              }
            },
            "position": {
              "distance": 0.5
            }
          }
        ],
        "z": 15
      },
      {
        "type": "custom.Association",
        "attrs": {
          "line": {
            "targetMarker": {
              "d": ""
            },
            "strokeDasharray": "none"
          }
        },
        "source": {
          "id": "343b44c5-6cd4-430e-b26c-f9d05ff0ca5e"
        },
        "target": {
          "id": "80a91b24-ed0e-408e-b50c-b82a816536df"
        },
        "id": "c2f7ce1c-6980-41a4-a912-76e723c03be7",
        "labels": [
          {
            "attrs": {
              "rect": {
                "fill": "#fff",
                "stroke": "#000",
                "strokeWidth": 0
              }
            },
            "position": {
              "distance": 0.5
            }
          }
        ],
        "z": 16
      },
      {
        "type": "custom.Dependency",
        "attrs": {
          
        },
        "source": {
          "id": "65d80ec9-8709-4b41-8f20-f5ba7baed944"
        },
        "target": {
          "id": "343b44c5-6cd4-430e-b26c-f9d05ff0ca5e"
        },
        "id": "cdfed96e-21a8-4267-a652-1db2fc61cc9c",
        "labels": [
          {
            "position": {
              "distance": 0.5
            }
          }
        ],
        "z": 17
      }
    ]
  }
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

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}
  ngOnInit(): void {
    
  }
  
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeJointJS();
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
    this.graphJSONCorrect = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
    this.graphJSONCorrect.fromJSON(this.graphJSON);
    if (!this.graph || !this.graphJSONCorrect) return 0;

    // Obtenha elementos e links do usuário e do modelo
    const userElements = this.graph.getElements();
    const userLinks = this.graph.getLinks();
    const modelElements = this.graphJSONCorrect.getElements();
    const modelLinks = this.graphJSONCorrect.getLinks();

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
      // Não soma em correctChecks, pois já não foram encontrados
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
      // Não soma em correctChecks, pois já não foram encontrados
    }

    // Garante que não fique negativo
    correctChecks = Math.max(0, correctChecks);

    // Calcula a porcentagem
    const accuracy = totalChecks > 0 ? (correctChecks / totalChecks) * 100 : 0;
    return Math.round(accuracy);
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
