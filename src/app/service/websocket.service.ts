import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$: WebSocketSubject<any>;
  private joinRoomSubject = new Subject<any>();
  private createRoomSubject = new Subject<any>();
  private connectionsSubject = new Subject<number>();
  // private roomIdSubject = new Subject<any>();

  constructor() {
    this.socket$ = webSocket('ws://localhost:3000');
    
    this.receive().subscribe((message) => {
      if (message.action === 'roomCreated' ||message.action === 'roomJoined' || message.action === 'connectionsUpdated') {
        this.connectionsSubject.next(message.connections);
        // this.roomIdSubject.next(message.roomId);
      }
    });
  }

  public send(message: any): void {
    this.socket$.next(message);
  }

  public receive(): Observable<any> {
    return this.socket$.asObservable();
  }

  public close(): void {
    this.socket$.complete();
  }

  public joinRoom(
    roomId: string, 
    userName: string | null
  ): Observable<any> {
    this.send({ 
      action: 'joinRoom', 
      roomId, 
      userName 
    });
    return this.joinRoomSubject.asObservable();
  }

  public createRoom(
    roomName: string | null, 
    userName: string | null
  ): Observable<any> {
    console.log(roomName, 'roomName');
    
    this.send({ 
      action: 'createRoom',
      roomName,
      userName
    });
    return this.createRoomSubject.asObservable();
  }

  public getConnectionsCount(): Observable<number> {
    return this.connectionsSubject.asObservable();
  }
}
