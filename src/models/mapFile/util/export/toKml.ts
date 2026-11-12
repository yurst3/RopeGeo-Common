import type { FeatureCollection, Geometry, Position } from 'geojson';
import { LEGEND_ID_PROPERTY, STYLE_PROPERTY } from '../properties';
import { parseHexColor, rgbToKmlColor } from './color';
import { featureDescription, featureName, numberProp, propsObject } from './featureProperties';
import { xmlElement, xmlEscape } from './xml';

const KML_NAMESPACE = 'http://www.opengis.net/kml/2.2';

/** Properties written as KML elements or styles, so they aren't repeated in ExtendedData. */
const HANDLED_PROPERTIES = new Set<string>([
    STYLE_PROPERTY.name,
    STYLE_PROPERTY.description,
    STYLE_PROPERTY.stroke,
    STYLE_PROPERTY.strokeWidth,
    STYLE_PROPERTY.strokeOpacity,
    STYLE_PROPERTY.fill,
    STYLE_PROPERTY.fillOpacity,
    STYLE_PROPERTY.markerColor,
    'title',
    'desc',
    LEGEND_ID_PROPERTY,
]);

type Props = Record<string, unknown>;

function coordinates(positions: Position[]): string {
    return positions
        .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
        .map((p) => (p.length > 2 && Number.isFinite(p[2]) ? `${p[0]},${p[1]},${p[2]}` : `${p[0]},${p[1]}`))
        .join(' ');
}

function polygonXml(rings: Position[][]): string {
    const [outer, ...inner] = rings;
    if (outer == null) return '';
    return [
        '<Polygon>',
        `<outerBoundaryIs><LinearRing><coordinates>${coordinates(outer)}</coordinates></LinearRing></outerBoundaryIs>`,
        ...inner.map(
            (ring) =>
                `<innerBoundaryIs><LinearRing><coordinates>${coordinates(ring)}</coordinates></LinearRing></innerBoundaryIs>`,
        ),
        '</Polygon>',
    ].join('');
}

function geometryXml(geometry: Geometry): string {
    switch (geometry.type) {
        case 'Point':
            return `<Point><coordinates>${coordinates([geometry.coordinates])}</coordinates></Point>`;
        case 'LineString':
            return `<LineString><tessellate>1</tessellate><coordinates>${coordinates(geometry.coordinates)}</coordinates></LineString>`;
        case 'Polygon':
            return polygonXml(geometry.coordinates);
        case 'MultiPoint':
            return `<MultiGeometry>${geometry.coordinates
                .map((position) => geometryXml({ type: 'Point', coordinates: position }))
                .join('')}</MultiGeometry>`;
        case 'MultiLineString':
            return `<MultiGeometry>${geometry.coordinates
                .map((line) => geometryXml({ type: 'LineString', coordinates: line }))
                .join('')}</MultiGeometry>`;
        case 'MultiPolygon':
            return `<MultiGeometry>${geometry.coordinates.map(polygonXml).join('')}</MultiGeometry>`;
        case 'GeometryCollection':
            return `<MultiGeometry>${geometry.geometries.map(geometryXml).join('')}</MultiGeometry>`;
    }
}

function styleXml(props: Props): string {
    const stroke = parseHexColor(props[STYLE_PROPERTY.stroke]);
    const strokeWidth = numberProp(props, STYLE_PROPERTY.strokeWidth);
    const strokeOpacity = numberProp(props, STYLE_PROPERTY.strokeOpacity) ?? 1;
    const fill = parseHexColor(props[STYLE_PROPERTY.fill]);
    const fillOpacity = numberProp(props, STYLE_PROPERTY.fillOpacity) ?? 1;
    const lineStyle =
        stroke != null || strokeWidth != null
            ? `<LineStyle>${stroke != null ? xmlElement('color', rgbToKmlColor(stroke, strokeOpacity)) : ''}${xmlElement('width', strokeWidth)}</LineStyle>`
            : '';
    const polyStyle = fill != null ? `<PolyStyle>${xmlElement('color', rgbToKmlColor(fill, fillOpacity))}</PolyStyle>` : '';
    const markerColor = parseHexColor(props[STYLE_PROPERTY.markerColor]);
    const iconStyle =
        markerColor != null ? `<IconStyle>${xmlElement('color', rgbToKmlColor(markerColor, 1))}</IconStyle>` : '';
    return lineStyle || polyStyle || iconStyle ? `<Style>${iconStyle}${lineStyle}${polyStyle}</Style>` : '';
}

/** Remaining simple properties (including `ropegeo:*`) as ExtendedData name/value pairs. */
function extendedDataXml(props: Props): string {
    const entries = Object.entries(props).filter(
        ([key, value]) =>
            !HANDLED_PROPERTIES.has(key) &&
            (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'),
    );
    if (entries.length === 0) return '';
    return `<ExtendedData>${entries
        .map(([key, value]) => `<Data name="${xmlEscape(key)}">${xmlElement('value', String(value))}</Data>`)
        .join('')}</ExtendedData>`;
}

/**
 * KML 2.2 document with one Placemark per feature. Line, fill, and marker colors become inline
 * styles (KML has no dashed lines); other simple properties, including `ropegeo:*`, go in
 * ExtendedData.
 */
export function toKml(collection: FeatureCollection, options: { documentName?: string } = {}): string {
    const placemarks = collection.features
        .filter((feature) => feature.geometry != null)
        .map((feature) => {
            const props = propsObject(feature.properties);
            return [
                '<Placemark>',
                xmlElement('name', featureName(props)),
                xmlElement('description', featureDescription(props)),
                styleXml(props),
                extendedDataXml(props),
                geometryXml(feature.geometry!),
                '</Placemark>',
            ].join('');
        });
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<kml xmlns="${KML_NAMESPACE}">`,
        '<Document>',
        xmlElement('name', options.documentName),
        ...placemarks,
        '</Document>',
        '</kml>',
        '',
    ]
        .filter((line) => line !== '')
        .concat('')
        .join('\n');
}
