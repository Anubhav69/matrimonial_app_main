import 'dotenv/config';
import http from 'http';
import express from 'express';
import { logRequest, errorHandler } from './middleware/requestLogger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import userProfileRoutes from './routes/userProfileRoutes.js';
import userPhotoRoutes from './routes/userPhotoRoutes.js';
import userConnectionRoutes from './routes/userConnectionRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { connectDB } from './models/index.js';
import initSocket from './socket/socketHandler.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const dashboardOrigins = (process.env.ADMIN_DASHBOARD_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (requestOrigin && dashboardOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(requestOrigin && !dashboardOrigins.includes(requestOrigin) ? 403 : 204);
  }
  next();
});

app.use(express.json());
app.use(logRequest);
app.use('/uploads', express.static('uploads'));
app.use(globalRateLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Matrimonial App!' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/profiles', userProfileRoutes);
app.use('/api/v1/photos', userPhotoRoutes);
app.use('/api/v1/connections', userConnectionRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(errorHandler);

connectDB()
  .then(() => {
    initSocket(server);
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
