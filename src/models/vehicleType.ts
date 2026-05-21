/**
 * Vehicle requirement from RopeWiki. Member names are lower camelCase derived from
 * Mobile vehicle badge components (filename without `Badge`; leading `4WD` → `fourWd`).
 */
export enum VehicleType {
    passenger = 'passenger',
    highClearance = 'highClearance',
    fourWd = 'fourWd',
    fourWdHighClearance = 'fourWdHighClearance',
    fourWdVeryHighClearance = 'fourWdVeryHighClearance',
}
