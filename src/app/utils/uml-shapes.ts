import * as joint from '@joint/core';

export class CustomActor extends joint.shapes.standard.Rectangle {
  constructor(...args: any[]) {
    super(...args);
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
