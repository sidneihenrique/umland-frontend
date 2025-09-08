import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Phase {
  id: number;
  title: string;
  description: string;
  diagramJSON?: any;
  correctDiagramsJson: any[];
  tips: string[];
  character: {
    name: string;
    filePath: string;
    dialogCharacter: string[];
  };
  // Adicione outros campos necessários para a fase
}

@Injectable({ providedIn: 'root' })
export class PhaseService {
  // Simulação de dados de fases
  private phases: Phase[] = [
    {
      id: 1,
      title: 'Gerenciamento de Biblioteca',
      description: 'Modelagem de casos de uso para biblioteca universitária.',
      diagramJSON: null, // coloque aqui o JSON do diagrama inicial da fase
      correctDiagramsJson: [
        {
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
                "x": 300,
                "y": 250
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
                "x": 190,
                "y": 340
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
                "x": 170,
                "y": 50
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
                "x": 70,
                "y": 640
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
                "x": 250,
                "y": 450
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
                "x": 220,
                "y": 550
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
                "x": 50,
                "y": 130
              },
              "size": {
                "width": 48,
                "height": 86
              },
              "angle": 0,
              "markup": [
                {
                  "tagName": "rect",
                  "selector": "body"
                },
                {
                  "tagName": "image",
                  "selector": "actor"
                },
                {
                  "tagName": "text",
                  "selector": "label"
                }
              ],
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
                "x": 50,
                "y": 390
              },
              "size": {
                "width": 48,
                "height": 86
              },
              "angle": 0,
              "markup": [
                {
                  "tagName": "rect",
                  "selector": "body"
                },
                {
                  "tagName": "image",
                  "selector": "actor"
                },
                {
                  "tagName": "text",
                  "selector": "label"
                }
              ],
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
                "x": 300,
                "y": 100
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
      ],
      tips: [
        'Use casos de uso para representar funcionalidades do sistema.',
        'Associe atores aos casos de uso corretamente.',
        'Inclua relacionamentos de dependência e inclusão.'
      ],
      character: {
        name: 'Professor',
        filePath: 'assets/characters/character_teacher_01.png',
        dialogCharacter: [
          'Bem-vindo à fase de Gerenciamento de Biblioteca!',
          'Aqui você irá modelar os principais casos de uso do sistema.',
          'Lembre-se de identificar corretamente os atores e suas interações.',
          'Se precisar de ajuda, consulte as dicas rápidas!'
        ]
      }
    },
    {
      id: 2,
      title: 'Cadastro de Alunos',
      description: 'Modelagem de cadastro e gerenciamento de alunos.',
      correctDiagramsJson: [
        {
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
                "x": 300,
                "y": 250
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
                "x": 190,
                "y": 340
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
                "x": 170,
                "y": 50
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
                "x": 70,
                "y": 640
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
                "x": 250,
                "y": 450
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
                "x": 220,
                "y": 550
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
                "x": 50,
                "y": 130
              },
              "size": {
                "width": 48,
                "height": 86
              },
              "angle": 0,
              "markup": [
                {
                  "tagName": "rect",
                  "selector": "body"
                },
                {
                  "tagName": "image",
                  "selector": "actor"
                },
                {
                  "tagName": "text",
                  "selector": "label"
                }
              ],
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
                "x": 50,
                "y": 390
              },
              "size": {
                "width": 48,
                "height": 86
              },
              "angle": 0,
              "markup": [
                {
                  "tagName": "rect",
                  "selector": "body"
                },
                {
                  "tagName": "image",
                  "selector": "actor"
                },
                {
                  "tagName": "text",
                  "selector": "label"
                }
              ],
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
                "x": 300,
                "y": 100
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
      ],
      diagramJSON: null,
      tips: [
        'Inclua validações nos campos obrigatórios.',
        'Represente associações entre aluno e curso.'
      ],
      character: {
        name: 'Maria',
        filePath: 'assets/characters/maria.png',
        dialogCharacter: [
          'Olá! Nesta fase, vamos trabalhar com o cadastro de alunos.',
          'Preste atenção nas validações dos campos obrigatórios.',
          'Não esqueça de associar os alunos aos cursos corretamente.',
          'Estou aqui para te ajudar durante o desafio!'
        ]
      }
    }
    // Adicione mais fases conforme necessário
  ];

  getPhaseById(id: number): Observable<Phase | undefined> {
    const phase = this.phases.find(p => p.id === id);
    return of(phase);
  }

  getAllPhases(): Observable<Phase[]> {
    return of(this.phases);
  }
}
