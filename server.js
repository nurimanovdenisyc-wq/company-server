const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Временная база данных в памяти
let allVacancies = [
  { id: 1, company: 'ООО "Вектор"', desc: 'Ищем помощника в офис. Оплата 50/50.' },
  { id: 2, company: 'Кофейня "Утро"', desc: 'Требуется бариста. График 2/2.' }
];

// Список подключенных игроков
let onlinePlayers = {};

io.on('connection', (socket) => {
  console.log('Игрок подключился:', socket.id);

  // Отправляем текущие вакансии при входе
  socket.emit('init-vacancies', allVacancies);

  // Игрок добавляет новую вакансию
  socket.on('add-vacancy', (vacancy) => {
    const newVac = {
      id: Date.now(),
      company: vacancy.company,
      desc: vacancy.desc
    };
    allVacancies.unshift(newVac); // Добавляем в начало
    io.emit('new-vacancy', newVac); // Отправляем всем игрокам
  });

  // Игрок откликается на вакансию
  socket.on('apply-job', (job) => {
    // Просто уведомляем всех (в будущем тут можно сделать собеседование)
    io.emit('player-applied', { playerId: socket.id, job });
  });

  // Игрок присоединяется к игре (для мультиплеера до 4 человек)
  socket.on('join-game', (playerData) => {
    // Если игроков уже 4, отказываем
    if (Object.keys(onlinePlayers).length >= 4) {
      socket.emit('server-full');
      return;
    }
    
    onlinePlayers[socket.id] = { id: socket.id, ...playerData };
    
    // Отправляем текущему игроку список других игроков
    socket.emit('current-players', Object.values(onlinePlayers));
    
    // Всем остальным сообщаем о новом игроке
    socket.broadcast.emit('new-player', onlinePlayers[socket.id]);
  });

  socket.on('disconnect', () => {
    console.log('Игрок отключился:', socket.id);
    delete onlinePlayers[socket.id];
    io.emit('player-left', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
