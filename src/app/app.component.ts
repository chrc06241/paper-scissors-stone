import { Component, HostListener, OnDestroy } from '@angular/core';
import { WebSocketService } from './service/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  
  constructor(
    private websocketService: WebSocketService
  ) { }

  // 關閉或重整頁面時會調用此function，但目前沒有找到方法區分關閉或重整
  @HostListener('window:beforeunload', ['$event'])
  ngOnDestroy(): void {
    localStorage.clear();
    this.websocketService.close();
  }
}
