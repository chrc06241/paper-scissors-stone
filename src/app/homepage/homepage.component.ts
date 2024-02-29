import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WebSocketService } from '../service/websocket.service';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {

  title: string = '';
  btnText: string = '';
  isInputNamePage: boolean = false;
  message: any;
  messages: string[] = [];
  roomCode: string = '';

  userName = new FormControl('', Validators.required);
  roomName = new FormControl('', Validators.required);

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private websocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    if (localStorage.getItem('userName')) {
      this.isInputNamePage = true;
    }
    
    this.websocketService.receive().subscribe((message) => {
      // console.log('Received WebSocket message:', message);
      this.messages.push(message);
    });
  }

  openModal(content: any, type: string) {
    if (type === 'create') {
      this.title = 'CREATE ROOM';
      this.btnText = 'CREATE';
    } else {
      this.title = 'JOIN ROOM';
      this.btnText = 'JOIN';
    }
    this.modalService.open(content);
	}

  returnToNameInputPage() {
    localStorage.clear();
    this.isInputNamePage = false;
  }

  enterTheOptionsPage() {
    if (this.userName.value) {
      localStorage.setItem('userName', this.userName.value);
      this.isInputNamePage = true;
    } else {
      alert('Please enter your name');
    }
  }

  enterTheRoom(e: any) {
    const modalContent = e.closest('.modal-content');
    const input = modalContent.querySelector('input');
  
    if (this.btnText === 'CREATE') {
      this.modalService.dismissAll();
      this.router.navigate(['/gameRoom']);
      this.websocketService.createRoom(
        this.roomName.value, 
        localStorage.getItem('userName')
      ).subscribe((response) => {
        // Handle the response, if needed
      });
    } else if (this.btnText === 'JOIN' && input.value) {
      this.modalService.dismissAll();
      this.router.navigate(['/gameRoom']);
      this.websocketService.joinRoom(
        input.value, 
        localStorage.getItem('userName')
      ).subscribe((response) => {
        // Handle the response, if needed
      });
    }
  }
  
}
