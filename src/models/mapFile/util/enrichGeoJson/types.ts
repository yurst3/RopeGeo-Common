import type { Feature } from 'geojson';
import type { LegendItem } from '../../../minimap/legend/abstract/legendItem';
import type { LegendIdAssigner } from './legendId';

/** Shared state while enriching one file's features. */
export type EnrichContext = {
    assignId: LegendIdAssigner;
    /** Position of the source feature in the file; numbers fallback names like "Line 3". */
    featureIndex: number;
};

/**
 * One output feature. Legend-backed features carry a `legendId` property matching `legendItem`;
 * features that can't be drawn as a legend item (no geometry, invalid coordinates, or an
 * unsupported type) pass through unchanged with no legend item.
 */
export type EnrichedFeature = {
    feature: Feature;
    legendItem: LegendItem | null;
};

/** Returns a feature unchanged, without a legend item. */
export function passThrough(feature: Feature): EnrichedFeature {
    return { feature: { ...feature }, legendItem: null };
}
