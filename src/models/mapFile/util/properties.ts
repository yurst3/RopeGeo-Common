/** Property on each legend-backed feature; matches {@link LegendItem.id}. */
export const LEGEND_ID_PROPERTY = 'legendId';

/**
 * Feature properties read and written for styling, following the Mapbox simplestyle spec
 * (`stroke` and `fill` are `#rrggbb`; `stroke-width` is in pixels).
 */
export const STYLE_PROPERTY = {
    name: 'name',
    description: 'description',
    stroke: 'stroke',
    strokeWidth: 'stroke-width',
    strokeOpacity: 'stroke-opacity',
    fill: 'fill',
    fillOpacity: 'fill-opacity',
    markerColor: 'marker-color',
    markerSymbol: 'marker-symbol',
} as const;

/**
 * RopeGeo-specific values carried through exported files so RopeGeo can restore them exactly on
 * re-import. Other apps ignore them.
 */
export const ROPEGEO_PROPERTY = {
    id: 'ropegeo:id',
    color: 'ropegeo:color',
    originalColor: 'ropegeo:original-color',
    style: 'ropegeo:style',
    thickness: 'ropegeo:thickness',
} as const;

export const ROPEGEO_PROPERTY_PREFIX = 'ropegeo:';

/** XML namespace for RopeGeo values in exported GPX extensions. */
export const ROPEGEO_XML_NAMESPACE = 'https://ropegeo.com/xmlns/mapfile/1';
