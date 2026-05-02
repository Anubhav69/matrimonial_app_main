import 'dotenv/config';
import express from 'express';
import { logRequest, errorHandler } from './middleware/requestLogger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import userProfileRoutes from './routes/userProfileRoutes.js';
import userPhotoRoutes from './routes/userPhotoRoutes.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { connectDB } from './models/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(logRequest);
app.use('/uploads', express.static('uploads'));

// Apply global rate limiter to all routes
app.use(globalRateLimiter);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Matrimonial App!' });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/profiles', userProfileRoutes);
app.use('/api/v1/photos', userPhotoRoutes);

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
