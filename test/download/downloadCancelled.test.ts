import { describe, it, expect } from '@jest/globals';
import {
    DOWNLOAD_CANCELLED_MESSAGE,
    DownloadCancelledError,
    isDownloadCancelledError,
} from '../../src/download/errors';

describe('downloadCancelled', () => {
    it('DownloadCancelledError uses standard message', () => {
        const error = new DownloadCancelledError();
        expect(error.message).toBe(DOWNLOAD_CANCELLED_MESSAGE);
        expect(error.name).toBe('DownloadCancelledError');
    });

    it('isDownloadCancelledError identifies DownloadCancelledError', () => {
        expect(isDownloadCancelledError(new DownloadCancelledError())).toBe(true);
        expect(isDownloadCancelledError(new Error('other'))).toBe(false);
        expect(isDownloadCancelledError(null)).toBe(false);
    });
});
