const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs'); // 파일 시스템 추가

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// === 파일에서 데이터 불러오기 ===
let users = {};
const DATA_FILE = 'users.json';
if (fs.existsSync(DATA_FILE)) {
  users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// === 데이터 저장 함수 (자동) ===
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// === 정적 파일 ===
app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

io.on('connection', (socket) => {
  console.log('사용자 접속');

  socket.on('login', (username) => {
    if (!users[username]) {
      users[username] = { clicks: 0 };
      saveData(); // 저장
    }
    socket.username = username;
    io.emit('updateRanking', getRanking());
  });

  socket.on('click', () => {
    if (socket.username && users[socket.username]) {
      users[socket.username].clicks++;
      saveData(); // 클릭할 때마다 저장
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버 실행 중: 포트 ${PORT}`);
});
