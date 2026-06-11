export const DOWNLOAD_CANCELLED_MESSAGE = 'Download cancelled';

export class DownloadCancelledError extends Error {
    constructor() {
        super(DOWNLOAD_CANCELLED_MESSAGE);
        this.name = 'DownloadCancelledError';
    }
}

export function isDownloadCancelledError(error: unknown): boolean {
    return error instanceof DownloadCancelledError;
}

export class InvalidDownloadJobStoredStateError extends Error {
    readonly pageId: string | null;

    constructor(message: string, pageId: string | null = null) {
        super(message);
        this.name = 'InvalidDownloadJobStoredStateError';
        this.pageId = pageId;
    }
}
