type VisibleCharacter = { value: string; index: number };
type ListRange = {
    openStart: number;
    openEnd: number;
    closeStart: number;
    closeEnd: number;
};

const HEADER_TAG = /^<\s*(\/?)h[1-6]\b/i;
const NON_TERMINAL_ABBREVIATIONS = new Set([
    'dr',
    'e.g',
    'etc',
    'i.e',
    'mr',
    'mrs',
    'ms',
    'no',
    'st',
    'vs',
]);

export function visibleCharacters(html: string): VisibleCharacter[] {
    const characters: VisibleCharacter[] = [];
    let headerDepth = 0;

    for (let index = 0; index < html.length; index += 1) {
        if (html[index] === '<') {
            const end = html.indexOf('>', index + 1);
            if (end === -1) break;
            const tag = html.slice(index, end + 1);
            const header = tag.match(HEADER_TAG);
            if (header != null) {
                headerDepth += header[1] === '/' ? -1 : 1;
                headerDepth = Math.max(0, headerDepth);
            }
            index = end;
            continue;
        }
        if (headerDepth === 0) {
            characters.push({ value: html[index], index });
        }
    }

    return characters;
}

function hasVisibleText(
    characters: VisibleCharacter[],
    start: number,
    end: number,
): boolean {
    return characters.some(
        ({ value, index }) => index >= start && index < end && /\S/.test(value),
    );
}

