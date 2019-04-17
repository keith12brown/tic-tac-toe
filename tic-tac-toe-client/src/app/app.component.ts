import { Component, HostListener } from '@angular/core';
import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import { TicTacToeMessage as Message } from '../../projects/tic-tac-toe-message/src/lib/tic-tac-toe-message';
import { Subject } from 'rxjs';
import { WebSocketService } from './websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'tic-tac-toe';
  private count = 0;
  private socket$: WebSocketSubject<Message>;
  public serverMessages = new Array<Message>();
  public receivedMessage$ = new Subject();

  constructor(private socket: WebSocketService) {

  }

  sendMessage() {
    const message = new Message(`${this.count}`, 'me');
    this.serverMessages.push(message);
    this.socket$.next(message);
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload($event) {
    console.log('unloading');
    $event.returnValue = 'Are you sure';
  }

  @HostListener('window:unload', ['$event'])
  onUnload($event) {
    console.log('unloaded');
  }
}
