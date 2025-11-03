# Speedpoint Dashboard API

Lightweight Express API that queries a Notion data source and returns summarized ticket metrics.

## Quick start

1. Install dependencies

```sh
npm install
```

2. Copy and edit environment variables

```sh
cp .env.example .env
# then update NOTION_API_KEY and NOTION_DATA_SOURCE_ID in .env
```

3. Run

```sh
# development (auto-reload)
npm run dev

# production
npm start
```

## Environment

Required environment variables (see [.env.example](.env.example)):

- NOTION_API_KEY — Notion integration token (used in [config/notion.js](config/notion.js))
- NOTION_DATA_SOURCE_ID — Notion data source id used for queries
- PORT — server port (defaults to 3000)
- NODE_ENV — environment flag (development/production)

## Key files & symbols

- Main app: [index.js](index.js)
- Notion client: [`notion`](config/notion.js)
- Routes entry: [routes/index.js](routes/index.js) — exports [`routes.healthRoutes`](routes/index.js) and [`routes.ticketsRoutes`](routes/index.js)
- Tickets routes implementation: [routes/tickets.js](routes/tickets.js)
- Health route: [routes/health.js](routes/health.js)
- Request transformations: [`utils.transformations`](utils/transformations.js) (exports JSONata expressions like [`transformations.openSummary`](utils/transformations.js), [`transformations.averageAge`](utils/transformations.js), [`transformations.oldestOpen`](utils/transformations.js))
- Transformation helper: [`helpers.transformData`](utils/helpers.js) — applies JSONata to API responses
- Error middleware: [`errorHandler`](middleware/errorHandler.js)
- Example env: [.env.example](.env.example)
- Package metadata: [package.json](package.json)

## API Endpoints

Base path: /api/v1

- GET /api/v1/health — simple health check ([routes/health.js](routes/health.js))
- GET /api/v1/tickets/open-summary — totals & breakdown by type (implemented in [routes/tickets.js](routes/tickets.js); uses [`transformations.openSummary`](utils/transformations.js))
- GET /api/v1/tickets/average-age?status=Open — average ages per category (implemented in [routes/tickets.js](routes/tickets.js); uses [`transformations.averageAge`](utils/transformations.js))
- GET /api/v1/tickets/oldest-open?category=Bug&limit=5 — top oldest tickets for a category (implemented in [routes/tickets.js](routes/tickets.js); uses [`transformations.oldestOpen`](utils/transformations.js))

## How transformations work

The app uses JSONata expressions defined in [utils/transformations.js](utils/transformations.js). Responses from Notion are passed through [`helpers.transformData`](utils/helpers.js) which evaluates the JSONata expression (optionally with a context).

## Error handling

Errors are handled by the middleware in [middleware/errorHandler.js](middleware/errorHandler.js). In development mode it includes stack traces in JSON responses.

## Files in this repository

- [.env](.env)
- [.env.example](.env.example)
- [.gitignore](.gitignore)
- [index.js](index.js)
- [package.json](package.json)
- [README.md](README.md)
- [.github/pull_request_template.md](.github/pull_request_template.md)
- [config/notion.js](config/notion.js)
- [middleware/errorHandler.js](middleware/errorHandler.js)
- [routes/health.js](routes/health.js)
- [routes/index.js](routes/index.js)
- [routes/tickets.js](routes/tickets.js)
- [utils/helpers.js](utils/helpers.js)
- [utils/transformations.js](utils/transformations.js)

## Notes

- Ensure your Notion integration has access to the target data source.
- The JSONata expressions assume specific Notion property names (e.g., `Type`, `Reported On`, `ID`, `Title`). Adjust expressions in [utils/transformations.js](utils/transformations.js) if your Notion schema differs.
