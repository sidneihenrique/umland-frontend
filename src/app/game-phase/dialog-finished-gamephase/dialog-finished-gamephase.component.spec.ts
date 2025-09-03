import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogFinishedGamephaseComponent } from './dialog-finished-gamephase.component';

describe('DialogFinishedGamephaseComponent', () => {
  let component: DialogFinishedGamephaseComponent;
  let fixture: ComponentFixture<DialogFinishedGamephaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogFinishedGamephaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogFinishedGamephaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
