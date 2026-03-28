import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import categoryRoutes from './routes/categoryRoutes';
import serviceRoutes from './routes/serviceRoutes';
import officeRoutes from './routes/officeRoutes';
import bookmarkRoutes from './routes/bookmarkRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import adminRoutes from './routes/adminRoutes';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorMiddleware';

const app: Application = express();

// ── Security Middlewares ──────────────────────────────────
app.use(helmet());
app.use(cors());

// ── Body Parser ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Smart Government Service Navigator API is running',
    version: '1.0.0',
    endpoints: {
      auth:             '/api/v1/auth',
      users:            '/api/v1/users',
      categories:       '/api/v1/categories',
      services:         '/api/v1/services',
      offices:          '/api/v1/offices',
      bookmarks:        '/api/v1/bookmarks',
      feedbacks:        '/api/v1/feedbacks',
      admin:            '/api/v1/admin',
      // Segment 6
      recently_viewed:  '/api/v1/users/recently-viewed',
      related_services: '/api/v1/services/:id/related',
      eligibility:      '/api/v1/services/:id/eligibility-rules',
      dashboard_stats:  '/api/v1/admin/stats/dashboard',
      user_management:  '/api/v1/admin/users',
    },
  });
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/users',      userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/services',   serviceRoutes);
app.use('/api/v1/offices',    officeRoutes);
app.use('/api/v1/bookmarks',  bookmarkRoutes);
app.use('/api/v1/feedbacks',  feedbackRoutes);
app.use('/api/v1/admin',      adminRoutes);

// ── Error Handlers ────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT: number = parseInt(process.env.PORT || '5000', 10);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
});

export default app;
