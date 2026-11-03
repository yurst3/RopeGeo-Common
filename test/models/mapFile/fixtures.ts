import { strToU8, zipSync } from 'fflate';

/** KML with a styled line (with ExtendedData) and a point. */
export const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
<Placemark>
  <name>Approach</name>
  <Style><LineStyle><color>ff0000ff</color><width>3</width></LineStyle></Style>
  <ExtendedData><Data name="ropegeo:style"><value>dashed</value></Data></ExtendedData>
  <LineString><coordinates>-109.5,38.5 -109.4,38.6,1500</coordinates></LineString>
</Placemark>
<Placemark>
  <name>Rappel 1</name>
  <Point><coordinates>-109.45,38.55</coordinates></Point>
</Placemark>
</Document>
</kml>`;

/** GPX with a waypoint and a styled track carrying a RopeGeo extension value. */
export const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:ropegeo="https://ropegeo.com/xmlns/mapfile/1">
<wpt lat="38.55" lon="-109.45"><name>Parking</name></wpt>
<trk>
  <name>Exit</name>
  <extensions>
    <line xmlns="http://www.topografix.com/GPX/gpx_style/0/2"><color>00ff00</color></line>
    <ropegeo:color>green</ropegeo:color>
  </extensions>
  <trkseg>
    <trkpt lat="38.5" lon="-109.5"><ele>1500</ele></trkpt>
    <trkpt lat="38.6" lon="-109.4"></trkpt>
  </trkseg>
</trk>
</gpx>`;

/** {@link KML} zipped as a KMZ archive's `doc.kml`. */
export function kmzBytes(entries: Record<string, Uint8Array> = { 'doc.kml': strToU8(KML) }): Uint8Array {
    return zipSync(entries);
}
