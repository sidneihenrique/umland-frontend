import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeActivityComponent } from './node-activity.component';

describe('NodeActivityComponent', () => {
  let component: NodeActivityComponent;
  let fixture: ComponentFixture<NodeActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
