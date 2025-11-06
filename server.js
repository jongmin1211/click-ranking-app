const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO CORS 설정 (모든 도메인 허용)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let users = {}; // { username: { clicks: 0 } }

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('사용자 접속');

  socket.on('login', (username) => {
    if (!users[username]) {
      users[username] = { clicks: 0 };
    }
    socket.username = username;
    io.emit('updateRanking', getRanking());
  });

  socket.on('click', () => {
    if (socket.username && users[socket.username]) {
      users[socket.username].clicks++;
      io.emit('updateRanking', getRanking());
    }
  });

  socket.on('disconnect', () => {
    console.log('사용자 접속 종료');
  });
});

function getRanking() {
  return Object.entries(users)
    .map(([username, { clicks }]) => ({ username, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
}

// 중요: Render에서 자동 포트 할당 → process.env.PORT 사용
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버 실행 중: 포트 ${PORT}`);
});
