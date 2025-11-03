import * as joint from '@joint/core';

export class CustomActor extends joint.shapes.standard.Rectangle {
  override markup = [
    { tagName: 'rect', selector: 'body' },
    { tagName: 'image', selector: 'actor' },
    { tagName: 'text', selector: 'label' }
  ];

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

// ---------- Novas classes de link UML ----------
export class CustomAggregation extends joint.shapes.standard.Link {
  constructor(...args: any[]) {
    super(...args);
    this.set('type', 'custom.Aggregation');
  }
}

export class CustomComposition extends joint.shapes.standard.Link {
  constructor(...args: any[]) {
    super(...args);
    this.set('type', 'custom.Composition');
  }
}

export class CustomGeneralization extends joint.shapes.standard.Link {
  constructor(...args: any[]) {
    super(...args);
    this.set('type', 'custom.Generalization');
  }
}

export class CustomRealization extends joint.shapes.standard.Link {
  constructor(...args: any[]) {
    super(...args);
    this.set('type', 'custom.Realization');
  }
}
// ----------------------------------------------

export class CustomClass extends joint.shapes.standard.Rectangle {
  // markup com 3 retângulos (body/header/sections) e 3 textos
  override markup = [
    { tagName: 'rect', selector: 'body' },         // borda externa
    { tagName: 'rect', selector: 'header' },       // header area
    { tagName: 'rect', selector: 'attrsArea' },    // attributes area
    { tagName: 'rect', selector: 'opsArea' },      // operations area
    { tagName: 'text', selector: 'stereotype' },   // <<interface>> etc
    { tagName: 'text', selector: 'title' },        // class name
    { tagName: 'text', selector: 'attrsText' },    // attributes text
    { tagName: 'text', selector: 'opsText' }       // operations text
  ];

  override defaults() {
    return {
      ...super.defaults,
      type: 'custom.Class',
      size: { width: 220, height: 104 },
      attrs: {
        body: {
          refWidth: '100%',
          refHeight: '100%',
          stroke: '#000',
          strokeWidth: 0,
          fill: '#FFF7D0',
        },
        header: {
          refWidth: '100%',
          height: 40,
          fill: '#FFF7D0',
          stroke: '#000',
          strokeWidth: 2,
        },
        attrsArea: {
          refWidth: '100%',
          height: 32,
          refY: 40,
          fill: 'transparent',
          stroke: '#000',
          strokeWidth: 2,
        },
        opsArea: {
          ref: 'attrsArea',
          refWidth: '100%',
          height: 32,
          refY: '100%',
          fill: 'transparent',
          stroke: '#000',
          strokeWidth: 2,
        },
        stereotype: {
          text: '', // <<interface>> / <<enum>> / ''
          ref: 'header',
          refX: '50%',
          refY: '2%',
          refHeight: 0.5,
          textAnchor: 'middle',
          fontSize: 11,
          fill: '#666'
        },
        title: {
          text: 'ClassName',
          ref: 'header',
          refX: '50%',
          refY: '50%',
          refHeight: 0.5,
          textAnchor: 'middle',
          fontSize: 14,
          fontWeight: 700,
          fill: '#111'
        },
        attrsText: {
          text: '',
          ref: 'attrsArea',
          refX: 8,
          refY: '5%',
          textAnchor: 'start',
          fontSize: 12,
          fill: '#111',
        },
        opsText: {
          text: '',
          ref: 'opsArea',
          refX: 8,
          refY: '5%',
          textAnchor: 'start',
          fontSize: 12,
          fill: '#111',
        }
      }
    };
  }

  constructor(attributes?: any, options?: any) {
    super(attributes, options);
    this.set('type', 'custom.Class');
  }
}

// No final do arquivo, registre o novo tipo no namespace:
(joint.shapes as any)['custom'] = (joint.shapes as any)['custom'] || {};
(joint.shapes as any)['custom'].Actor = CustomActor;
(joint.shapes as any)['custom'].UseCase = CustomUseCase;
(joint.shapes as any)['custom'].Extend = CustomExtend;
(joint.shapes as any)['custom'].Include = CustomInclude;
(joint.shapes as any)['custom'].Dependency = CustomDependency;
(joint.shapes as any)['custom'].Association = CustomAssociation;

// Registrar novos tipos de link UML
(joint.shapes as any)['custom'].Aggregation = CustomAggregation;
(joint.shapes as any)['custom'].Composition = CustomComposition;
(joint.shapes as any)['custom'].Generalization = CustomGeneralization;
(joint.shapes as any)['custom'].Realization = CustomRealization;

(joint.shapes as any)['custom'].Class = CustomClass;
