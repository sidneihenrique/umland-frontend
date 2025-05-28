import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePhaseComponent } from './game-phase.component';

describe('GamePhaseComponent', () => {
  let component: GamePhaseComponent;
  let fixture: ComponentFixture<GamePhaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePhaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamePhaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
