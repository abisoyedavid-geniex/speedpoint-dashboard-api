const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

require("./config/notion");

const routes = require("./routes");
const { healthRoutes, ticketsRoutes } = routes;

const errorHandler = require("./middleware/errorHandler");

// Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;
const host = "0.0.0.0";

const BASE_API_PATH = "/api/v1";

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Speedpoint Dashboard API",
    status: "running",
  });
});
app.use(`${BASE_API_PATH}/health`, healthRoutes);
app.use(`${BASE_API_PATH}/tickets`, ticketsRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, host, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
