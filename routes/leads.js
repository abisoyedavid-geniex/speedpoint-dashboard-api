const express = require('express');
const closeio = require('../config/closeio');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

// Close CRM statuses
const TARGET_STATUSES = ['New', 'Inbound New'];
// const TARGET_STATUSES = ['New'];

/**
 * @swagger
 * /api/v1/leads/lead-pool-runway:
 *   get:
 *     summary: Calculate lead pool runway
 *     description: Fetches leads from Close CRM with specific statuses and calculates how many months the current lead pool can sustain based on conversion rate and monthly customer goals
 *     tags:
 *       - Leads
 *     parameters:
 *       - in: query
 *         name: conversationRate
 *         schema:
 *           type: number
 *           default: 0.1
 *         description: Lead to customer conversion rate (default 0.1 or 10%)
 *       - in: query
 *         name: monthlyNewCustomersGoal
 *         schema:
 *           type: integer
 *           default: 19
 *         description: Monthly new customers goal (default 19)
 *     responses:
 *       200:
 *         description: Lead pool runway calculation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLeads:
 *                   type: integer
 *                   description: Total number of leads matching target statuses
 *                 conversionRate:
 *                   type: number
 *                   description: Conversion rate used in calculation
 *                 monthlyNewCustomersGoal:
 *                   type: integer
 *                   description: Monthly new customers goal
 *                 leadPoolRunwayMonths:
 *                   type: number
 *                   description: Number of months the lead pool can sustain the goal
 *       500:
 *         description: Failed to fetch lead pool runway
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/lead-pool-runway', async (req, res) => {
  // Load config from env (with defaults)
  const conversationRate = parseFloat(req.query.conversationRate || 0.1);
  const monthlyNewCustomersGoal = parseInt(
    req.query.monthlyNewCustomersGoal || 19,
    10
  );

  try {
    // Build query for statuses
    const query = TARGET_STATUSES.map((status) => `status:"${status}"`).join(
      ' or '
    );

    const response = await closeio.lead.search({
      query,
      limit: 600,
      include_counts: true,
      limit: 0,
    });

    const totalLeads = response['total_results'] || 0;

    // Compute Lead Pool Runway
    const leadPoolRunwayMonths =
      (totalLeads * conversationRate) / monthlyNewCustomersGoal;

    res.json({
      // leads,
      totalLeads,
      conversionRate: conversationRate,
      monthlyNewCustomersGoal: monthlyNewCustomersGoal,
      leadPoolRunwayMonths: Number(leadPoolRunwayMonths.toFixed(2)),
    });
  } catch (error) {
    console.error(
      'Error fetching leads:',
      error?.response?.data || error.message
    );
    res.status(500).json({ error: 'Failed to fetch lead pool runway.' });
  }
});

module.exports = router;
