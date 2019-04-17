import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TicTacToeTileComponent } from './tic-tac-toe-tile.component';

describe('TicTacToeTileComponent', () => {
  let component: TicTacToeTileComponent;
  let fixture: ComponentFixture<TicTacToeTileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TicTacToeTileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TicTacToeTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
