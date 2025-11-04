const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.1.0",
    info: {
      title: "Speedpoint Dashboard API",
      version: "1.0.0",
      description: "API documentation using Swagger",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "http://speedpoint-dashboard-api.onrender.com",
        description: "Production server",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerOptions;
