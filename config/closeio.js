const Closeio = require('close.io');

// Initialize Close CRM client with API key from environment
const closeio = new Closeio(process.env.CLOSE_API_KEY);

module.exports = closeio;
