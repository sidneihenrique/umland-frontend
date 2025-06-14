import { dia, shapes, util } from '@joint/core';

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

  static createActor(x: number, y: number): dia.Element {
    const width = 48;
    const height = 86;
    const actor = new shapes.standard.Rectangle();
    actor.position(x - width / 2, y - height / 2);
    actor.resize(width, height);
    actor.attr({
      body: {
        fill: 'transparent',
        stroke: 'none'
      },
      actor: {
        'xlink:href': 'assets/uml-svg/actor.svg',
        width,
        height,
        x: 0,
        y: 0
      },
      label: {
        text: 'Ator',
        fontSize: 16,
        fill: '#000',
        refY: '60%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle'
      }
    });
    // Adiciona o path do ator como um novo markup
    actor.markup = [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'image', selector: 'actor' },
      { tagName: 'text', selector: 'label' }
    ];
    actor.set('type', 'custom.Actor');
    return actor;
  }

  static createUseCase(x: number, y: number): dia.Element {
    const width = 100;
    const height = 50;
    const ellipse = new shapes.standard.Ellipse();
    ellipse.position(x - width / 2, y - height / 2);
    ellipse.resize(width, height);
    ellipse.attr({
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
          width: 200,      // limite de largura
          height: null,    // ou defina um limite de altura se quiser
          ellipsis: false, // ou true para adicionar "..." no final
          breakWord: true  // quebra palavras longas
        }
      }
    });
    ellipse.set('type', 'custom.UseCase');
    return ellipse;
  }
}