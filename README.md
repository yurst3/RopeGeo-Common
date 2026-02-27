# ropegeo-common

Shared types and utilities for [RopeGeo](https://github.com/yurst3/RopeGeo) and [WebScraper](https://github.com/yurst3/WebScraper). Published to npm as [`ropegeo-common`](https://www.npmjs.com/package/ropegeo-common) so both projects can depend on a single set of types instead of duplicating code.

## What’s in this package

- **Page preview types** – `PagePreview`, `Difficulty`, and related enums used by the route preview API (e.g. GET /route/{routeId}/preview). `PagePreview` includes optional `permit` (`PermitStatus` enum: Yes, No, Restricted, Closed, or null).
- **Page data source** – `PageDataSource` enum (e.g. Ropewiki) used when linking routes to pages.
- **Routes (GET /routes)** – `Route`, `RouteType`, `RouteGeoJsonFeature`, and `RoutesGeojson` for the routes GeoJSON Feature Collection API. `RoutesGeojson.fromRoutes(routes)` builds the response shape from an array of `Route`.

## Usage

```bash
npm install ropegeo-common
```

```ts
import {
  PagePreview,
  PageDataSource,
  Difficulty,
  DifficultyTechnical,
  DifficultyWater,
  DifficultyTime,
  DifficultyRisk,
  PermitStatus,
  Route,
  RouteType,
  RoutesGeojson,
} from 'ropegeo-common';
```

## Related repos

- **[RopeGeo](https://github.com/yurst3/RopeGeo)** – Expo app for canyoneering maps and route data.
- **[WebScraper](https://github.com/yurst3/WebScraper)** – Lambdas and jobs that scrape canyoneering sites (e.g. Ropewiki), parse data, and store it for the API.
