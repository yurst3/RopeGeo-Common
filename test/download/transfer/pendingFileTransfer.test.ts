import { describe, it, expect, jest } from '@jest/globals';
import {
    enqueuePendingFileTransfer,
    reconcilePendingFileTransfer,
} from '../../../src/download/helpers/pendingFileTransfer';
import type { PendingFileTransfer } from '../../../src/download/types';
import { createMockPlatformHarness } from '../helpers/mockPlatformHarness';

function pendingTransfer(overrides: Partial<PendingFileTransfer> = {}): PendingFileTransfer {
    return {
        key: 'file-1',
        url: 'https://example.com/file.bin',
        destPath: '/tmp/file.bin',
        background: true,
        enqueued: false,
        done: false,
        ...overrides,
    };
}

describe('pendingFileTransfer', () => {
    it('reconcilePendingFileTransfer marks done when file exists', async () => {
        const harness = createMockPlatformHarness({
            fileExists: jest.fn(async () => ({ exists: true, size: 100 })),
        });
        const transfer = pendingTransfer();
        await reconcilePendingFileTransfer(transfer, harness);
        expect(transfer.done).toBe(true);
    });

    it('reconcilePendingFileTransfer is a no-op when already done', async () => {
        const harness = createMockPlatformHarness();
        const transfer = pendingTransfer({ done: true });
        await reconcilePendingFileTransfer(transfer, harness);
        expect(harness.fileExists).not.toHaveBeenCalled();
    });

    it('enqueuePendingFileTransfer downloads and marks enqueued', async () => {
        const harness = createMockPlatformHarness();
        const transfer = pendingTransfer();
        await enqueuePendingFileTransfer(transfer, harness);
        expect(transfer.enqueued).toBe(true);
        expect(harness.downloadFile).toHaveBeenCalledWith({
            url: transfer.url,
            destPath: transfer.destPath,
            background: true,
        });
        expect(harness.ensureParentDir).toHaveBeenCalledWith(transfer.destPath);
    });

    it('enqueuePendingFileTransfer skips when already enqueued or done', async () => {
        const harness = createMockPlatformHarness();
        const enqueued = pendingTransfer({ enqueued: true });
        await enqueuePendingFileTransfer(enqueued, harness);
        expect(harness.downloadFile).not.toHaveBeenCalled();

        const done = pendingTransfer({ done: true });
        await enqueuePendingFileTransfer(done, harness);
        expect(harness.downloadFile).not.toHaveBeenCalled();
    });
});
