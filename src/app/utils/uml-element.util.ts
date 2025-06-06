import { dia, shapes, util } from '@joint/core';

export class UMLElementUtil {
  static createElement(
    x: number,
    y: number,
    width: number,
    height: number,
    type: string,
    svg: string
  ): dia.Element {
    return new dia.Element({
      type,
      position: { x: x - width / 2, y: y - height / 2 },
      size: { width, height },
      markup: util.svg`
        <rect @selector="body" width="${width}" height="${height}" fill="transparent" stroke="none"/>
        <foreignObject @selector="fo" width="${width}" height="${height}">
          <body xmlns="http://www.w3.org/1999/xhtml">
            ${svg}
          </body>
        </foreignObject>
        <text @selector="label"/>
      `,
      attrs: {
        fo: {
          // O HTML já está embutido diretamente no markup
        },
        label: {
          ref: 'body',
          refX: '50%',
          refY: '115%', // posição vertical relativa, pode ajustar
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          text: type,
          fontSize: 16,
          fill: '#000'
        },
        root: {
          cursor: 'move'
        }
      }
    }) as dia.Element;
  }

  static createActor(x: number, y: number): dia.Element {
    const width = 48;
    const height = 86;
    const actorSVG = `
      <svg fill="none" viewBox="0 0 64 117" xmlns="http://www.w3.org/2000/svg">
        <path d="M31.7188 0.0078125C43.5876 0.308455 53.1172 10.0246 53.1172 21.9658L53.1094 22.5322C52.8243 33.7819 44.0807 42.9279 33.001 43.8516V57.667H62.001C63.1053 57.6673 64.001 58.5626 64.001 59.667C64.0007 60.7712 63.1052 61.6667 62.001 61.667H33.001V88.6182C33.4368 88.6877 33.8526 88.9004 34.1709 89.2539L55.6963 113.171L55.8252 113.33C56.4235 114.148 56.3173 115.302 55.5479 115.995C54.7782 116.688 53.619 116.673 52.8682 115.992L52.7236 115.847L31.5791 92.3525H30.7256L9.58105 115.847L9.43652 115.992C8.68573 116.673 7.52648 116.688 6.75684 115.995C5.98726 115.302 5.88017 114.148 6.47852 113.33L6.6084 113.171L28.1328 89.2539C28.3764 88.9833 28.6779 88.7963 29.001 88.6914V61.667H2.00098C0.89657 61.667 0.000263777 60.7713 0 59.667C0 58.5624 0.896407 57.667 2.00098 57.667H29.001V43.8242C18.0646 42.7612 9.47682 33.6795 9.19434 22.5322L9.1875 21.9658C9.1875 9.83506 19.0216 0 31.1523 0L31.7188 0.0078125ZM31.1523 4.00098C21.2307 4.00098 13.1875 12.0442 13.1875 21.9658C13.1878 31.8871 21.2309 39.9307 31.1523 39.9307C41.0736 39.9304 49.1168 31.887 49.1172 21.9658C49.1172 12.0443 41.0738 4.00119 31.1523 4.00098Z" fill="black"/>
      </svg>
    `;
    return this.createElement(x, y, width, height, 'custom.Actor', actorSVG);
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
        text: 'Use Case',
        fill: '#000',
        fontSize: 16,
      }
    });
    ellipse.set('type', 'custom.UseCase');
    return ellipse;
  }
}