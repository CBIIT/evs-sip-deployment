import express from 'express';
import config from './routes/index.js';
import configureRoutes from './routes/express.js';

// Setup server
const app = express();

// Configure routes
await configureRoutes(app);

// Start server
app.listen(config.port, config.ip, function () {
  console.log('Server listening on %d, in %s mode', config.port, config.env);
});

// Expose app
export default app;