import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import tenantRoutes from './routes/tenantRoutes.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PATCH", "PUT", "DELETE"] }
});

app.use(express.json());

app.use((req, res, next) => {
  const startHrTime = process.hrtime();
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);
    console.log(`⏱️ [${req.method}] ${req.originalUrl} - Status: ${res.statusCode} - Latency: ${elapsedTimeInMs}ms`);
  });
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

connectDB();

app.use('/api/v1/tenants', tenantRoutes);
app.get('/api/v1/resource', rateLimiter, (req, res) => {
  res.status(200).json({ success: true, message: 'Authorized Gateway Session Cleared! Business metrics synced.' });
});

export let gatewayConfig = { freeLimit: 3, proLimit: 10 };

app.post('/api/v1/tenants/config', (req, res) => {
  const { freeLimit, proLimit } = req.body;
  if (freeLimit) gatewayConfig.freeLimit = parseInt(freeLimit);
  if (proLimit) gatewayConfig.proLimit = parseInt(proLimit);
  io.emit('gatewayConfigUpdate', gatewayConfig);
  return res.status(200).json({ success: true, config: gatewayConfig });
});

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
server.listen(PORT, () => console.log(`🚀 Premium Engine Cluster Listening on port: ${PORT}`));