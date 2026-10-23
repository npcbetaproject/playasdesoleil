# Playas de Soleil project instructions

Repository: npcbetaproject/playasdesoleil
Hosting: GitHub Pages from main, /docs.
Live site: https://npcbetaproject.github.io/playasdesoleil/

## User-requested fare refresh workflow

When the user asks to "refresh the data" in this project, use these defaults without asking for the route again:
- Source: https://www.westjet.com/en-ca, using the rendered booking calendars.
- Route: Toronto Pearson (YYZ) to Liberia, Costa Rica (LIR), and return LIR to YYZ.
- Currency: CAD; prices are one-way per guest; use 1 guest.
- Read both New departure and Return date calendars.
- Standard and scheduled refreshes use no discount code. Clear any previously applied code from the browser before collecting. Only use a code for the specific run explicitly requested by the user; never inherit discount_context from a prior dataset. If a one-time code is applied, record its status and whether calendar discounts are confirmed. On subsequent standard refreshes omit discount_context so the UI's one-time note disappears.
- Scan all available calendar months, through the booking horizon, rather than stopping at May 2027. Include September 2027 if WestJet makes those fares available. Do not invent prices for dates beyond the available horizon.
- Navigate month by month, wait for fares to finish loading, and verify month/year across year boundaries. Hidden adjacent calendars can exist without loaded prices; do not treat unloaded cells as missing fares.
- Record the selected outbound date used for the return calendar as metadata.
- If the site blocks collection, explain the blocker and preserve the last successful data. Do not report a partial scan as a full refresh.
- Replace both root /data price datasets and their matching /docs/data copies so GitHub Pages uses the same data. Existing filenames may be retained; refreshed_at identifies the actual refresh time.
- Set refreshed_at in each dataset to its actual collection timestamp (ISO 8601), record source URL/method and the date range. No-price cells use null, never zero.
- Display Last updated prominently on the page, derived from the datasets' refreshed_at values in America/Toronto. For differing timestamps, show the older one to reflect the last complete pair. Never substitute deployment time or current page-view time.
- Round-trip total is outbound plus return. Preserve the compact interface, trip-length/date/budget filters and Days, Departure Date, Return Date, Total column order. Totals use bold CAD 492 with (322-170) as the direction-price breakdown.
- Validate dates, unique observations, prices, source/published data equality and JavaScript syntax; test filtering when the code changes.
- Commit to main and publish through the existing GitHub Pages workflow. User requests to refresh authorize replacing data and publishing; no extra routine confirmation is needed.
- Verify deployment completes successfully and report the refreshed date range and material changes.

Do not schedule automatic refreshes unless the user requests a schedule.
