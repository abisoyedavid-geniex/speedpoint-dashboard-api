// JSONata expressions used to transform incoming API payloads into Databox-ready JSON
const transformations = {
  openSummary: `
    {
      "date": $now(),
      "breakdown": [{
        "type": "Bugs",
        "total": $count(results[properties.Type.select.name="Bug"])
      }, {
        "type": "Feature Requests",
        "total": $count(results[properties.Type.select.name="Feature Request"])
      }, {
        "type": "All",
        "total": $count(results)
      }]
    }
  `,
  averageAge: `
    {
      "date": $now(),
      "data": [{
        "type": "Bugs",
        "average_age_days": bugsAverageAge
      }, {
        "type": "Feature Requests",
        "average_age_days": featureRequestsAverageAge
      }]
    }
  `,
  oldestOpen: `
      {
        "date": $now(),
        "category": $category,
        "top_oldest_tickets": results[[0..$topX]].{
            "ticket_id": properties.ID.unique_id.prefix & ' ' & properties.ID.unique_id.number,
            "title": properties.Title.title[0].plain_text,
            "age_days": properties.Age.number,
            "reported_date": properties.\`Reported On\`.date.start
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
