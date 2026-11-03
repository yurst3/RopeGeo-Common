// Each concrete map file module registers itself with MapFile.fromContent / MapFile.readFile when
// loaded, and EnrichedGeoJsonMapFile with GeoJsonMapFile.enrich.
import './geoJsonMapFile';
import './enrichedGeoJsonMapFile';
import './gpxMapFile';
import './kmlMapFile';
import './kmzMapFile';
