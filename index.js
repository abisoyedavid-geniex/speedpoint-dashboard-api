const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const RateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerOptions = require('./swagger');

// Load environment variables from .env file
dotenv.config();

require('./config/notion');

const routes = require('./routes');
const { leadsRoutes, healthRoutes, ticketsRoutes } = routes;

const authenticate = require('./middleware/authentication');
const errorHandler = require('./middleware/errorHandler');

// Set up rate limiter: maximum of twenty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});

const app = express();
const PORT = process.env.PORT || 3000;
const host = '0.0.0.0';

const BASE_API_PATH = '/api/v1';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Speedpoint Dashboard API',
    status: 'running',
  });
});
app.use(
  `${BASE_API_PATH}/api-docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerJSDoc(swaggerOptions), {
    explorer: true,
  })
);
app.use(`${BASE_API_PATH}/health`, healthRoutes);
app.use(`${BASE_API_PATH}/leads`, authenticate, leadsRoutes);
app.use(`${BASE_API_PATH}/tickets`, authenticate, ticketsRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, host, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
