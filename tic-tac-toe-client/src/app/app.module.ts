import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TicTacToeBoardComponent } from './tic-tac-toe-board/tic-tac-toe-board.component';
import { TicTacToeTileComponent } from './tic-tac-toe-tile/tic-tac-toe-tile.component';

@NgModule({
  declarations: [
    AppComponent,
    TicTacToeBoardComponent,
    TicTacToeTileComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