/** True when an offset does not split tag markup or a character entity. */
export function isSafeTextBoundary(html: string, offset: number): boolean {
    if (offset < 0 || offset > html.length) return false;
    if (offset > 0 && offset < html.length) {
        const code = html.charCodeAt(offset - 1);
        if (code >= 0xd800 && code <= 0xdbff) return false;
    }

    let inTag = false;
    let quote: '"' | "'" | null = null;
    for (let index = 0; index < offset; index += 1) {
        const char = html[index];
        if (inTag) {
            if (quote != null) {
                if (char === quote) quote = null;
                continue;
            }
            if (char === '"' || char === "'") {
                quote = char;
                continue;
            }
            if (char === '>') inTag = false;
            continue;
        }
        if (char === '<') inTag = true;
    }
    if (inTag) return false;

    const entityStart = html.lastIndexOf('&', Math.max(0, offset - 1));
    if (entityStart !== -1 && entityStart < offset) {
        const semicolon = html.indexOf(';', entityStart);
        if (semicolon >= offset) {
            const entity = html.slice(entityStart, semicolon + 1);
            if (/^&(?:#\d{1,7}|#x[\da-f]{1,6}|[a-z][\w:-]{0,31});$/i.test(entity)) {
                return false;
            }
        }
    }
    return true;
}

function isSentenceBoundary(
    characters: VisibleCharacter[],
    characterIndex: number,
): boolean {
    const current = characters[characterIndex];
    if (current.value === '!' || current.value === '?') return true;
    if (current.value !== '.') return false;

    const previous = characters[characterIndex - 1]?.value;
    const next = characters[characterIndex + 1]?.value;
    if (previous != null && next != null && /\d/.test(previous) && /\d/.test(next)) {
        return false;
    }
    if (
        previous != null &&
        next != null &&
        /[A-Za-z]/.test(previous) &&
        /[A-Za-z]/.test(next) &&
        characters[characterIndex + 2]?.value === '.'
    ) {
        return false;
    }

    let token = '';
    for (let index = characterIndex - 1; index >= 0; index -= 1) {
        const value = characters[index].value;
        if (!/[A-Za-z.]/.test(value)) break;
        token = value + token;
    }
    const normalized = token.toLowerCase();
    return (
        token.length > 1 &&
        !NON_TERMINAL_ABBREVIATIONS.has(normalized) &&
        !/^(?:[a-z]\.)+[a-z]?$/i.test(token)
    );
}

export function previousSentenceStart(
    html: string,
    anchor: number,
    characters: VisibleCharacter[],
): number {
    const boundaries = characters
        .map((character, index) => ({ character, index }))
        .filter(
            ({ character, index }) =>
                character.index < anchor &&
                isSentenceBoundary(characters, index),
        )
        .map(({ character }) => character.index + 1);
    if (boundaries.length === 0) return 0;

    const latest = boundaries[boundaries.length - 1];
    const boundary = hasVisibleText(characters, latest, anchor)
        ? latest
        : boundaries[boundaries.length - 2];
    let start = boundary ?? 0;
    while (start < anchor && /\s/.test(html[start])) start += 1;
    return start;
}

export function nextSentenceEnd(
    html: string,
    anchor: number,
    characters: VisibleCharacter[],
): number {
    const boundary = characters.find(
        ({ index }, characterIndex) =>
            index >= anchor && isSentenceBoundary(characters, characterIndex),
    );
    if (boundary == null) return html.length;

    let end = boundary.index + 1;
    while (end < html.length) {
        const rest = html.slice(end);
        const whitespace = rest.match(/^\s+/);
        if (whitespace != null) {
            end += whitespace[0].length;
            continue;
        }
        const closingTag = rest.match(/^<\/(?!ul\b|ol\b|li\b)[a-z][^>]*>/i);
        if (closingTag != null) {
            end += closingTag[0].length;
            continue;
        }
        break;
    }
    return end;
}

function findContainingList(
    html: string,
    excerptStart: number,
    excerptEnd: number,
): ListRange | null {
    const stack: { name: string; start: number; end: number }[] = [];
    const ranges: ListRange[] = [];
    const tags = html.matchAll(/<(\/?)(ul|ol)\b[^>]*>/gi);

    for (const tag of tags) {
        const start = tag.index;
        const end = start + tag[0].length;
        const name = tag[2].toLowerCase();
        if (tag[1] !== '/') {
            stack.push({ name, start, end });
            continue;
        }

        const openIndex = stack.map(({ name: n }) => n).lastIndexOf(name);
        if (openIndex === -1) continue;
        const [open] = stack.splice(openIndex, 1);
        if (open.start <= excerptStart && end >= excerptEnd) {
            ranges.push({
                openStart: open.start,
                openEnd: open.end,
                closeStart: start,
                closeEnd: end,
            });
        }
    }

    return (
        ranges.sort(
            (a, b) =>
                b.openStart - a.openStart || a.closeEnd - b.closeEnd,
        )[0] ?? null
    );
}

export function listContext(
    html: string,
    excerptStart: number,
    excerptEnd: number,
    characters: VisibleCharacter[],
): { before: string; after: string } | null {
    const excerpt = html.slice(excerptStart, excerptEnd).trim();
    if (!/^<li\b/i.test(excerpt) || !/<\/li\s*>$/i.test(excerpt)) {
        return null;
    }

    const range = findContainingList(html, excerptStart, excerptEnd);
    if (range == null) return null;

    const listBody = html.slice(range.openEnd, range.closeStart);
    const items = [...listBody.matchAll(/<li\b[^>]*>[\s\S]*?<\/li\s*>/gi)].map(
        (match) => ({
            start: range.openEnd + match.index,
            end: range.openEnd + match.index + match[0].length,
        }),
    );
    const previous = items.filter(({ end }) => end <= excerptStart).at(-1);
    const next = items.find(({ start }) => start >= excerptEnd);

    const before =
        previous != null
            ? html.slice(range.openStart, range.openEnd) +
              html.slice(previous.start, previous.end)
            : html.slice(
                  previousSentenceStart(
                      html,
                      range.openStart,
                      characters,
                  ),
                  range.openEnd,
              );

    const after =
        next != null
            ? html.slice(next.start, next.end) +
              html.slice(range.closeStart, range.closeEnd)
            : html.slice(
                  range.closeStart,
                  nextSentenceEnd(html, range.closeEnd, characters),
              );

    return { before, after };
}

export function fadeText(
    html: string,
    direction: 'toward-end' | 'toward-start',
): string {
    const parts = html.split(/(<[^>]+>)/g);
    const wordCount = parts.reduce(
        (count, part) =>
            part.startsWith('<')
                ? count
                : count + (part.match(/\S+/g)?.length ?? 0),
        0,
    );
    if (wordCount === 0) return html;

    let wordIndex = 0;
    return parts
        .map((part) => {
            if (part.startsWith('<')) return part;
            return part
                .split(/(\s+)/)
                .map((token) => {
                    if (token.length === 0 || /^\s+$/.test(token)) return token;
                    const progress =
                        wordCount === 1 ? 1 : wordIndex / (wordCount - 1);
                    const proximity =
                        direction === 'toward-end' ? progress : 1 - progress;
                    const opacity = (0.3 + proximity * 0.4).toFixed(2);
                    wordIndex += 1;
                    return `<span style="opacity: ${opacity}">${token}</span>`;
                })
                .join('');
        })
        .join('');
}
