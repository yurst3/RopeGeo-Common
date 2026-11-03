import type { Feature, Geometry } from 'geojson';
import { createLegendIdAssigner, LEGEND_ID_PROPERTY, type EnrichContext } from '../../../../../src/models';

/** Enrich context for one feature with a fresh id assigner. */
export function testContext(featureIndex = 0, fileName = 'test.geojson'): EnrichContext {
    return { assignId: createLegendIdAssigner(fileName), featureIndex };
}

export function feature<G extends Geometry | null>(geometry: G, properties: Record<string, unknown> = {}): Feature {
    return { type: 'Feature', properties, geometry: geometry as Geometry };
}

export function legendIdOf(f: Feature): string | undefined {
    return (f.properties as Record<string, string> | null)?.[LEGEND_ID_PROPERTY];
}
