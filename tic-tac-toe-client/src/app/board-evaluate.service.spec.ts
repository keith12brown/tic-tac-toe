import { TestBed } from '@angular/core/testing';

import { BoardEvaluateService } from './board-evaluate.service';

describe('BoardEvaluateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BoardEvaluateService = TestBed.get(BoardEvaluateService);
    expect(service).toBeTruthy();
  });
});
