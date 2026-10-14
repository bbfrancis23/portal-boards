# New portal ideas

Ideas for templates after the wellness studio. Each one is a business type that mostly runs on
spreadsheets today, has no single dominant software product, and can be described with a few
tables. See [PLAN.md](PLAN.md#templates-personas-and-demo) for how templates work.

## What makes a good template

- The owner keeps their records in a spreadsheet, a notebook or their head.
- Three to five tables hold everything that matters.
- The owner has questions they can't easily answer today ("which jobs made money?").
- No booking or payment system already owns the data. (This is the weak point of the wellness
  studio: Mindbody, Vagaro and similar tools already hold members, schedule and sales.)

---

## 1. Small landlord (next template)

**Who it's for:** an owner with roughly 5 to 30 rental units who manages them personally. Full
property-management software is more than they need, and most use a spreadsheet.

**Questions the owner wants answered**

- Who hasn't paid this month?
- Which unit costs the most to keep up?
- Which leases end soon?
- How much did I clear this month after expenses?

**Template id:** `small-landlord` · **Default portal name:** "Saguaro Rentals" ·
**Portal persona:** `property-manager`

### Input widgets (the only widgets that hold rows)

| Key | Type | Columns |
|---|---|---|
| `units` | table | property (text), unit (text), beds (select: Studio, 1, 2, 3), rent (currency), status (select: occupied, vacant, turnover) |
| `leases` | table | tenant (text), unit (text), start (date), end (date), rent (currency), deposit (currency), status (select: current, notice given, ended) |
| `rent_roll` | table | month (date), unit (text), tenant (text), due (currency), paid (currency), status (select: paid, late, unpaid), paidOn (date) |
| `maintenance` | table | opened (date), unit (text), issue (text), category (select: Plumbing, Electrical, HVAC, Appliance, Exterior, Other), status (select: open, scheduled, done), vendor (text), cost (currency) |
| `expenses` | table | date (date), property (text), category (select: Mortgage, Insurance, Taxes, Utilities, Repairs, Other), payee (text), amount (currency) |
| `visits` | schedule | title, kind (`repair` \| `showing` \| `inspection`), unit, staff (vendor or owner), start, end |

`rent_roll` has **one row per unit per month** with its own `status`. That keeps "who is late"
a plain `where: {status: "late"}` query, with no need to compare two tables.

### Boards

| Board | Persona | Widgets |
|---|---|---|
| Overview | `property-manager` | stats: occupied units, rent collected this month (vs last month), unpaid or late this month, open maintenance requests; chart: rent collected by month (bar, last 6 months) |
| Units & leases | `leasing-agent` | `units` table; `leases` table; chart: units by status (pie) |
| Rent | `accountant` | `rent_roll` table; chart: rent collected by month, stacked by property; stat: late payments this month |
| Maintenance | `maintenance-coordinator` | `maintenance` table; `visits` schedule; chart: repair cost by unit (bar); chart: requests by category (pie) |
| Expenses | `accountant` | `expenses` table; chart: expenses by month, stacked by category; stat: expenses this month |

### Output widget queries (using the existing `source` shape)

```python
# Overview
{"title": "Occupied units", "format": "number",
 "source": {"widget": "units", "aggregate": "count", "where": {"status": "occupied"}}}

{"title": "Rent collected this month", "format": "currency", "compare": "previous_period",
 "source": {"widget": "rent_roll", "aggregate": "sum", "field": "paid",
            "dateField": "month", "period": "this_month"}}

{"title": "Late or unpaid this month", "format": "number",
 "source": {"widget": "rent_roll", "aggregate": "count", "where": {"status": "late"},
            "dateField": "month", "period": "this_month"}}

{"title": "Open maintenance requests", "format": "number",
 "source": {"widget": "maintenance", "aggregate": "count", "where": {"status": "open"}}}

# Maintenance
{"title": "Repair cost by unit", "chartType": "bar",
 "source": {"widget": "maintenance", "aggregate": "sum", "field": "cost", "groupBy": "unit"}}

# Expenses
{"title": "Expenses by month", "chartType": "bar", "stacked": True,
 "source": {"widget": "expenses", "aggregate": "sum", "field": "amount",
            "dateField": "date", "bucket": "month", "period": "last_6_months",
            "seriesBy": "category"}}
```

### Personas

| Id | Board | Voice and expertise |
|---|---|---|
| `property-manager` | Overview | Practical and direct. Summarizes the month: collections, vacancies, what needs attention first. |
| `leasing-agent` | Units & leases | Friendly and organized. Lease renewals, vacancy, turnover timing, rent compared with other units in the portal. |
| `accountant` | Rent, Expenses | Reused from the wellness studio. Cash flow, late payers, expense categories. |
| `maintenance-coordinator` | Maintenance | Calm and methodical. Open requests, repeat problems in the same unit, vendor costs. |

### Sample data (generated relative to today, seeded)

- 3 properties (a fourplex, a six-unit building, two single-family houses): 12 units.
- 11 occupied, 1 in turnover.
- 12 leases, with 2 ending in the next 60 days and 1 with notice given.
- `rent_roll`: this month and the previous five. Most rows paid on time, a few late, one unit
  unpaid this month.
- About 25 maintenance requests over 6 months, with one unit that keeps having plumbing
  problems (so the AI has something to notice).
- Monthly mortgage, insurance and utilities, plus repair expenses that match the maintenance
  costs.
- `visits`: a few repairs, one showing for the turnover unit and one inspection this week.

### Gaps in the current query shape

The wellness template never needed these. Each is a small addition, and none blocks a first
version.

| Need | Gap | Simple option |
|---|---|---|
| "Leases ending soon" stat | `period` only looks backward | Add `next_30_days` / `next_60_days` |
| "Unpaid **or** late" in one stat | `where` matches one value | Allow a list: `{"status": ["late", "unpaid"]}` |
| Occupancy rate (%) | No ratio of two counts | Show the count for now; add a `ratio` aggregate later |
| Net income (rent minus expenses) | One source table per widget | Leave to the AI summary at first; later allow two sources |
| Tenant and unit names typed as text | No link between tables | Fine for a first version; later a `reference` column type |

### Things a real landlord will ask about

- **Importing a spreadsheet.** CSV paste on the table widget is what lets them try it with
  real data.
- **Tenant privacy.** Tenant names and payment history go into Claude prompts. Say so plainly
  and consider an option to send unit numbers only.
- **Not accounting or legal advice.** The personas should describe the numbers, not advise on
  evictions, fair-housing questions or taxes.

### Where to find landlords to talk to

- Local real estate investor meetups.
- Landlord and "house hacking" Facebook groups.
- Small-landlord associations (most states and large cities have one).

---

## 2. Other candidates

Each reuses the existing widget types.

### Strongest fits

| Business | Tables it needs | The question it answers |
|---|---|---|
| Mobile services (dog grooming, detailing, cleaning) | customers, weekly schedule, sales | Which customers and routes are worth the drive? Closest to the wellness template. |
| Small trade contractors (handyman, painting, fencing, pool service, landscaping) | jobs, quotes, payments, schedule | Which jobs made money? How many quotes turn into work? |
| Independent repair shops (appliance, bike, small engine, computer) | tickets, parts, sales | How long do repairs take? Which repairs pay? |
| Food trucks and market vendors | sales by location and day, schedule, costs | Which spots are worth going back to? |

### Good fits with a twist

| Business | Tables it needs | Note |
|---|---|---|
| Small nonprofits and clubs (youth leagues, churches, food pantries) | members, dues or donations, volunteers, events | Small budgets, but they recommend tools to each other. |
| Tutors and music teachers | students, lessons (schedule), payments | Same shape as a studio, with fewer competing products. |
| Small farms and nurseries | plantings, harvests, sales by channel | Seasonal data makes good charts. |
| Freelancers and one-person agencies | clients, projects, hours, invoices | Crowded with time trackers, but few offer an AI summary. |

### Harder (existing software already holds the data)

Restaurants, salons, gyms, medical and dental offices, retail shops. Same problem as wellness
studios: the owner would have to enter everything twice.

## 3. Unique portal themes (later)

Each portal could have its own look, not just Clean Future: for example a warmer, softer theme
for a spa, or a plainer one for a landlord. This is feasible because the whole look already comes
from the theme (decided in #43/#44): components only refer to names (`var(--pb-surface)`,
`color="cyan"`, `<Card>`), never to hard-coded colors.

**How it would work**

1. Several themes, each a `createTheme(...)` plus its own token values (light and dark), next to
   today's Clean Future theme in `frontend/src/theme/`.
2. Each portal names its theme: from its template, or a new `Portal.theme_id` column (a small
   migration) so owners could pick one.
3. The app passes the current portal's theme and `cssVariablesResolver` to `MantineProvider`.

**The rule to keep:** every theme defines the **same token names** (`--pb-bg`, `--pb-surface`,
`--pb-glass`, `--pb-cyan`, …). That set is the contract components rely on; themes change the
values, never drop names.

**Small catches:** fonts load per theme; a few shared CSS details (the `glow` button variant, the
glass blur, neon text) may want per-theme versions for a very different look; the contrast test
(`theme/contrast.test.ts`) should run against every theme.
