import { dia, shapes, util } from '@joint/core';
import { CustomActor, CustomUseCase, CustomClass } from './uml-shapes';

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
        link.attr('line/strokeDasharray', '2.2'); 
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

      // ---------- Novos tipos UML ----------
      case 'aggregation':
        // agregação = losango aberto no lado do "todo" (aqui colocamos no target)
        link.attr('line/strokeDasharray', 'none');
        link.attr({
          line : {
            targetMarker: {
              'type': 'image',
              'xlink:href': '/assets/uml-svg/aggregation.png',
              'width': 24,
              'height': 24,
              'y': -12
            }
          }
        });
        link.labels([{
          attrs: {
            rect: { fill: '#fff', stroke: '#000', strokeWidth: 0 }
          },
          position: { distance: 0.5, offset: 12 }
        }]);
        link.set('type', 'custom.Aggregation');
        break;

      case 'composition':
        // composição = losango preenchido (aqui no target)
        link.attr('line/strokeDasharray', 'none');
        link.attr({
          line : {
            targetMarker: {
              'type': 'image',
              'xlink:href': '/assets/uml-svg/composition.png',
              'width': 24,
              'height': 24,
              'y': -12
            }
          }
        });
        link.labels([{
          attrs: {
            rect: { fill: '#fff', stroke: '#000', strokeWidth: 0 }
          },
          position: { distance: 0.5, offset: 12 }
        }]);
        link.set('type', 'custom.Composition');
        break;

      case 'inheritance':
      case 'generalization':
        // herança (generalization) = triângulo aberto (hollow) no target
        link.attr('line/strokeDasharray', 'none');
        link.labels([{
          attrs: {
            rect: { fill: '#fff', stroke: '#000', strokeWidth: 0 }
          },
          position: { distance: 0.5, offset: 12 }
        }]);
        link.set('type', 'custom.Generalization');
        break;

      case 'realization':
        // realização (interface) = linha tracejada + triângulo aberto
        link.attr('line/strokeDasharray', '5,5');
        link.labels([{
          attrs: {
            rect: { fill: '#fff', stroke: '#000', strokeWidth: 0 }
          },
          position: { distance: 0.5, offset: 12 }
        }]);
        link.set('type', 'custom.Realization');
        break;

      default:
        link.set('type', 'custom.Association');
        link.labels([{
          attrs: {
            rect: { fill: '#fff', stroke: '#000', strokeWidth: 0 }
          },
          position: { distance: 0.5, offset: 12 }
        }]);
        break;
    }

    return link;
  }

  static createClass(
    x: number,
    y: number,
    data?: { stereotype?: string; name?: string; attributes?: string[]; operations?: string[] },
    width = 220,
    height = 104
  ): dia.Element {
    const name = data?.name || 'ClassName';
    const stereotype = data?.stereotype || '';
    const attributes = (data?.attributes || []).join('\n');
    const operations = (data?.operations || []).join('\n');

    const cls = new CustomClass();
    cls.position(x - width / 2, y - height / 2);
    cls.resize(width, height);

    // set texts/attrs
    cls.attr('stereotype/text', stereotype ? `<<${stereotype}>>` : '');
    cls.attr('title/text', name);
    cls.attr('attrsText/text', attributes);
    cls.attr('opsText/text', operations);

    return cls;
  }
}