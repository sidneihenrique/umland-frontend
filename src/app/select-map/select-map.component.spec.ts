import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectMapComponent } from './select-map.component';

describe('SelectMapComponent', () => {
  let component: SelectMapComponent;
  let fixture: ComponentFixture<SelectMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
