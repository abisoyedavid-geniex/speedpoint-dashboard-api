// JSONata expressions used to transform incoming API payloads into Databox-ready JSON
const transformations = {
  openSummary: `
    {
      "date": $now(),
      "total_open_tickets": $count(results),
      "breakdown": {
        "bugs": $count(results[properties.Type.select.name="Bug"]),
        "feature_requests": $count(results[properties.Type.select.name="Feature Request"])
      }
    }
  `,
  averageAge: `
    {
      "date": $now(),
      "average_age_days": {
        "bugs": bugsAverageAge,
        "feature_requests": featureRequestsAverageAge
      }
    }
  `,
  oldestOpen: `
      {
        "date": $now(),
        "category": $category,
        "top_oldest_tickets": results[[0..$topX]].{
            "ticket_id": properties.ID.unique_id.prefix & ' ' & properties.ID.unique_id.number,
            "title": properties.Title.title[0].plain_text,
            "age_days": properties.Age.number
        }
      }
  `,
  leadPoolRunway: `
    (
      $targetWins := target_wins;
      {
        "date": $now(),
        "lead_pool_runway_months": ((($count(leads[status="New"])+$count(leads[status="Inbound New"])) * 0.1) / $targetWins),
        "lead_count": {
          "new": $count(leads[status="New"]),
          "inbound_new": $count(leads[status="Inbound New"])
        }
      }
    )
  `,
  expensesBreakdown: `
    {
      "date": $now(),
      "category": category,
      "actual_expense": actual,
      "budget": budget,
      "remaining_budget": budget - actual,
      "percent_spent": (actual / budget) * 100
    }
  `,
};

module.exports = transformations;
