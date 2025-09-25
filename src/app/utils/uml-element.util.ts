import { dia, shapes, util } from '@joint/core';
import { CustomActor, CustomUseCase } from './uml-shapes';

export class UMLElementUtil {
  static createElement(
    x: number,
    y: number,
    width: number,
    height: number,
    type: string,
    markup: string,
    attrs: dia.Element.Attributes = {}
  ): dia.Element {
    return new dia.Element({
      type,
      position: { x: x - width / 2, y: y - height / 2 },
      size: { width, height },
      markup,
      attrs
    });
  }

  // static createActor(x: number, y: number): dia.Element {
  //   const width = 48;
  //   const height = 86;
  //   const actor = new shapes.standard.Rectangle();
  //   actor.position(x - width / 2, y - height / 2);
  //   actor.resize(width, height);
  //   actor.attr({
  //     body: {
  //       fill: 'transparent',
  //       stroke: 'none'
  //     },
  //     actor: {
  //       'xlink:href': 'assets/uml-svg/actor.svg',
  //       width,
  //       height,
  //       x: 0,
  //       y: 0
  //     },
  //     label: {
  //       text: 'Ator',
  //       fontSize: 16,
  //       fill: '#000',
  //       refY: '60%',
  //       textAnchor: 'middle',
  //       textVerticalAnchor: 'middle'
  //     }
  //   });
  //   // Adiciona o path do ator como um novo markup
  //   actor.markup = [
  //     { tagName: 'rect', selector: 'body' },
  //     { tagName: 'image', selector: 'actor' },
  //     { tagName: 'text', selector: 'label' }
  //   ];
  //   actor.set('type', 'custom.Actor');
  //   return actor;
  // }

  static createActor(x: number, y: number): dia.Element {
    const width = 48;
    const height = 86;
  
    
    // ✅ USAR: CustomActor diretamente
    const actor = new CustomActor();
    
    actor.position(x - width / 2, y - height / 2);
    actor.resize(width, height);
    
    // ✅ Personalizar texto se necessário
    actor.attr('label/text', 'Ator');
    
    return actor;
  }

  // static createUseCase(x: number, y: number): dia.Element {
  //   const width = 100;
  //   const height = 50;
  //   const ellipse = new shapes.standard.Ellipse();
  //   ellipse.position(x - width / 2, y - height / 2);
  //   ellipse.resize(width, height);
  //   ellipse.attr({
  //     body: {
  //       fill: '#FFF7D0',
  //       stroke: '#000',
  //       strokeWidth: 2,
  //     },
  //     label: {
  //       text: 'Caso de uso',
  //       fill: '#000',
  //       fontSize: 16,
  //       textWrap: {
  //         width: 200,      // limite de largura
  //         height: null,    // ou defina um limite de altura se quiser
  //         ellipsis: false, // ou true para adicionar "..." no final
  //         breakWord: true  // quebra palavras longas
  //       }
  //     }
  //   });
  //   ellipse.set('type', 'custom.UseCase');
  //   return ellipse;
  // }

  static createUseCase(x: number, y: number): dia.Element {
    const width = 100;
    const height = 50;
    
    // ✅ USAR: Classe importada
    const useCase = new CustomUseCase();
    useCase.position(x - width / 2, y - height / 2);
    useCase.resize(width, height);
    
    // ✅ Personalizar atributos
    useCase.attr({
      body: {
        fill: '#FFF7D0',
        stroke: '#000',
        strokeWidth: 2,
      },
      label: {
        text: 'Caso de uso',
        fill: '#000',
        fontSize: 16,
        textWrap: {
          width: 200,
          height: null,
          ellipsis: false,
          breakWord: true
        }
      }
    });
    
    return useCase;
  }

  static createLink(
    source: dia.Element,
    target: dia.Element,
    type: string
  ): dia.Link {
    const link = new shapes.standard.Link();
    link.source(source);
    link.target(target);


    // Personalização por tipo
    switch (type) {
      case 'extend':
        link.labels([{
          attrs: {
            text: { text: '<<extend>>', fontSize: 14, fill: '#000' },
            rect: { fill: '#fff', stroke: '#000', strokeWidth: 0 }
          },
          position: { distance: 0.5 }
        }]);
        link.attr('line/strokeDasharray', '5,5'); // linha tracejada
        link.set('type', 'custom.Extend');
        break;
      case 'include':
        link.labels([{
          attrs: {
            text: { text: '<<include>>', fontSize: 14, fill: '#000' },
            rect: { fill: '#fff', stroke: '#000', strokeWidth: 0 }
          },
          position: { distance: 0.5 }
        }]);
        link.attr('line/strokeDasharray', '2.2'); // linha contínua
        link.set('type', 'custom.Include');
        break;
      case 'dependency':
        link.labels([{
          position: { distance: 0.5 }
        }]);
        link.set('type', 'custom.Dependency');
        break;
      case 'association':
        link.labels([{
          attrs: {
            rect: { fill: '#fff', stroke: '#000', strokeWidth: 0 }
          },
          position: { distance: 0.5 }
        }]);
        link.attr('line/strokeDasharray', 'none'); // linha contínua
        link.attr('line/targetMarker', { d: '' }); // remove a seta
        link.set('type', 'custom.Association')
        break;
      default:
        break;
    }

    return link;
  }
}