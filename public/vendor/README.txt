Vendored browser libraries. Served from this origin so CSP can stay 'self'.

- chart.umd.min.js — Chart.js 4.4.0 UMD build (MIT).
  Source: https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
  The trailing sourceMappingURL line was removed so DevTools does not
  request a map we do not ship. Integrity hash lives on the <script> tags
  in public/dashboards/*/index.html.

Do not load Chart.js (or anything else) from a CDN without putting that
origin on the Content-Security-Policy allow-list in public/_headers.
