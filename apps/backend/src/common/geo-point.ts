/**
 * GeoJSON shape TypeORM's postgres driver reads/writes for `geography`
 * columns (via ST_AsGeoJSON / ST_GeomFromGeoJSON under the hood).
 * Note: GeoJSON coordinate order is [lng, lat], not [lat, lng].
 */
export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export function toGeoPoint(lat: number, lng: number): GeoPoint {
  return { type: "Point", coordinates: [lng, lat] };
}

export function fromGeoPoint(point: GeoPoint): { lat: number; lng: number } {
  const [lng, lat] = point.coordinates;
  return { lat, lng };
}
