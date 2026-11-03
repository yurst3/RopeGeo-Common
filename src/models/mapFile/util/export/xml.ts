const XML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
};

export function xmlEscape(value: string): string {
    return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]!);
}

/** `<tag>value</tag>` with the value escaped, or an empty string when there is no value. */
export function xmlElement(tag: string, value: string | number | undefined | null): string {
    if (value == null || value === '') return '';
    return `<${tag}>${xmlEscape(String(value))}</${tag}>`;
}
