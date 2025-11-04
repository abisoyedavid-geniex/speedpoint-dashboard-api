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
 * @swagger
 * /tickets/open-summary:
 *   get:
 *     parameters:
 *       - in: query
 *         name: status
 *         description: Filter tickets by status (e.g., "Open", "Closed")
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         description: Filter tickets by category (e.g., "Bug", "Feature Request")
 *         schema:
 *           type: string
 *         summary: Get a summary of the total open tickets
 *     description: Retrieve a summary of the total open tickets
 *     tags:
 *       - Tickets
 *     responses:
 *       200:
 *         description: Open tickets summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   example: 2025-11-03T23:59:28.303Z
 *                 total_open_tickets:
 *                   type: number
 *                   example: 34
 *                 breakdown:
 *                   type: object
 *                   properties:
 *                     bugs:
 *                       type: number
 *                       example: 16
 *                     feature_requests:
 *                       type: number
 *                       example: 12
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
 * @swagger
 * /tickets/average_age:
 *   get:
 *     parameters:
 *       - in: query
 *         name: status
 *         description: Filter tickets by status (e.g., "Open", "Closed")
 *         schema:
 *           type: string
 *         summary: Get average age of tickets
 *     description: Retrieve the average age of all open tickets
 *     tags:
 *       - Tickets
 *     responses:
 *       200:
 *         description: Average age of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   example: 2025-11-03T23:59:28.303Z
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "Bugs"
 *                       average_age_days:
 *                         type: number
 *                         example: 54
 */
router.get("/average-age", async (req, res, next) => {
  try {
    const { category, status } = req.query || {};
    const filter = { and: [] };

    if (category) {
      filter.and.push({
        property: "Type",
        select: { equals: category },
      });
    }

    if (status) {
      filter.and.push({
        property: "Status",
        status: { equals: status },
      });
    }

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: filter.and.length > 0 ? filter : undefined,
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
 * @swagger
 * /tickets/oldest-open:
 *   get:
 *     parameters:
 *       - in: query
 *         name: limit
 *         description: Number of top oldest tickets to return
 *         schema:
 *           type: number
 *       - in: query
 *         name: category
 *         description: Filter tickets by category (e.g., "Bug", "Feature Request")
 *         schema:
 *           type: string
 *         summary: Get the number of oldest open tickets
 *     description: Retrieve the number of oldest open tickets
 *     tags:
 *       - Tickets
 *     responses:
 *       200:
 *         description: Oldest tickets data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   example: 2025-11-03T23:59:28.303Z
 *                 category:
 *                   type: string
 *                   example: bugs
 *                 top_oldest_tickets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticket_id:
 *                         type: string
 *                         example: BUG_0372
 *                       title:
 *                         type: string
 *                         example: Login fails on Safari
 *                       age_days:
 *                         type: number
 *                         example: 34
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

    const results = response.results.map((item, index) => {
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
    res.json(transformedData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
