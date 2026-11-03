export type Rgb = { r: number; g: number; b: number };

/** Parses `#rgb` or `#rrggbb` (the `#` is optional); null for anything else. */
export function parseHexColor(value: unknown): Rgb | null {
    if (typeof value !== 'string') return null;
    const hex = value.trim().replace(/^#/, '');
    const full =
        hex.length === 3
            ? hex
                  .split('')
                  .map((c) => c + c)
                  .join('')
            : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
    return {
        r: Number.parseInt(full.slice(0, 2), 16),
        g: Number.parseInt(full.slice(2, 4), 16),
        b: Number.parseInt(full.slice(4, 6), 16),
    };
}

function hexByte(value: number): string {
    return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

/** `rrggbb` without the `#`, as GPX `gpx_style` expects. */
export function rgbToHex({ r, g, b }: Rgb): string {
    return `${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
}

/** KML colors are alpha, blue, green, red: `aabbggrr`. */
export function rgbToKmlColor({ r, g, b }: Rgb, opacity = 1): string {
    return `${hexByte(opacity * 255)}${hexByte(b)}${hexByte(g)}${hexByte(r)}`;
}

/** Colors Garmin's GPX extension (`gpxx:DisplayColor`) can name. */
const GARMIN_DISPLAY_COLORS: [string, Rgb][] = [
    ['Black', { r: 0, g: 0, b: 0 }],
    ['DarkRed', { r: 128, g: 0, b: 0 }],
    ['DarkGreen', { r: 0, g: 128, b: 0 }],
    ['DarkYellow', { r: 128, g: 128, b: 0 }],
    ['DarkBlue', { r: 0, g: 0, b: 128 }],
    ['DarkMagenta', { r: 128, g: 0, b: 128 }],
    ['DarkCyan', { r: 0, g: 128, b: 128 }],
    ['LightGray', { r: 192, g: 192, b: 192 }],
    ['DarkGray', { r: 128, g: 128, b: 128 }],
    ['Red', { r: 255, g: 0, b: 0 }],
    ['Green', { r: 0, g: 255, b: 0 }],
    ['Yellow', { r: 255, g: 255, b: 0 }],
    ['Blue', { r: 0, g: 0, b: 255 }],
    ['Magenta', { r: 255, g: 0, b: 255 }],
    ['Cyan', { r: 0, g: 255, b: 255 }],
    ['White', { r: 255, g: 255, b: 255 }],
];

/** Closest Garmin display color by RGB distance. */
export function nearestGarminDisplayColor(color: Rgb): string {
    let best = GARMIN_DISPLAY_COLORS[0]!;
    let bestDistance = Infinity;
    for (const entry of GARMIN_DISPLAY_COLORS) {
        const { r, g, b } = entry[1];
        const distance = (r - color.r) ** 2 + (g - color.g) ** 2 + (b - color.b) ** 2;
        if (distance < bestDistance) {
            best = entry;
            bestDistance = distance;
        }
    }
    return best[0];
}
