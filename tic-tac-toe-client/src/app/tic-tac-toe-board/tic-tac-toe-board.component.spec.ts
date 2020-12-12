import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TicTacToeBoardComponent } from './tic-tac-toe-board.component';

describe('TicTacToeBoardComponent', () => {
  let component: TicTacToeBoardComponent;
  let fixture: ComponentFixture<TicTacToeBoardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TicTacToeBoardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TicTacToeBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
