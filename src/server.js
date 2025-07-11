// backend/src/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http'); // Importa o módulo HTTP
const { Server } = require('socket.io'); // Importa o Server do socket.io

const { testConnection } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Importa as rotas
const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const configEmpresaRoutes = require('./routes/configEmpresaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const formaPagamentoRoutes = require('./routes/formaPagamentoRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const cardapioPublicRoutes = require('./routes/cardapioPublicRoutes');
const mesasRoutes = require('./routes/mesaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app); // Cria um servidor HTTP a partir do app Express
const io = new Server(server, { // Anexa o Socket.IO ao servidor HTTP
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

const port = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Importante para cookies/auth
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos da pasta 'public'.
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Middleware para injetar 'io' (socket.io) no objeto de requisição
app.use((req, res, next) => {
  req.io = io;
  next();
});


// Rotas (extractEmpresaId é aplicado dentro de cada arquivo de rota onde necessário)
app.get('/', (req, res) => {
  res.send('API do Sistema de Restaurantes está online!');
});

app.use('/api/v1', authRoutes);
app.use('/api/v1', empresaRoutes);
app.use('/api/v1', configEmpresaRoutes);
app.use('/api/v1', categoriaRoutes);
app.use('/api/v1', funcionarioRoutes);
app.use('/api/v1', formaPagamentoRoutes);
app.use('/api/v1', produtoRoutes);
app.use('/api/v1', pedidoRoutes);
app.use('/api/v1', cardapioPublicRoutes);
app.use('/api/v1', mesasRoutes);
app.use('/api/v1', dashboardRoutes);

app.use('/api/v1', testRoutes);

// Middleware de tratamento de erros (DEVE SER O ÚLTIMO MIDDLEWARE)
app.use(errorHandler);

// Eventos do Socket.IO (opcional, para logging de conexão)
io.on('connection', (socket) => {
  console.log(`Socket.IO: Cliente conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket.IO: Cliente desconectado: ${socket.id}`);
  });

  // Você pode ter eventos de 'join room' baseados em empresa_id aqui
  socket.on('join_company_room', (empresaId) => {
    socket.join(`company_${empresaId}`);
    console.log(`Socket.IO: Cliente ${socket.id} entrou na sala da empresa ${empresaId}`);
  });
});


// Inicia o servidor HTTP (NÃO MAIS app.listen)
server.listen(port, async () => { // <--- MUDEI PARA server.listen
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Acesse: http://localhost:${port}`);
  await testConnection();
});