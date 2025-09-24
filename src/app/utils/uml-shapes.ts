import * as joint from '@joint/core';

export class CustomActor extends joint.shapes.standard.Rectangle {
  // ✅ CORRIGIR: Definir markup corretamente
  override markup = [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'image', selector: 'actor' },
    { tagName: 'text', selector: 'label' }
  ];

  // ✅ CORRIGIR: Definir defaults corretamente
  override defaults() {
    return {
      ...super.defaults,
      type: 'custom.Actor',
      attrs: {
        body: {
          fill: 'transparent',
          stroke: 'none'
        },
        actor: {
          'xlink:href': 'assets/uml-svg/actor.svg',
          width: 48,
          height: 86,
          x: 0,
          y: 0
        },
        label: {
          text: 'Ator',
          fontSize: 16,
          fill: '#000',
          refX: '50%',
          refY: '100%',
          textAnchor: 'middle',
          textVerticalAnchor: 'top'
        }
      }
    };
  }

  constructor(attributes?: any, options?: any) {
    super(attributes, options);
    this.set('type', 'custom.Actor');
  }
}

export class CustomUseCase extends joint.shapes.standard.Ellipse {
  constructor(...args: any[]) {
    super(...args);
    this.set('type', 'custom.UseCase');
  }
}

export class CustomExtend extends joint.shapes.standard.Link {
  constructor(...args: any[]) {
    super(...args);
    this.set('type', 'custom.Extend');
  }
}
export class CustomInclude extends joint.shapes.standard.Link {
  constructor(...args: any[]) {
    super(...args);
    this.set('type', 'custom.Include');
  }
}
export class CustomDependency extends joint.shapes.standard.Link {
  constructor(...args: any[]) {
    super(...args);
    this.set('type', 'custom.Dependency');
  }
}
export class CustomAssociation extends joint.shapes.standard.Link {
  constructor(...args: any[]) {
    super(...args);
    this.set('type', 'custom.Association');
  }
}

// Registre no namespace
(joint.shapes as any)['custom'] = (joint.shapes as any)['custom'] || {};
(joint.shapes as any)['custom'].Actor = CustomActor;
(joint.shapes as any)['custom'].UseCase = CustomUseCase;
(joint.shapes as any)['custom'].Extend = CustomExtend;
(joint.shapes as any)['custom'].Include = CustomInclude;
(joint.shapes as any)['custom'].Dependency = CustomDependency;
(joint.shapes as any)['custom'].Association = CustomAssociation;
