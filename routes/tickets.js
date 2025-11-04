const express = require("express");
const dayjs = require("dayjs");

const notion = require("../config/notion");
const { transformData } = require("../utils/helpers");
const {
  openSummary,
  oldestOpen,
  averageAge,
} = require("../utils/transformations");

const router = express.Router();

const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;

/**
 * GET /tickets/open-summary
 * Response example
 * {
 * "date": "2025-10-29",
 * "total_open_tickets": 87,
 * "breakdown": {
 *    "bugs": 16,
 *    "feature_requests": 71
 *  }
 * }
 */
router.get("/open-summary", async (req, res, next) => {
  const { category, date_range: dateRange, status } = req.query || {};
  const filter = { and: [] };

  if (status) {
    filter.and.push({
      property: "Status",
      status: { equals: status },
    });
  }

  if (category) {
    filter.and.push({
      property: "Type",
      select: { equals: category },
    });
  }

  // TODO: Add date_range support
  if (dateRange) {
    // Implement date range filtering logic here
  }

  try {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: filter.and.length > 0 ? filter : undefined,
    });

    const transformedData = await transformData(response, openSummary);
    res.json(transformedData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tickets/average_age
 *
 * Query Params
 * - status: string - filter tickets by status (e.g., "Open", "Closed")
 *
 * Response example
 * {
 * "date": "2025-10-29",
 * "average_age_days": {
 *    "bugs": 16,
 *    "feature_requests": 71
 *  }
 * }
 */
router.get("/average-age", async (req, res, next) => {
  try {
    const query = req.query || {};
    const status = query.status || "";

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: status
        ? {
            property: "Status",
            status: { equals: status },
          }
        : undefined,
    });

    const { bugs, feature_requests } = response.results.reduce(
      (acc, item) => {
        const reportedOn = item.properties["Reported On"].date?.start;
        const ageDays = reportedOn
          ? dayjs(new Date()).diff(reportedOn, "day")
          : 0;

        const type = item.properties["Type"].select?.name;
        if (type === "Bug") {
          acc.bugs.push(ageDays);
        } else if (type === "Feature Request") {
          acc.feature_requests.push(ageDays);
        }
        return acc;
      },
      { bugs: [], feature_requests: [] }
    );

    const results = {
      bugsAverageAge: bugs.length
        ? bugs.reduce((a, b) => a + b, 0) / bugs.length
        : 0,
      featureRequestsAverageAge: feature_requests.length
        ? feature_requests.reduce((a, b) => a + b, 0) / feature_requests.length
        : 0,
    };

    const transformedData = await transformData(results, averageAge);
    res.json(transformedData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tickets/average_age
 *
 * Query Params
 * - category: string - "Bug" or "Feature Request"
 * - limit: number - number of top oldest tickets to return
 *
 * Response example
 * {
 * "date": "2025-10-29",
 * "category": "bugs",
 * "top_5_oldest_tickets": [
 *    { "ticket_id": "BUG-1023", "title": "Login fails on Safari", "age_days": 42 },
 *    { "ticket_id": "BUG-0987", "title": "API timeout issue", "age_days": 37 },
 *    { "ticket_id": "BUG-0954", "title": "Incorrect data sync", "age_days": 34 },
 *    { "ticket_id": "BUG-0941", "title": "UI alignment issue", "age_days": 30 },
 *    { "ticket_id": "BUG-0920", "title": "Search index bug", "age_days": 29 }
 *  ]
 * }
 */
router.get("/oldest-open", async (req, res, next) => {
  try {
    const query = req.query || {};
    const category = query.category || "Bug";
    const topX = parseInt(query.limit || "5", 10);

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "Type",
        select: { equals: category },
      },
      sorts: [
        {
          property: "Reported On",
          direction: "ascending",
        },
      ],
      page_size: topX,
    });

    const results = response.results.map((item) => {
      const reportedOn = item.properties["Reported On"].date?.start;
      const ageDays = reportedOn
        ? dayjs(new Date()).diff(reportedOn, "day")
        : 0;
      return {
        ...item,
        properties: { ...item.properties, Age: { number: ageDays } },
      };
    });

    const context = { category, dayjs, topX, today: new Date() };
    const transformedData = await transformData(
      { results },
      oldestOpen,
      context
    );
    res.json({ ...transformedData, results: response.results });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
