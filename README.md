# ropegeo-common

Shared **domain models** (validated model classes, enums, query params) and **helpers** (S3, SQS, HTTP, etc.) for [RopeGeo](https://github.com/yurst3/RopeGeo) and [WebScraper](https://github.com/yurst3/WebScraper). Published to npm as [`ropegeo-common`](https://www.npmjs.com/package/ropegeo-common) so both projects can share one package instead of duplicating code.

## Install

```bash
npm install ropegeo-common
```

## Imports

- **Models** — `import { … } from 'ropegeo-common/models'` (or `import type { … }` for symbols that are type-only in TypeScript). The package root `ropegeo-common` re-exports everything from `./models` for convenience. The subpath `ropegeo-common/classes` is kept as an alias of `./models` for older imports until dependents switch over.
- **Helpers** — `import { … } from 'ropegeo-common/helpers'` (and `import type { … }` for helper types such as `GetS3ObjectResult`).

Helper tables use columns **Name**, **Description**, **Import**. Model tables add **Base class** after **Name** (`N/A` for enums, TypeScript-only type aliases, constants, registration functions, and classes without an exported superclass; otherwise the direct superclass).

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

### Core enums (`src/models/` root files)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `PageDataSource` | N/A | Where linked page content comes from (e.g. Ropewiki). | `import { PageDataSource } from 'ropegeo-common/models'` |
| `PermitStatus` | N/A | Permit state for a canyon page (Yes, No, Restricted, Closed). | `import { PermitStatus } from 'ropegeo-common/models'` |
| `FetchType` | N/A | Online/offline discriminator type (`'online' \| 'offline'`). | `import type { FetchType } from 'ropegeo-common/models'` |
| `PageViewType` | N/A | Discriminator enum for page view families (currently Ropewiki). | `import { PageViewType } from 'ropegeo-common/models'` |

### Difficulty (`src/models/difficulty/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `DifficultyType` | N/A | Discriminator for difficulty scales (e.g. ACA). | `import { DifficultyType } from 'ropegeo-common/models'` |
| `Difficulty` | N/A | Abstract base for page/route difficulty; `fromResult` dispatches by `difficultyType`. | `import { Difficulty } from 'ropegeo-common/models'` |
| `registerDifficultyParser` | N/A | Registers a `Difficulty.fromResult` parser for a `DifficultyType`. | `import { registerDifficultyParser } from 'ropegeo-common/models'` |
| `ACA_RISK_ORDER` | N/A | Numeric total order for ACA risk ratings. | `import { ACA_RISK_ORDER } from 'ropegeo-common/models'` |
| `ACA_TECHNICAL_ORDER` | N/A | Numeric total order for ACA technical ratings. | `import { ACA_TECHNICAL_ORDER } from 'ropegeo-common/models'` |
| `ACA_TIME_ORDER` | N/A | Numeric total order for ACA time ratings. | `import { ACA_TIME_ORDER } from 'ropegeo-common/models'` |
| `ACA_WATER_ORDER` | N/A | Numeric total order for ACA water ratings. | `import { ACA_WATER_ORDER } from 'ropegeo-common/models'` |
| `AcaTechnicalRating` | N/A | ACA technical rating enum (1–4). | `import { AcaTechnicalRating } from 'ropegeo-common/models'` |
| `AcaWaterRating` | N/A | ACA water rating enum. | `import { AcaWaterRating } from 'ropegeo-common/models'` |
| `AcaTimeRating` | N/A | ACA time rating enum (I–VI). | `import { AcaTimeRating } from 'ropegeo-common/models'` |
| `AcaRiskRating` | N/A | ACA risk rating enum. | `import { AcaRiskRating } from 'ropegeo-common/models'` |
| `RISK_ORDER` | N/A | Deprecated alias for `ACA_RISK_ORDER`. | `import { RISK_ORDER } from 'ropegeo-common/models'` |
| `AcaDifficulty` | `Difficulty` | ACA difficulty from DB/API strings; raw vs effective risk. | `import { AcaDifficulty } from 'ropegeo-common/models'` |
| `DifficultyTechnical` | N/A | Deprecated alias for `AcaTechnicalRating`. | `import { DifficultyTechnical } from 'ropegeo-common/models'` |
| `DifficultyWater` | N/A | Deprecated alias for `AcaWaterRating`. | `import { DifficultyWater } from 'ropegeo-common/models'` |
| `DifficultyTime` | N/A | Deprecated alias for `AcaTimeRating`. | `import { DifficultyTime } from 'ropegeo-common/models'` |
| `DifficultyRisk` | N/A | Deprecated alias for `AcaRiskRating`. | `import { DifficultyRisk } from 'ropegeo-common/models'` |

### API query parameters (`src/models/api/params/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `CursorPaginationParams` | N/A | Abstract limit + optional encoded cursor for GET APIs. | `import { CursorPaginationParams } from 'ropegeo-common/models'` |
| `PaginationParams` | N/A | Abstract `limit` + 1-based `page` for page-based GET APIs. | `import { PaginationParams } from 'ropegeo-common/models'` |
| `DifficultyParams` | N/A | Abstract GET-query difficulty filter; `fromQueryStringParams` / `fromResult`. | `import { DifficultyParams } from 'ropegeo-common/models'` |
| `DifficultyParamsQueryRecord` | N/A | Flat string map for difficulty query parsing. | `import type { DifficultyParamsQueryRecord } from 'ropegeo-common/models'` |
| `registerDifficultyParamsQueryInference` | N/A | Registers inference when `difficulty-type` is omitted. | `import { registerDifficultyParamsQueryInference } from 'ropegeo-common/models'` |
| `registerDifficultyParamsQueryParser` | N/A | Registers a query parser for a `DifficultyType`. | `import { registerDifficultyParamsQueryParser } from 'ropegeo-common/models'` |
| `isDifficultyParamsActive` | N/A | True if difficulty params are non-null and active. | `import { isDifficultyParamsActive } from 'ropegeo-common/models'` |
| `AcaDifficultyParams` | `DifficultyParams` | ACA pipe-list allow-lists for routes/search query strings. | `import { AcaDifficultyParams } from 'ropegeo-common/models'` |
| `Q_DIFFICULTY_TYPE` | N/A | Query key constant for difficulty type. | `import { Q_DIFFICULTY_TYPE } from 'ropegeo-common/models'` |
| `Q_ACA_TECHNICAL` | N/A | Query key for ACA technical rating list. | `import { Q_ACA_TECHNICAL } from 'ropegeo-common/models'` |
| `Q_ACA_WATER` | N/A | Query key for ACA water rating list. | `import { Q_ACA_WATER } from 'ropegeo-common/models'` |
| `Q_ACA_TIME` | N/A | Query key for ACA time rating list. | `import { Q_ACA_TIME } from 'ropegeo-common/models'` |
| `Q_ACA_RISK` | N/A | Query key for ACA risk rating list. | `import { Q_ACA_RISK } from 'ropegeo-common/models'` |
| `RoutesParams` | `PaginationParams` | Validated GET /routes params (region, source, optional `route-types` pipe-list, difficulty, `limit`, `page`). | `import { RoutesParams } from 'ropegeo-common/models'` |
| `SearchParams` | `CursorPaginationParams` | Validated GET /search params including cursor pagination and difficulty. | `import { SearchParams } from 'ropegeo-common/models'` |
| `SearchOrder` | N/A | Search sort order (`similarity` \| `quality` \| `distance`). | `import type { SearchOrder } from 'ropegeo-common/models'` |
| `SearchParamsPosition` | N/A | `{ lat, lon }` for distance search. | `import type { SearchParamsPosition } from 'ropegeo-common/models'` |

### Persisted filters (`src/models/filters/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `DifficultyFilterOptions` | N/A | Abstract saved/modal difficulty filter; `fromResult` by `difficultyType`. | `import { DifficultyFilterOptions } from 'ropegeo-common/models'` |
| `registerDifficultyFilterOptionsParser` | N/A | Registers `DifficultyFilterOptions.fromResult` for a scale. | `import { registerDifficultyFilterOptionsParser } from 'ropegeo-common/models'` |
| `TechnicalMinMax` | N/A | Inclusive ACA technical min/max for filter UI. | `import { TechnicalMinMax } from 'ropegeo-common/models'` |
| `WaterMinMax` | N/A | Inclusive ACA water min/max. | `import { WaterMinMax } from 'ropegeo-common/models'` |
| `TimeMinMax` | N/A | Inclusive ACA time min/max. | `import { TimeMinMax } from 'ropegeo-common/models'` |
| `RiskMinMax` | N/A | Inclusive ACA risk min/max. | `import { RiskMinMax } from 'ropegeo-common/models'` |
| `AcaDifficultyFilterOptions` | `DifficultyFilterOptions` | ACA filter options; expands to `AcaDifficultyParams`. | `import { AcaDifficultyFilterOptions } from 'ropegeo-common/models'` |
| `RouteFilter` | N/A | Persisted explore/minimap route filter → `RoutesParams`. | `import { RouteFilter } from 'ropegeo-common/models'` |
| `SearchFilter` | N/A | Persisted mobile search filter → `SearchParams`. | `import { SearchFilter } from 'ropegeo-common/models'` |
| `SavedPagesFilter` | N/A | Saved-pages list filter (name, order, difficulty). | `import { SavedPagesFilter } from 'ropegeo-common/models'` |
| `SavedPagesOrder` | N/A | `'newest'` \| `'oldest'`. | `import type { SavedPagesOrder } from 'ropegeo-common/models'` |
| `SavedFilters` | N/A | Bundle of explore, search, and saved-pages filter slots. | `import { SavedFilters } from 'ropegeo-common/models'` |

### Previews (`src/models/previews/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `PreviewType` | N/A | Discriminator for search hit kind (page vs region). | `import { PreviewType } from 'ropegeo-common/models'` |
| `Preview` | N/A | Abstract union base for search/route preview payloads. | `import { Preview } from 'ropegeo-common/models'` |
| `GetRopewikiPagePreviewRow` | N/A | DB row shape for building `PagePreview` from Ropewiki. | `import type { GetRopewikiPagePreviewRow } from 'ropegeo-common/models'` |
| `PagePreview` | `Preview` | Abstract page preview base; dispatches to online/offline variants by `fetchType`. | `import { PagePreview } from 'ropegeo-common/models'` |
| `OnlinePagePreview` | `PagePreview` | API-backed page preview with `imageUrl` and `fetchType: "online"`. | `import { OnlinePagePreview } from 'ropegeo-common/models'` |
| `OfflinePagePreview` | `PagePreview` | Persisted page preview with `downloadedImagePath` and `fetchType: "offline"`. | `import { OfflinePagePreview } from 'ropegeo-common/models'` |
| `RegionPreview` | `Preview` | Region search preview. | `import { RegionPreview } from 'ropegeo-common/models'` |

### Route domain (`src/models/routes/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RouteType` | N/A | Canyon, Cave, POI, Unknown. | `import { RouteType } from 'ropegeo-common/models'` |
| `Route` | N/A | Route entity for APIs. | `import { Route } from 'ropegeo-common/models'` |
| `RouteGeoJsonFeature` | N/A | One GeoJSON feature in the routes collection. | `import { RouteGeoJsonFeature } from 'ropegeo-common/models'` |

### Routes GeoJSON API (`src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RoutesGeojson` | N/A | GeoJSON FeatureCollection of routes (features only; region bbox is on `RegionMiniMap.bounds` in GET /ropewiki/region/{id}). | `import { RoutesGeojson } from 'ropegeo-common/models'` |
| `RouteResult` | `PaginationResults` | Page of GET /routes (`RouteGeoJsonFeature[]`, `total`, `page`, `resultType` `route`). | `import { RouteResult } from 'ropegeo-common/models'` |

### Route preview API (`src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RoutePreviewResult` | `Result` | Result for GET route preview (page previews array). | `import { RoutePreviewResult } from 'ropegeo-common/models'` |

### Ropewiki page view API (`src/models/api/endpoints/`, `src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiPageView` | `BaseRopewikiPageView` | Backward-compatible alias exported as the online page view class. | `import { RopewikiPageView } from 'ropegeo-common/models'` |
| `BaseRopewikiPageView` | N/A | Abstract Ropewiki page view base with shared validation/fields. | `import { BaseRopewikiPageView } from 'ropegeo-common/models'` |
| `OnlineRopewikiPageView` | `BaseRopewikiPageView` | Online Ropewiki page view with API image URLs and online minimap variants. | `import { OnlineRopewikiPageView } from 'ropegeo-common/models'` |
| `OfflineRopewikiPageView` | `BaseRopewikiPageView` | Offline Ropewiki page view with downloaded paths and offline minimap variants. | `import { OfflineRopewikiPageView } from 'ropegeo-common/models'` |
| `OnlinePageView` | N/A | Interface for online page-view behavior (`toOffline`, `toSavedPage`, etc.). | `import type { OnlinePageView } from 'ropegeo-common/models'` |
| `OfflinePageView` | N/A | Interface for offline page-view behavior (`toPagePreview`). | `import type { OfflinePageView } from 'ropegeo-common/models'` |
| `RopewikiPageViewResult` | `Result` | API result wrapping `RopewikiPageView`. | `import { RopewikiPageViewResult } from 'ropegeo-common/models'` |

### Page link preview API (`src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiPageLinkPreviewResult` | `Result` | Result for lightweight link preview. | `import { RopewikiPageLinkPreviewResult } from 'ropegeo-common/models'` |

### Map data tile keys API (`src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `MapDataTileKeysResults` | `PaginationResults` | Page-based pagination of map tile keys (`total`, `page`, `totalBytes`). | `import { MapDataTileKeysResults } from 'ropegeo-common/models'` |

### Search API (`src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `SearchResults` | `CursorPaginationResults` | Cursor-paginated search response (`Preview` items). | `import { SearchResults } from 'ropegeo-common/models'` |

### Ropewiki region view API (`src/models/api/endpoints/`, `src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiRegionView` | N/A | Region detail view payload. | `import { RopewikiRegionView } from 'ropegeo-common/models'` |
| `RopewikiRegionViewResult` | `Result` | API result wrapping region view. | `import { RopewikiRegionViewResult } from 'ropegeo-common/models'` |

### Ropewiki region previews API (`src/models/api/params/`, `src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiRegionPreviewsParams` | `CursorPaginationParams` | Query/cursor params for region previews. | `import { RopewikiRegionPreviewsParams } from 'ropegeo-common/models'` |
| `RopewikiRegionPreviewsResult` | `CursorPaginationResults` | Cursor-paginated region previews (`Preview`). | `import { RopewikiRegionPreviewsResult } from 'ropegeo-common/models'` |

### Ropewiki region images API (`src/models/api/endpoints/`, `src/models/api/params/`, `src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `RopewikiRegionImageView` | N/A | One image row in region images list. | `import { RopewikiRegionImageView } from 'ropegeo-common/models'` |
| `RopewikiRegionImageViewRow` | N/A | Raw row shape for region image views. | `import type { RopewikiRegionImageViewRow } from 'ropegeo-common/models'` |
| `RopewikiRegionImagesParams` | `CursorPaginationParams` | Query/cursor params for region images. | `import { RopewikiRegionImagesParams } from 'ropegeo-common/models'` |
| `RopewikiRegionImagesResult` | `CursorPaginationResults` | Cursor-paginated region images. | `import { RopewikiRegionImagesResult } from 'ropegeo-common/models'` |

### Beta sections (`src/models/betaSections/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `BetaSectionImage` | N/A | Abstract beta-section image base; dispatches by `fetchType`. | `import { BetaSectionImage } from 'ropegeo-common/models'` |
| `OnlineBetaSectionImage` | `BetaSectionImage` | API image with remote URLs and optional `downloadBytes`. | `import { OnlineBetaSectionImage } from 'ropegeo-common/models'` |
| `OfflineBetaSectionImage` | `BetaSectionImage` | Persisted image with downloaded banner/full paths. | `import { OfflineBetaSectionImage } from 'ropegeo-common/models'` |
| `RopewikiImageView` | N/A | Type alias of `BetaSectionImage` for Ropewiki page view typings. | `import type { RopewikiImageView } from 'ropegeo-common/models'` |
| `DownloadBytes` | N/A | Preview/banner/full byte sizes for downloads. | `import { DownloadBytes } from 'ropegeo-common/models'` |
| `BetaSection` | N/A | Abstract beta section base; dispatches by `fetchType`. | `import { BetaSection } from 'ropegeo-common/models'` |
| `OnlineBetaSection` | `BetaSection` | API section with online images (`OnlineBetaSectionImage[]`). | `import { OnlineBetaSection } from 'ropegeo-common/models'` |
| `OfflineBetaSection` | `BetaSection` | Persisted section with offline images (`OfflineBetaSectionImage[]`). | `import { OfflineBetaSection } from 'ropegeo-common/models'` |
| `RopewikiBetaSectionView` | N/A | Type alias of `BetaSection` for Ropewiki page view typings. | `import type { RopewikiBetaSectionView } from 'ropegeo-common/models'` |

### Minimap (`src/models/minimap/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `Bounds` | N/A | Geographic bounding box. | `import { Bounds } from 'ropegeo-common/models'` |
| `MiniMapType` | N/A | Minimap discriminator (e.g. GeoJSON). | `import { MiniMapType } from 'ropegeo-common/models'` |
| `MiniMap` | N/A | Abstract base for minimaps; `fromResult` parses API wire types only. | `import { MiniMap } from 'ropegeo-common/models'` |
| `RegionMiniMap` | `MiniMap` | Region minimap (`geojson`): `routesParams`, `bounds` (or null), `title`. | `import { RegionMiniMap } from 'ropegeo-common/models'` |
| `PageMiniMap` | `MiniMap` | Abstract base for page minimaps (online/offline tile templates). | `import { PageMiniMap } from 'ropegeo-common/models'` |
| `OnlinePageMiniMap` | `PageMiniMap` | API page tiles template (`onlineTilesTemplate`, `fetchType: "online"`). | `import { OnlinePageMiniMap } from 'ropegeo-common/models'` |
| `OfflinePageMiniMap` | `PageMiniMap` | Persisted local tiles template (`offlineTilesTemplate`, `fetchType: "offline"`). | `import { OfflinePageMiniMap } from 'ropegeo-common/models'` |
| `CenteredRegionMiniMap` | `MiniMap` | Abstract base for centered region minimaps (online routes params / offline geojson path). | `import { CenteredRegionMiniMap } from 'ropegeo-common/models'` |
| `OnlineCenteredRegionMiniMap` | `CenteredRegionMiniMap` | API centered-route fallback (`routesParams`, `fetchType: "online"`). | `import { OnlineCenteredRegionMiniMap } from 'ropegeo-common/models'` |
| `OfflineCenteredRegionMiniMap` | `CenteredRegionMiniMap` | Persisted local centered-route geojson (`downloadedGeojson`, `fetchType: "offline"`). | `import { OfflineCenteredRegionMiniMap } from 'ropegeo-common/models'` |

### Link preview (`src/models/linkPreview/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `LinkPreview` | N/A | Generic link preview (title, image, URL). | `import { LinkPreview } from 'ropegeo-common/models'` |
| `LinkPreviewImage` | N/A | Image sub-object for link previews. | `import { LinkPreviewImage } from 'ropegeo-common/models'` |

### Cursors (`src/models/api/params/cursors/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `CursorType` | N/A | Discriminator for cursor encodings. | `import { CursorType } from 'ropegeo-common/models'` |
| `Cursor` | N/A | Abstract base for typed API cursors. | `import { Cursor } from 'ropegeo-common/models'` |
| `SearchCursor` | `Cursor` | Search pagination cursor (base64). | `import { SearchCursor } from 'ropegeo-common/models'` |
| `SearchCursorType` | N/A | Type alias for search cursor payload typing. | `import type { SearchCursorType } from 'ropegeo-common/models'` |
| `RegionPreviewsCursor` | `Cursor` | Cursor for region previews pagination. | `import { RegionPreviewsCursor } from 'ropegeo-common/models'` |
| `RegionImagesCursor` | `Cursor` | Cursor for region images pagination. | `import { RegionImagesCursor } from 'ropegeo-common/models'` |

### Result wrappers (`src/models/api/results/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `ResultType` | N/A | Discriminator enum for single-result API wrappers. | `import { ResultType } from 'ropegeo-common/models'` |
| `Result` | N/A | Abstract single-result response; `fromResponseBody` dispatches to parsers. | `import { Result } from 'ropegeo-common/models'` |
| `registerResultParser` | N/A | Registers `Result.fromResponseBody` for a `ResultType`. | `import { registerResultParser } from 'ropegeo-common/models'` |
| `CursorPaginationResultType` | N/A | Discriminator for cursor-paginated result wrappers. | `import { CursorPaginationResultType } from 'ropegeo-common/models'` |
| `CursorPaginationResults` | N/A | Abstract `results` + `nextCursor` response shape. | `import { CursorPaginationResults } from 'ropegeo-common/models'` |
| `ValidatedCursorPaginationResponse` | N/A | Validated inner shape passed to specific cursor result classes. | `import type { ValidatedCursorPaginationResponse } from 'ropegeo-common/models'` |
| `registerCursorPaginationParser` | N/A | Registers parser for a `CursorPaginationResultType`. | `import { registerCursorPaginationParser } from 'ropegeo-common/models'` |
| `PaginationResultType` | N/A | Discriminator for page-based paginated result wrappers. | `import { PaginationResultType } from 'ropegeo-common/models'` |
| `PaginationResults` | N/A | Abstract `results` + `total` + `page` response shape. | `import { PaginationResults } from 'ropegeo-common/models'` |
| `ValidatedPaginationResponse` | N/A | Validated inner shape for page-based pagination. | `import type { ValidatedPaginationResponse } from 'ropegeo-common/models'` |
| `registerPaginationParser` | N/A | Registers parser for a `PaginationResultType`. | `import { registerPaginationParser } from 'ropegeo-common/models'` |

### Mobile / offline (`src/models/mobile/`)

| Name | Base class | Description | Import |
| --- | --- | --- | --- |
| `ImageVersion` | N/A | Enum of cached image variant kinds. | `import { ImageVersion } from 'ropegeo-common/models'` |
| `VERSION_FORMAT` | N/A | Format constant for version strings. | `import { VERSION_FORMAT } from 'ropegeo-common/models'` |
| `ImageVersions` | N/A | Map of image URLs by `ImageVersion`; `fromResult` for persisted JSON. | `import { ImageVersions } from 'ropegeo-common/models'` |
| `SavedPage` | N/A | Saved page record (`OnlinePagePreview` or `OfflinePagePreview`) with optional `downloadedPageViewPath`. | `import { SavedPage } from 'ropegeo-common/models'` |

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
