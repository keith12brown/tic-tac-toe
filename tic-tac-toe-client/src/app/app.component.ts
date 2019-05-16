import { Component, HostListener } from '@angular/core';
import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import { TicTacToeMessage as Message } from '../../projects/tic-tac-toe-lib/src/lib/tic-tac-toe-message';
import { Subject } from 'rxjs';
import { WebSocketService } from './websocket.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'tic-tac-toe';
}
