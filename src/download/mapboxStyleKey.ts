export const MAPBOX_STYLE_KEYS = ['standard', 'satellite'] as const;

export type MapboxStyleKey = (typeof MAPBOX_STYLE_KEYS)[number];

export type MapboxStyleUrls = Record<MapboxStyleKey, string>;
