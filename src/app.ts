import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { seatService } from './domains/seat';
import swaggerDocument from './json/openapi.json';
import routes from './routes';
import { errorHandler } from './shared/middleware';

const app = express();

// SECURITY: Disable Express default error handler that leaks information
app.set('env', 'production'); // Force production mode to prevent stack trace leaks

// SECURITY: Disable X-Powered-By header (hides Express version)
app.disable('x-powered-by');

// SECURITY: Add security headers
app.use((_req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', routes);

// CRITICAL: Error handler MUST be registered AFTER all routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Background task to auto-release expired seat locks every 1 minute
  setInterval(async () => {
    try {
      const releasedCount = await seatService.autoReleaseLocks();
      if (releasedCount > 0) {
        console.log(`Auto-released ${releasedCount} expired seat locks`);
      }
    } catch (error) {
      console.error('Error in auto-release seat locks task:', error);
    }
  }, 60 * 1000);
});
