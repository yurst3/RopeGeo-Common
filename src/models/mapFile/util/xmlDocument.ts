import { DOMParser } from '@xmldom/xmldom';
import { MapFileParseError } from '../mapFileParseError';
import type { MapFileImportFormat } from './formats';

/** Parses XML, throwing {@link MapFileParseError} unless it's well formed with a `<rootName>` root. */
export function parseXmlDocument(format: MapFileImportFormat, text: string, rootName: string): Document {
    const errors: string[] = [];
    const document = new DOMParser({
        errorHandler: {
            warning: () => {},
            error: (message: string) => errors.push(message),
            fatalError: (message: string) => errors.push(message),
        },
    }).parseFromString(text, 'text/xml');
    const root = document?.documentElement;
    const localName = root?.localName ?? root?.nodeName?.split(':').pop();
    if (root == null || localName !== rootName) {
        throw new MapFileParseError(format, errors[0] ?? `expected a <${rootName}> document`);
    }
    return document as unknown as Document;
}
