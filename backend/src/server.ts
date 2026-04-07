import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import authRoutes    from './routes/auth';
import optionsRoutes from './routes/options';
import ordersRoutes  from './routes/orders';

const app  = express();
const PORT = 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api/auth',    authRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/orders',  ordersRoutes);

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'TradeUp backend running', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

export function startServer(): void {
  app.listen(PORT, () => {
    logger.info(`Server on port ${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/health`);
  });
}

export function getApp(): express.Application {
  return app;
}