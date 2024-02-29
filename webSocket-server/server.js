const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = new Map();
let connectionCount = 0;
const clients = new Set();
let players = [];
let allPlayerGesture = [];
let playerIdCounter = 0; // 用于分配玩家ID

wss.on('connection', ws => {
  connectionCount++;
  clients.add(ws);

  // 分配玩家ID
  playerIdCounter++;
  ws.playerId = playerIdCounter;
  
  ws.on('message', message => {
    const data = JSON.parse(message);
    console.log(data);

    if (data.action === 'createRoom') {
      players.push({
        name: data.userName,
        id: players.length + 1,
        img: '../../assets/img/stone.png',
        gesture: ''
      });
      const roomId = Math.random().toString(36).substring(7);
      rooms.set(roomId, new Set());
      const roomClients = rooms.get(roomId);
      ws.roomId = roomId;
      rooms.get(roomId).roomName = data.roomName;
    
      // 分配玩家ID
      if (roomClients.size === 0) {
        ws.playerId = 1;
      }
    
      roomClients.add(ws);
    
      ws.send(JSON.stringify({ 
        action: 'roomCreated', 
        roomId, 
        roomName: data.roomName, 
        connections: roomClients.size, 
        allUser: getPlayersInRoom(roomId)
      }));
      updateConnectionsCount(
        roomId, 
        roomClients, 
        ws.roomName, 
        getPlayersInRoom(roomId)
      );
    }
    else if (data.action === 'joinRoom') {
      players.push({
        name: data.userName,
        id: players.length + 1,
        img: '../../assets/img/stone.png',
        gesture: ''
      });

      console.log(players, 'players');

      const roomId = data.roomId;
    
      if (rooms.has(roomId)) {
        const roomClients = rooms.get(roomId);
    
        // 分配玩家ID
        switch (roomClients.size) {
          case 0:
            ws.playerId = 1;
            break;
          case 1:
            ws.playerId = 2;
            break;
          case 2:
            ws.playerId = 3;
            break;
          case 3:
            ws.playerId = 4;
            break;
          case 4:
            ws.playerId = 5;
            break;
          case 5:
            ws.playerId = 6;
            break;
          default:
            break;
        }
    
        roomClients.add(ws);
        ws.roomId = roomId;
        ws.roomName = rooms.get(roomId).roomName;
    
        ws.send(JSON.stringify({ 
          action: 'roomJoined', 
          roomId, 
          roomName: ws.roomName, 
          connections: roomClients.size, 
          allUser: getPlayersInRoom(roomId)
        }));
    
        updateConnectionsCount(roomId, roomClients, ws.roomName, getPlayersInRoom(roomId));
      } else {
        ws.send(JSON.stringify({ action: 'roomNotFound', roomId }));
      }
    }    
    else if (
      data.action === 'paper' || 
      data.action === 'scissors' || 
      data.action === 'stone'
    ) {
      if (ws.roomId) {
        // console.log(1111);

        const roomClients = rooms.get(ws.roomId);
    
        if (roomClients) {
          // console.log(2222);

          ws.lastGesture = data.action;
          // if (allPlayerGesture.includes()) {
            
          // }
          // allPlayerGesture.push(data)
          allPlayerGesture.push(data); // 不變拳的情況下

          players.forEach(player => {
            if (player.id === data.playerId) {
              player.gesture = data.action;
            }
          });
  
          if (allPlayerGesture.length === players.length) {
            roomClients.forEach(client => {
              client.send(JSON.stringify({ 
                action: 'calculateResult', 
                allUser: players 
              }));
            });  
          }   
          //
          roomClients.forEach(client => {
            if (client !== ws) {
              client.send(JSON.stringify({ 
                action: 'display', 
                message: data.action, 
                playerId: ws.playerId 
              }));
            }
          });       
        }
      }
    } else if (data.action === 'finish'){
      if (ws.roomId) {
        const roomClients = rooms.get(ws.roomId);
        if ((roomClients.size ) === 2) {
          let result = calculateGameResult(roomClients);
          roomClients.forEach(client => {
            client.send(JSON.stringify({ action: 'result', result }));
          });
        }
      }
    } else if (data.action === 'result') {
      const roomId = ws.roomId;
      const roomClients = rooms.get(roomId);
      const result = calculateGameResult(roomClients);
    
      roomClients.forEach(client => {
        client.send(JSON.stringify({ 
          action: 'result', 
          result, 
          playerId: result 
        }));
      });
    } else if (data.action === 'again') {
      const roomClients = rooms.get(ws.roomId);
      allPlayerGesture = [];
      players = data.players;
      roomClients.forEach(client => {
        client.send(JSON.stringify({ 
          action: 'again',
          players
        }));
      });
      
    } else if (data.action === 'winner') {
      const roomClients = rooms.get(ws.roomId);
      roomClients.forEach(client => {
        client.send(JSON.stringify({ 
          action: 'winner', 
          winner: data.winner
        }));
      });
    }
    
    
  });

  ws.on('close', () => {
    clients.delete(ws);

    if (ws.roomId) {
      const roomClients = rooms.get(ws.roomId);
      if (roomClients) {
        roomClients.delete(ws);

        updateConnectionsCount(ws.roomId, roomClients);
      }
    }

    connectionCount--;
  });
});

function getPlayersInRoom(roomId) {
  if (rooms.has(roomId)) {
    const roomClients = rooms.get(roomId);
    const playersInRoom = players.filter(player => {
      return Array.from(roomClients).some(client => client.playerId === player.id);
    });
    return playersInRoom;
  }
  return [];
}

function calculateGameResult(roomClients) {
  if (roomClients.size !== 2) {
    return 'Invalid: Not enough players';
  }

  let players = Array.from(roomClients);

  const player1 = players[0];
  const player2 = players[1];

  const gesture1 = player1.lastGesture;
  const gesture2 = player2.lastGesture;
  let resultMessage = '';

  if (gesture1 === gesture2) {
    resultMessage = 'Draw';
  } else if (
    (gesture1 === 'paper' && gesture2 === 'stone') ||
    (gesture1 === 'stone' && gesture2 === 'scissors') ||
    (gesture1 === 'scissors' && gesture2 === 'paper')
  ) {
    resultMessage = `${player1.playerId} wins`;
  } else {
    resultMessage = `${player2.playerId} wins`;
  }

  // 发送结果消息，包括胜者的playerId
  roomClients.forEach(client => {
    client.send(JSON.stringify({ action: 'result', result: resultMessage, playerId: resultMessage }));
  });

  return resultMessage;
}

function updateConnectionsCount(roomId, roomClients, roomName, allUser) {
  if (rooms.has(roomId)) {
    const connectionsCountInRoom = roomClients.size;
    const roomName = rooms.get(roomId).roomName;
    roomClients.forEach(client => {
      client.send(JSON.stringify({ 
        action: 'connectionsUpdated', 
        connections: connectionsCountInRoom, 
        roomId, 
        roomName, 
        allUser 
      }));
    });
  }
}

app.get('/gameResults', (req, res) => {
  res.json(gameResults);
});

app.get('/connections/:roomId', (req, res) => {
  const roomId = req.params.roomId;

  if (rooms.has(roomId)) {
    const connectionsCountInRoom = rooms.get(roomId).playerId ;
    res.json({ playerId: JSON.stringify(connectionsCountInRoom) });
  } else {
    res.json({ playerId: 'room not found' });
  }
});

server.listen(3000, () => {
  console.log('WebSocket server is listening on port 3000');
});
