import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import tenantRoutes from './routes/tenantRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'x-api-key', 'Cache-Control', 'Pragma']
  },
  transports: ['websocket', 'polling']
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'x-api-key', 'Cache-Control', 'Pragma'],
  credentials: true
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use((req, res, next) => {
  const startHrTime = process.hrtime();
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);
    console.log(`⏱️ [${req.method}] ${req.originalUrl} - Status: ${res.statusCode} - Latency: ${elapsedTimeInMs}ms`);
  });
  next();
});

export let gatewayConfig = { freeLimit: 3, proLimit: 10 };

// Master Route Mount Point
app.use('/api/v1/tenants', tenantRoutes);

let activeConnectionsCount = 0;

io.on('connection', (socket) => {
  activeConnectionsCount++;
  io.emit('activeConnections', activeConnectionsCount);
  socket.emit('gatewayConfigUpdate', gatewayConfig);

  socket.on('disconnect', () => {
    activeConnectionsCount = Math.max(0, activeConnectionsCount - 1);
    io.emit('activeConnections', activeConnectionsCount);
  });
});

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Gateway Node Master Operating Smoothly on Port: ${PORT}`);
    });
  } catch (err) {
    console.error('💥 Server initialization failed:', err);
    process.exit(1);
  }
};

startServer();