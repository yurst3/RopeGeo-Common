import type { FeatureCollection, Geometry, Position } from 'geojson';
import { ROPEGEO_XML_NAMESPACE, STYLE_PROPERTY } from '../properties';
import { nearestGarminDisplayColor, parseHexColor, rgbToHex } from './color';
import {
    featureDescription,
    featureName,
    numberProp,
    propsObject,
    ropeGeoValues,
    stringProp,
} from './featureProperties';
import { xmlElement, xmlEscape } from './xml';

const GPX_NAMESPACE = 'http://www.topografix.com/GPX/1/1';
const GPX_STYLE_NAMESPACE = 'http://www.topografix.com/GPX/gpx_style/0/2';
const GARMIN_NAMESPACE = 'http://www.garmin.com/xmlschemas/GpxExtensions/v3';
/** gpx_style widths are in millimeters; simplestyle `stroke-width` is in pixels at 96 dpi. */
const MILLIMETERS_PER_PIXEL = 25.4 / 96;

type Props = Record<string, unknown>;
type Waypoint = { props: Props; position: Position };
type Track = { props: Props; segments: Position[][] };

function collect(geometry: Geometry, props: Props, waypoints: Waypoint[], tracks: Track[]): void {
    switch (geometry.type) {
        case 'Point':
            waypoints.push({ props, position: geometry.coordinates });
            return;
        case 'MultiPoint':
            for (const position of geometry.coordinates) waypoints.push({ props, position });
            return;
        case 'LineString':
            tracks.push({ props, segments: [geometry.coordinates] });
            return;
        case 'MultiLineString':
            tracks.push({ props, segments: geometry.coordinates });
            return;
        // GPX has no polygons: each outer ring becomes a closed track segment.
        case 'Polygon':
            if (geometry.coordinates[0] != null) {
                tracks.push({ props, segments: [geometry.coordinates[0]] });
            }
            return;
        case 'MultiPolygon':
            tracks.push({
                props,
                segments: geometry.coordinates
                    .map((polygon) => polygon[0])
                    .filter((ring): ring is Position[] => ring != null),
            });
            return;
        case 'GeometryCollection':
            for (const part of geometry.geometries) collect(part, props, waypoints, tracks);
            return;
    }
}

function isValidPosition(position: Position): boolean {
    return Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

function pointAttributes(position: Position): string {
    return `lat="${position[1]}" lon="${position[0]}"`;
}

function elevation(position: Position): string {
    return position.length > 2 && Number.isFinite(position[2]) ? xmlElement('ele', position[2]) : '';
}

function ropeGeoElements(props: Props): string {
    return ropeGeoValues(props)
        .map(([key, value]) => `<ropegeo:${key}>${xmlEscape(value)}</ropegeo:${key}>`)
        .join('');
}

function trackStyleElements(props: Props): string {
    const color = parseHexColor(props[STYLE_PROPERTY.stroke]);
    const opacity = numberProp(props, STYLE_PROPERTY.strokeOpacity);
    const width = numberProp(props, STYLE_PROPERTY.strokeWidth);
    const lineParts = [
        color != null ? xmlElement('color', rgbToHex(color)) : '',
        opacity != null ? xmlElement('opacity', opacity) : '',
        width != null ? xmlElement('width', Number((width * MILLIMETERS_PER_PIXEL).toFixed(3))) : '',
    ].join('');
    const garmin =
        color != null
            ? `<gpxx:TrackExtension>${xmlElement('gpxx:DisplayColor', nearestGarminDisplayColor(color))}</gpxx:TrackExtension>`
            : '';
    // Unprefixed with a default namespace, as in the gpx_style examples; readers such as
    // togeojson look for a plain `line` element.
    return (lineParts ? `<line xmlns="${GPX_STYLE_NAMESPACE}">${lineParts}</line>` : '') + garmin;
}

function extensions(content: string): string {
    return content ? `<extensions>${content}</extensions>` : '';
}

function waypointXml({ props, position }: Waypoint): string {
    return [
        `<wpt ${pointAttributes(position)}>`,
        elevation(position),
        xmlElement('name', featureName(props)),
        xmlElement('desc', featureDescription(props)),
        xmlElement('sym', stringProp(props, STYLE_PROPERTY.markerSymbol)),
        extensions(ropeGeoElements(props)),
        '</wpt>',
    ].join('');
}

function trackXml({ props, segments }: Track): string {
    const segmentXml = segments
        .map((segment) => segment.filter(isValidPosition))
        .filter((segment) => segment.length > 0)
        .map(
            (segment) =>
                `<trkseg>${segment
                    .map((position) => `<trkpt ${pointAttributes(position)}>${elevation(position)}</trkpt>`)
                    .join('')}</trkseg>`,
        );
    if (segmentXml.length === 0) return '';
    return [
        '<trk>',
        xmlElement('name', featureName(props)),
        xmlElement('desc', featureDescription(props)),
        extensions(trackStyleElements(props) + ropeGeoElements(props)),
        ...segmentXml,
        '</trk>',
    ].join('');
}

/**
 * GPX 1.1 document. Points become waypoints; lines and polygon outlines become tracks. Line
 * color, opacity, and width are written as `gpx_style` and Garmin `DisplayColor` extensions, and
 * `ropegeo:*` properties as RopeGeo extension elements.
 */
export function toGpx(collection: FeatureCollection, options: { documentName?: string } = {}): string {
    const waypoints: Waypoint[] = [];
    const tracks: Track[] = [];
    for (const feature of collection.features) {
        if (feature.geometry == null) continue;
        collect(feature.geometry, propsObject(feature.properties), waypoints, tracks);
    }
    const body = [
        options.documentName ? `<metadata>${xmlElement('name', options.documentName)}</metadata>` : '',
        ...waypoints.filter((waypoint) => isValidPosition(waypoint.position)).map(waypointXml),
        ...tracks.map(trackXml),
    ].filter((line) => line.length > 0);
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        `<gpx version="1.1" creator="RopeGeo" xmlns="${GPX_NAMESPACE}" xmlns:gpxx="${GARMIN_NAMESPACE}" xmlns:ropegeo="${ROPEGEO_XML_NAMESPACE}">`,
        ...body,
        '</gpx>',
        '',
    ].join('\n');
}
