import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { WebSocketService } from '../service/websocket.service';
import { Player } from '../models/model';

@Component({
  selector: 'game-room',
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.scss']
})
export class GameRoomComponent implements OnInit {
  selectedGesture: string | null = null;

  isHost: boolean = true;
  isCreater: boolean = true;
  isOpen: boolean = false;
  isPlaying: boolean = false;
  whoIsWinner: string = '';
  message: any;
  messages: string[] = [];
  currentPlayerId: number = 1;
  roomName: string = '';

  players: Array<Player> = [];

  // TEST
  players1: Array<Player> = [
    {
      name: 'CCC',
      id: 1,
      img: '../../assets/img/stone.png',
      gesture: 'stone'
    },
    {
      name: 'BBB',
      id: 2,
      img: '../../assets/img/stone.png',
      gesture: 'scissors'
    },
    {
      name: 'GGG',
      id: 3,
      img: '../../assets/img/stone.png',
      gesture: 'stone'
    }
  ];
  // TEST

  angle: number = 360 / this.players?.length;

  @ViewChild("gameOver", {static:true}) gameOverModal!: ElementRef;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private websocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    // this.calculateResult(this.players);

    this.websocketService.receive().subscribe((message) => {
      console.log('Received WebSocket message:', message);

      if (
        message.action === 'roomCreated' || 
        message.action === 'roomJoined' || 
        message.action === 'connectionsUpdated'
      ) {
        this.message = message;
        this.players = message.allUser;
        this.angle = 360 / this.players?.length;

        if (!localStorage.getItem('userId')) {
          localStorage.setItem('userId', this.players[this.players?.length - 1].id.toString());
        }
        this.currentPlayerId = parseInt(localStorage.getItem('userId') || "0", 10);
        // console.log('Received connectionsUpdated message with roomName:', message.roomName);

        if (message.roomName){
          this.roomName = message.roomName;
        } else {
          this.roomName = 'qq';
        }
        
      } else if (message.action === 'display') {
        this.handleGesture(message.message);
      } else if (message.action === 'result') {
        this.handleGameResult(message.result);
      } else if (message.action === 'calculateResult') {
        this.calculateResult(message.allUser);
      } else if (message.action === 'again') {
        console.log('再猜一次');
        this.players = message.players;
        this.isPlaying = true;
      } else if (message.action === 'winner') {
        this.whoIsWinner = message.winner + ' is winner !'
        this.gameOver();
      }
  
      if (message.action === 'roomCreated') {
        this.isCreater = true;
      } else {
        this.isCreater = false;
      }
    });
  }  
  
  handleGameResult(result: string) {
    console.log('Game result:', result);
    this.whoIsWinner = result; // 设置 whoIsWinner 变量
    this.gameOver(); // 打开模态对话框
  }
    
  collapseSidebar() {
    this.isOpen = !this.isOpen;
  }

  gameStart() {
    this.isPlaying = true;
  }

  calculateResult(players: any) {
    console.log('傳進來的players : ', players);
    
    // 出完拳後檢查輸贏
    let result = this.checker(players);
    console.log('檢查後的結果 : ', result);
    
    // 把輸的人從players array剔除
    switch (result) {
      case 'r_win':
        this.players = this.players.filter(d => d.gesture === 'stone');
        // this.players[0].gesture = 'paper';
        break;
      case 'p_win':
        this.players = this.players.filter(d => d.gesture === 'paper');
        // this.players[0].gesture = 'scissors';
        break;
      case 's_win':
        this.players = this.players.filter(d => d.gesture === 'scissors');
        // this.players[0].gesture = 'stone';
        break;
      default:
        break;
    }
    console.log('過濾後的players : ', this.players);
    console.log('過濾後的players長度 : ', this.players.length);

    if (this.players.length > 1) {
      // console.log(this.players, 'again');
      
      // this.calculateResult(this.players);
      this.websocketService.send({ 
        action: 'again', 
        players: this.players
      });
    } else {
      this.websocketService.send({ 
        action: 'winner', 
        winner: this.players[0].name
      });
      // let winner = this.players[0].name;
      // this.whoIsWinner = winner + ' is winner !'
      // this.gameOver();
    }
  }

  gameOver() {
    this.isPlaying = false;
    this.modalService.open(this.gameOverModal);
  }

  selectGesture(gesture: string) {
    this.websocketService.send({ action: gesture, playerId: this.currentPlayerId });
  
    const playerIndex = this.players.findIndex(player => player.id === this.currentPlayerId);
    if (playerIndex !== -1) {
      this.players[playerIndex].gesture = gesture;
      this.updatePlayerImage(playerIndex, gesture);
    }
  }
  

  handleGesture(message: any) {
    const playerId = message.playerId;
    const gesture = message.action;

    const playerIndex = this.players.findIndex(player => player.id === playerId);
    if (playerIndex !== -1) {
      this.players[playerIndex].gesture = gesture;
      this.updatePlayerImage(playerIndex, gesture);
    }
  }

  updatePlayerImage(playerIndex: number, gesture: string) {
    switch (gesture) {
      case 'paper':
        this.players[playerIndex].img = '../../assets/img/paper.png';
        break;
      case 'scissors':
        this.players[playerIndex].img = '../../assets/img/scissors.png';
        break;
      case 'stone':
        this.players[playerIndex].img = '../../assets/img/stone.png';
        break;
      default:
        break;
    }
  }

  sendGestureResult() {
    if (this.selectedGesture) {
      const currentPlayerId = this.currentPlayerId;
      
      this.websocketService.send({ action: this.selectedGesture, playerId: currentPlayerId, isCreater: this.isCreater });
      console.log("Sending gesture result to the server:", this.selectedGesture);
    }
  }
  
  
  finishGame() {
    this.websocketService.send({ action: 'finish'});
  }
  
  

  checker(everyoneChoice: Array<any>) {
    // 先把重複的拳刪掉
    let nweChoiceArr: Array<string> = [];
    everyoneChoice.forEach(v => {
      if (!nweChoiceArr.includes(v.gesture)) {
        nweChoiceArr.push(v.gesture);
      }
    });
    // 檢查是否三種拳都有
    if (nweChoiceArr.length >= 3) {
      return 'draw'
    } else {
      // 只有兩種的話再檢查是哪一方贏
      let gesture = nweChoiceArr[0] + '_' + nweChoiceArr[1];
      switch (gesture) {
        // r=rock=stone, p=paper, s=scissors
        case 'stone_scissors':
        case 'scissors_stone':
          return 'r_win'

        case 'paper_stone':
        case 'stone_paper':
          return 'p_win'

        case 'scissors_paper':
        case 'paper_scissors':
          return 's_win'
      
        default:
          return 'draw'
      }
    }
  }
  
  updateConnectionsCount(newCount: number) {
    this.message.connections = newCount;
    this.websocketService.send({ action: 'updateConnections', roomId: this.message.roomId, connections: newCount });
  }
}
