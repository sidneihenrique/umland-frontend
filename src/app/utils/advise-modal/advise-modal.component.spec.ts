import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdviseModalComponent } from './advise-modal.component';

describe('AdviseModalComponent', () => {
  let component: AdviseModalComponent;
  let fixture: ComponentFixture<AdviseModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdviseModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdviseModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
