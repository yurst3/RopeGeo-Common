import { strFromU8 } from 'fflate';

/** Raw file contents: text, or bytes (required for KMZ). */
export type MapFileContent = string | Uint8Array;

/** Decodes UTF-8 bytes (or passes text through) and drops a leading byte order mark. */
export function mapFileContentToText(content: MapFileContent): string {
    const text = typeof content === 'string' ? content : strFromU8(content);
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Last path segment without any `?query` or `#hash`. */
export function fileNameFromPath(filePath: string): string {
    const path = filePath.split(/[?#]/)[0] ?? filePath;
    const segments = path.split(/[\\/]/);
    return segments[segments.length - 1] || path;
}

/** `fileName` with its extension replaced (or added) by `extension`. */
export function fileNameWithExtension(fileName: string, extension: string): string {
    const dot = fileName.lastIndexOf('.');
    const base = dot > 0 ? fileName.slice(0, dot) : fileName;
    return `${base}.${extension}`;
}
