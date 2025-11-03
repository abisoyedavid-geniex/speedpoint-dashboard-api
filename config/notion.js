const { Client } = require("@notionhq/client");

// Initialize Notion client with API key from environment
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  // notionVersion: "2025-09-03",
});

module.exports = notion;
