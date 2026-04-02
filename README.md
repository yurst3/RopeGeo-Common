# ropegeo-common

Shared **domain classes** (validated models, enums, request params) and **helpers** (S3, SQS, HTTP, etc.) for [RopeGeo](https://github.com/yurst3/RopeGeo) and [WebScraper](https://github.com/yurst3/WebScraper). Published to npm as [`ropegeo-common`](https://www.npmjs.com/package/ropegeo-common) so both projects can share one package instead of duplicating code.

## Install

```bash
npm install ropegeo-common
```

## Imports

- **Classes** — `import { … } from 'ropegeo-common/classes'` (or `import type { … }` for symbols that are type-only in TypeScript). The package entry `ropegeo-common` also re-exports everything from `./classes` for convenience.
- **Helpers** — `import { … } from 'ropegeo-common/helpers'` (and `import type { … }` for helper types such as `GetS3ObjectResult`).

Helper tables use columns **Name**, **Description**, **Import**. Class tables add **Base class** after **Name** (`N/A` for enums, TypeScript-only type aliases, constants, registration functions, and classes without an exported superclass; otherwise the direct superclass).

---

### General HTTP and async helpers (`src/helpers/`)

| Name | Description | Import |
| --- | --- | --- |
| `httpRequest` | HTTP client wrapper: headers, throws on non-OK responses, optional Lambda proxy routing. | `import { httpRequest } from 'ropegeo-common/helpers'` |
| `ProgressLogger` | Progress logging utility. | `import { ProgressLogger } from 'ropegeo-common/helpers'` |
| `timeoutAfter` | Promise helper that rejects after a timeout. | `import { timeoutAfter } from 'ropegeo-common/helpers'` |

### S3 helpers (`src/helpers/s3/`)

| Name | Description | Import |
| --- | --- | --- |
| `getS3Client` | Returns a shared S3 client (singleton for Lambda reuse). | `import { getS3Client } from 'ropegeo-common/helpers'` |
| `resetS3ClientForTests` | Resets the S3 client singleton (tests). | `import { resetS3ClientForTests } from 'ropegeo-common/helpers'` |
| `listS3Objects` | Lists objects under an S3 prefix with optional pagination. | `import { listS3Objects } from 'ropegeo-common/helpers'` |
| `S3ObjectEntry` | Entry shape for listed S3 objects. | `import type { S3ObjectEntry } from 'ropegeo-common/helpers'` |
| `getS3Object` | Reads an S3 object by bucket and key; returns body string and optional `Content-Type`. | `import { getS3Object } from 'ropegeo-common/helpers'` |
| `GetS3ObjectResult` | Result type for `getS3Object`. | `import type { GetS3ObjectResult } from 'ropegeo-common/helpers'` |
| `putS3Object` | Writes an object to S3. | `import { putS3Object } from 'ropegeo-common/helpers'` |
| `deleteS3Object` | Deletes an object from S3. | `import { deleteS3Object } from 'ropegeo-common/helpers'` |
| `listS3Folder` | Lists keys under a folder-like prefix. | `import { listS3Folder } from 'ropegeo-common/helpers'` |
| `putS3Folder` | Uploads multiple objects as a folder. | `import { putS3Folder } from 'ropegeo-common/helpers'` |
| `replaceS3Folder` | Replaces contents of a folder prefix (delete then upload). | `import { replaceS3Folder } from 'ropegeo-common/helpers'` |

### SQS helpers (`src/helpers/sqs/`)

| Name | Description | Import |
| --- | --- | --- |
| `getSQSClient` | Returns a shared SQS client. | `import { getSQSClient } from 'ropegeo-common/helpers'` |
| `resetSQSClientForTests` | Resets the SQS client singleton (tests). | `import { resetSQSClientForTests } from 'ropegeo-common/helpers'` |
| `sendSQSMessage` | Sends a message to an SQS queue. | `import { sendSQSMessage } from 'ropegeo-common/helpers'` |
| `deleteSQSMessage` | Deletes a message from a queue (e.g. after processing). | `import { deleteSQSMessage } from 'ropegeo-common/helpers'` |
| `changeSQSMessageVisibilityTimeout` | Changes visibility timeout for an in-flight message. | `import { changeSQSMessageVisibilityTimeout } from 'ropegeo-common/helpers'` |

### CloudFront helpers (`src/helpers/cloudfront/`)

| Name | Description | Import |
| --- | --- | --- |
| `createCloudFrontInvalidation` | Creates a CloudFront cache invalidation for the given distribution paths. | `import { createCloudFrontInvalidation } from 'ropegeo-common/helpers'` |

---

### Core enums (`src/classes/` root files)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `PageDataSource` | N/A | Where linked page content comes from (e.g. Ropewiki). | `import { PageDataSource } from 'ropegeo-common/classes'` |
| `PermitStatus` | N/A | Permit state for a canyon page (Yes, No, Restricted, Closed). | `import { PermitStatus } from 'ropegeo-common/classes'` |

### Difficulty (`src/classes/difficulty/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `DifficultyType` | N/A | Discriminator for difficulty scales (e.g. ACA). | `import { DifficultyType } from 'ropegeo-common/classes'` |
| `Difficulty` | N/A | Abstract base for page/route difficulty; `fromResult` dispatches by `difficultyType`. | `import { Difficulty } from 'ropegeo-common/classes'` |
| `registerDifficultyParser` | N/A | Registers a `Difficulty.fromResult` parser for a `DifficultyType`. | `import { registerDifficultyParser } from 'ropegeo-common/classes'` |
| `ACA_RISK_ORDER` | N/A | Numeric total order for ACA risk ratings. | `import { ACA_RISK_ORDER } from 'ropegeo-common/classes'` |
| `ACA_TECHNICAL_ORDER` | N/A | Numeric total order for ACA technical ratings. | `import { ACA_TECHNICAL_ORDER } from 'ropegeo-common/classes'` |
| `ACA_TIME_ORDER` | N/A | Numeric total order for ACA time ratings. | `import { ACA_TIME_ORDER } from 'ropegeo-common/classes'` |
| `ACA_WATER_ORDER` | N/A | Numeric total order for ACA water ratings. | `import { ACA_WATER_ORDER } from 'ropegeo-common/classes'` |
| `AcaTechnicalRating` | N/A | ACA technical rating enum (1–4). | `import { AcaTechnicalRating } from 'ropegeo-common/classes'` |
| `AcaWaterRating` | N/A | ACA water rating enum. | `import { AcaWaterRating } from 'ropegeo-common/classes'` |
| `AcaTimeRating` | N/A | ACA time rating enum (I–VI). | `import { AcaTimeRating } from 'ropegeo-common/classes'` |
| `AcaRiskRating` | N/A | ACA risk rating enum. | `import { AcaRiskRating } from 'ropegeo-common/classes'` |
| `RISK_ORDER` | N/A | Deprecated alias for `ACA_RISK_ORDER`. | `import { RISK_ORDER } from 'ropegeo-common/classes'` |
| `AcaDifficulty` | `Difficulty` | ACA difficulty from DB/API strings; raw vs effective risk. | `import { AcaDifficulty } from 'ropegeo-common/classes'` |
| `DifficultyTechnical` | N/A | Deprecated alias for `AcaTechnicalRating`. | `import { DifficultyTechnical } from 'ropegeo-common/classes'` |
| `DifficultyWater` | N/A | Deprecated alias for `AcaWaterRating`. | `import { DifficultyWater } from 'ropegeo-common/classes'` |
| `DifficultyTime` | N/A | Deprecated alias for `AcaTimeRating`. | `import { DifficultyTime } from 'ropegeo-common/classes'` |
| `DifficultyRisk` | N/A | Deprecated alias for `AcaRiskRating`. | `import { DifficultyRisk } from 'ropegeo-common/classes'` |

### Request parameters (`src/classes/requestParams/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `DifficultyParams` | N/A | Abstract GET-query difficulty filter; `fromQueryStringParams` / `fromResult`. | `import { DifficultyParams } from 'ropegeo-common/classes'` |
| `DifficultyParamsQueryRecord` | N/A | Flat string map for difficulty query parsing. | `import type { DifficultyParamsQueryRecord } from 'ropegeo-common/classes'` |
| `registerDifficultyParamsQueryInference` | N/A | Registers inference when `difficulty-type` is omitted. | `import { registerDifficultyParamsQueryInference } from 'ropegeo-common/classes'` |
| `registerDifficultyParamsQueryParser` | N/A | Registers a query parser for a `DifficultyType`. | `import { registerDifficultyParamsQueryParser } from 'ropegeo-common/classes'` |
| `isDifficultyParamsActive` | N/A | True if difficulty params are non-null and active. | `import { isDifficultyParamsActive } from 'ropegeo-common/classes'` |
| `AcaDifficultyParams` | `DifficultyParams` | ACA pipe-list allow-lists for routes/search query strings. | `import { AcaDifficultyParams } from 'ropegeo-common/classes'` |
| `Q_DIFFICULTY_TYPE` | N/A | Query key constant for difficulty type. | `import { Q_DIFFICULTY_TYPE } from 'ropegeo-common/classes'` |
| `Q_ACA_TECHNICAL` | N/A | Query key for ACA technical rating list. | `import { Q_ACA_TECHNICAL } from 'ropegeo-common/classes'` |
| `Q_ACA_WATER` | N/A | Query key for ACA water rating list. | `import { Q_ACA_WATER } from 'ropegeo-common/classes'` |
| `Q_ACA_TIME` | N/A | Query key for ACA time rating list. | `import { Q_ACA_TIME } from 'ropegeo-common/classes'` |
| `Q_ACA_RISK` | N/A | Query key for ACA risk rating list. | `import { Q_ACA_RISK } from 'ropegeo-common/classes'` |
| `RoutesParams` | `PaginationParams` | Validated GET /routes params (region, source, route type, difficulty, `limit`, `page`). | `import { RoutesParams } from 'ropegeo-common/classes'` |
| `SearchParams` | `CursorPaginationParams` | Validated GET /search params including cursor pagination and difficulty. | `import { SearchParams } from 'ropegeo-common/classes'` |
| `SearchOrder` | N/A | Search sort order (`similarity` \| `quality` \| `distance`). | `import type { SearchOrder } from 'ropegeo-common/classes'` |
| `SearchParamsPosition` | N/A | `{ lat, lon }` for distance search. | `import type { SearchParamsPosition } from 'ropegeo-common/classes'` |

### Persisted filters (`src/classes/filters/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `DifficultyFilterOptions` | N/A | Abstract saved/modal difficulty filter; `fromResult` by `difficultyType`. | `import { DifficultyFilterOptions } from 'ropegeo-common/classes'` |
| `registerDifficultyFilterOptionsParser` | N/A | Registers `DifficultyFilterOptions.fromResult` for a scale. | `import { registerDifficultyFilterOptionsParser } from 'ropegeo-common/classes'` |
| `TechnicalMinMax` | N/A | Inclusive ACA technical min/max for filter UI. | `import { TechnicalMinMax } from 'ropegeo-common/classes'` |
| `WaterMinMax` | N/A | Inclusive ACA water min/max. | `import { WaterMinMax } from 'ropegeo-common/classes'` |
| `TimeMinMax` | N/A | Inclusive ACA time min/max. | `import { TimeMinMax } from 'ropegeo-common/classes'` |
| `RiskMinMax` | N/A | Inclusive ACA risk min/max. | `import { RiskMinMax } from 'ropegeo-common/classes'` |
| `AcaDifficultyFilterOptions` | `DifficultyFilterOptions` | ACA filter options; expands to `AcaDifficultyParams`. | `import { AcaDifficultyFilterOptions } from 'ropegeo-common/classes'` |
| `RouteFilter` | N/A | Persisted explore/minimap route filter → `RoutesParams`. | `import { RouteFilter } from 'ropegeo-common/classes'` |
| `SearchFilter` | N/A | Persisted mobile search filter → `SearchParams`. | `import { SearchFilter } from 'ropegeo-common/classes'` |
| `SavedPagesFilter` | N/A | Saved-pages list filter (name, order, difficulty). | `import { SavedPagesFilter } from 'ropegeo-common/classes'` |
| `SavedPagesOrder` | N/A | `'newest'` \| `'oldest'`. | `import type { SavedPagesOrder } from 'ropegeo-common/classes'` |
| `SavedFilters` | N/A | Bundle of explore, search, and saved-pages filter slots. | `import { SavedFilters } from 'ropegeo-common/classes'` |

### Previews (`src/classes/previews/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `PreviewType` | N/A | Discriminator for search hit kind (page vs region). | `import { PreviewType } from 'ropegeo-common/classes'` |
| `Preview` | N/A | Abstract union base for search/route preview payloads. | `import { Preview } from 'ropegeo-common/classes'` |
| `GetRopewikiPagePreviewRow` | N/A | DB row shape for building `PagePreview` from Ropewiki. | `import type { GetRopewikiPagePreviewRow } from 'ropegeo-common/classes'` |
| `PagePreview` | `Preview` | Page preview (route preview and search hits). | `import { PagePreview } from 'ropegeo-common/classes'` |
| `RegionPreview` | `Preview` | Region search preview. | `import { RegionPreview } from 'ropegeo-common/classes'` |

### Route domain (`src/classes/routes/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RouteType` | N/A | Canyon, Cave, POI, Unknown. | `import { RouteType } from 'ropegeo-common/classes'` |
| `Route` | N/A | Route entity for APIs. | `import { Route } from 'ropegeo-common/classes'` |
| `RouteGeoJsonFeature` | N/A | One GeoJSON feature in the routes collection. | `import { RouteGeoJsonFeature } from 'ropegeo-common/classes'` |

### Routes GeoJSON API (`src/classes/api/getRoutes/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RoutesGeojson` | N/A | GeoJSON FeatureCollection of routes (features only; use region bounds API for bbox). | `import { RoutesGeojson } from 'ropegeo-common/classes'` |
| `RouteResult` | `PaginationResults` | Page of GET /routes (`RouteGeoJsonFeature[]`, `total`, `page`, `resultType` `route`). | `import { RouteResult } from 'ropegeo-common/classes'` |

### Route preview API (`src/classes/api/getRoutePreview/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RoutePreviewResult` | `Result` | Result for GET route preview (page previews array). | `import { RoutePreviewResult } from 'ropegeo-common/classes'` |

### Ropewiki page view API (`src/classes/api/getRopewikiPageView/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiPageView` | N/A | Full Ropewiki page view (sections, images, minimap). | `import { RopewikiPageView } from 'ropegeo-common/classes'` |
| `RopewikiPageViewResult` | `Result` | API result wrapping `RopewikiPageView`. | `import { RopewikiPageViewResult } from 'ropegeo-common/classes'` |

### Page link preview API (`src/classes/api/getRopewikiPageLinkPreview/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiPageLinkPreviewResult` | `Result` | Result for lightweight link preview. | `import { RopewikiPageLinkPreviewResult } from 'ropegeo-common/classes'` |

### Map data tile keys API (`src/classes/api/listMapDataTileKeys/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `MapDataTileKeysResults` | `PaginationResults` | Page-based pagination of map tile keys (`total`, `page`, `totalBytes`). | `import { MapDataTileKeysResults } from 'ropegeo-common/classes'` |

### Search API (`src/classes/api/search/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `SearchResults` | `CursorPaginationResults` | Cursor-paginated search response (`Preview` items). | `import { SearchResults } from 'ropegeo-common/classes'` |

### Ropewiki region view API (`src/classes/api/getRopewikiRegionView/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiRegionView` | N/A | Region detail view payload. | `import { RopewikiRegionView } from 'ropegeo-common/classes'` |
| `RopewikiRegionViewResult` | `Result` | API result wrapping region view. | `import { RopewikiRegionViewResult } from 'ropegeo-common/classes'` |

### Ropewiki region bounds API (`src/classes/api/getRopewikiRegionBounds/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiRegionBoundsResult` | `Result` | GET /ropewiki/region/{id}/bounds (`Bounds` over route coordinates). | `import { RopewikiRegionBoundsResult } from 'ropegeo-common/classes'` |

### Ropewiki region previews API (`src/classes/api/getRopewikiRegionPreviews/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiRegionPreviewsParams` | `CursorPaginationParams` | Query/cursor params for region previews. | `import { RopewikiRegionPreviewsParams } from 'ropegeo-common/classes'` |
| `RopewikiRegionPreviewsResult` | `CursorPaginationResults` | Cursor-paginated region previews (`Preview`). | `import { RopewikiRegionPreviewsResult } from 'ropegeo-common/classes'` |

### Ropewiki region images API (`src/classes/api/getRopewikiRegionImages/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiRegionImageView` | N/A | One image row in region images list. | `import { RopewikiRegionImageView } from 'ropegeo-common/classes'` |
| `RopewikiRegionImageViewRow` | N/A | Raw row shape for region image views. | `import type { RopewikiRegionImageViewRow } from 'ropegeo-common/classes'` |
| `RopewikiRegionImagesParams` | `CursorPaginationParams` | Query/cursor params for region images. | `import { RopewikiRegionImagesParams } from 'ropegeo-common/classes'` |
| `RopewikiRegionImagesResult` | `CursorPaginationResults` | Cursor-paginated region images. | `import { RopewikiRegionImagesResult } from 'ropegeo-common/classes'` |

### Beta sections (`src/classes/betaSections/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `BetaSectionImage` | N/A | Image in a beta section (URLs, pagination bytes). | `import { BetaSectionImage } from 'ropegeo-common/classes'` |
| `RopewikiImageView` | N/A | Type alias of `BetaSectionImage` for Ropewiki page view typings. | `import type { RopewikiImageView } from 'ropegeo-common/classes'` |
| `DownloadBytes` | N/A | Preview/banner/full byte sizes for downloads. | `import { DownloadBytes } from 'ropegeo-common/classes'` |
| `BetaSection` | N/A | Beta section with images. | `import { BetaSection } from 'ropegeo-common/classes'` |
| `RopewikiBetaSectionView` | N/A | Type alias of `BetaSection` for Ropewiki page view typings. | `import type { RopewikiBetaSectionView } from 'ropegeo-common/classes'` |

### Minimap (`src/classes/minimap/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `Bounds` | N/A | Geographic bounding box. | `import { Bounds } from 'ropegeo-common/classes'` |
| `MiniMapType` | N/A | Minimap discriminator (e.g. GeoJSON). | `import { MiniMapType } from 'ropegeo-common/classes'` |
| `MiniMap` | N/A | Abstract base for page/region minimaps. | `import { MiniMap } from 'ropegeo-common/classes'` |
| `RegionMiniMap` | `MiniMap` | Region minimap payload. | `import { RegionMiniMap } from 'ropegeo-common/classes'` |
| `PageMiniMap` | `MiniMap` | Page minimap payload. | `import { PageMiniMap } from 'ropegeo-common/classes'` |

### Link preview (`src/classes/linkPreview/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `LinkPreview` | N/A | Generic link preview (title, image, URL). | `import { LinkPreview } from 'ropegeo-common/classes'` |
| `LinkPreviewImage` | N/A | Image sub-object for link previews. | `import { LinkPreviewImage } from 'ropegeo-common/classes'` |

### Cursors (`src/classes/cursors/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `CursorType` | N/A | Discriminator for cursor encodings. | `import { CursorType } from 'ropegeo-common/classes'` |
| `Cursor` | N/A | Abstract base for typed API cursors. | `import { Cursor } from 'ropegeo-common/classes'` |
| `SearchCursor` | `Cursor` | Search pagination cursor (base64). | `import { SearchCursor } from 'ropegeo-common/classes'` |
| `SearchCursorType` | N/A | Type alias for search cursor payload typing. | `import type { SearchCursorType } from 'ropegeo-common/classes'` |
| `RegionPreviewsCursor` | `Cursor` | Cursor for region previews pagination. | `import { RegionPreviewsCursor } from 'ropegeo-common/classes'` |
| `RegionImagesCursor` | `Cursor` | Cursor for region images pagination. | `import { RegionImagesCursor } from 'ropegeo-common/classes'` |

### Pagination params (`src/classes/params/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `CursorPaginationParams` | N/A | Abstract limit + optional encoded cursor for GET APIs. | `import { CursorPaginationParams } from 'ropegeo-common/classes'` |
| `PaginationParams` | N/A | Abstract `limit` + 1-based `page` for page-based GET APIs. | `import { PaginationParams } from 'ropegeo-common/classes'` |

### Result wrappers (`src/classes/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `ResultType` | N/A | Discriminator enum for single-result API wrappers. | `import { ResultType } from 'ropegeo-common/classes'` |
| `Result` | N/A | Abstract single-result response; `fromResponseBody` dispatches to parsers. | `import { Result } from 'ropegeo-common/classes'` |
| `registerResultParser` | N/A | Registers `Result.fromResponseBody` for a `ResultType`. | `import { registerResultParser } from 'ropegeo-common/classes'` |
| `CursorPaginationResultType` | N/A | Discriminator for cursor-paginated result wrappers. | `import { CursorPaginationResultType } from 'ropegeo-common/classes'` |
| `CursorPaginationResults` | N/A | Abstract `results` + `nextCursor` response shape. | `import { CursorPaginationResults } from 'ropegeo-common/classes'` |
| `ValidatedCursorPaginationResponse` | N/A | Validated inner shape passed to specific cursor result classes. | `import type { ValidatedCursorPaginationResponse } from 'ropegeo-common/classes'` |
| `registerCursorPaginationParser` | N/A | Registers parser for a `CursorPaginationResultType`. | `import { registerCursorPaginationParser } from 'ropegeo-common/classes'` |
| `PaginationResultType` | N/A | Discriminator for page-based paginated result wrappers. | `import { PaginationResultType } from 'ropegeo-common/classes'` |
| `PaginationResults` | N/A | Abstract `results` + `total` + `page` response shape. | `import { PaginationResults } from 'ropegeo-common/classes'` |
| `ValidatedPaginationResponse` | N/A | Validated inner shape for page-based pagination. | `import type { ValidatedPaginationResponse } from 'ropegeo-common/classes'` |
| `registerPaginationParser` | N/A | Registers parser for a `PaginationResultType`. | `import { registerPaginationParser } from 'ropegeo-common/classes'` |

### Mobile / offline (`src/classes/mobile/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `ImageVersion` | N/A | Enum of cached image variant kinds. | `import { ImageVersion } from 'ropegeo-common/classes'` |
| `VERSION_FORMAT` | N/A | Format constant for version strings. | `import { VERSION_FORMAT } from 'ropegeo-common/classes'` |
| `ImageVersions` | N/A | Map of image URLs by `ImageVersion`; `fromResult` for persisted JSON. | `import { ImageVersions } from 'ropegeo-common/classes'` |
| `SavedPage` | N/A | Offline saved page record (`PagePreview` + metadata). | `import { SavedPage } from 'ropegeo-common/classes'` |

### React components (`src/components/`)

| Name | Description | Import |
| --- | --- | --- |
| `RopeGeoHttpRequest` | Single GET/POST wrapper; parses `Result.fromResponseBody`. | `import { RopeGeoHttpRequest, Method, Service } from 'ropegeo-common/components'` |
| `RopeGeoCursorPaginationHttpRequest` | Cursor-paginated fetch with `loadMore`. | `import { RopeGeoCursorPaginationHttpRequest } from 'ropegeo-common/components'` |
| `RopeGeoPaginationHttpRequest<T>` | Page-based fetch; each page validated with `PaginationResults.fromResponseBody`; concatenates `results` into `data` (`T[]` when complete, otherwise `null` with `errors`). | `import { RopeGeoPaginationHttpRequest } from 'ropegeo-common/components'` |

---

## Related repos

- **[RopeGeo](https://github.com/yurst3/RopeGeo)** — Expo app for canyoneering maps and route data.
- **[WebScraper](https://github.com/yurst3/WebScraper)** — Lambdas and jobs that scrape canyoneering sites (e.g. Ropewiki), parse data, and store it for the API.
