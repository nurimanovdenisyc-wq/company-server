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

// СПИСОК ПУСТ. Никаких фейковых вакансий.
let allVacancies = [];

io.on('connection', (socket) => {
  console.log('Игрок подключился:', socket.id);
  
  // Отправляем игроку пустой список при входе
  socket.emit('init-vacancies', allVacancies);

  // Игрок создает вакансию — она добавляется в список
  socket.on('add-vacancy', (vacancy) => {
    const newVac = {
      id: Date.now(),
      company: vacancy.company,
      desc: vacancy.desc
    };
    allVacancies.unshift(newVac); // Добавляем в начало
    io.emit('new-vacancy', newVac); // Отправляем всем игрокам
  });

  socket.on('disconnect', () => {
    console.log('Игрок отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
