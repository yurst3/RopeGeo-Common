/**
 * Shared display formatter for measurement values, used by {@link Measurement.toString}.
 *
 * Rules (applied to the magnitude, sign preserved; exact 0 renders as "0"):
 * - |value| > 9999            -> scientific notation, 2 decimal places
 * - 1 <= |value| <= 9999      -> rounded to the nearest 0.1, no scientific notation
 * - 0.001 <= |value| < 1      -> rounded to the nearest 0.001, no scientific notation
 * - |value| < 0.001           -> scientific notation, 2 decimal places
 *
 * Rounding drops trailing zeros (e.g. `200`, `5.1`, `0.083`).
 */
export function formatMeasurementValue(value: number): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(
            `formatMeasurementValue: value must be a finite number, got: ${value}`,
        );
    }
    if (value === 0) {
        return '0';
    }
    const magnitude = Math.abs(value);
    if (magnitude > 9999) {
        return value.toExponential(2);
    }
    if (magnitude >= 1) {
        return String(roundTo(value, 1));
    }
    if (magnitude >= 0.001) {
        return String(roundTo(value, 3));
    }
    return value.toExponential(2);
}

function roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
