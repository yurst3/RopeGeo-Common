import type { DownloadPlatformHarness, PendingFileTransfer } from '../types';

export async function reconcilePendingFileTransfer(
    transfer: PendingFileTransfer,
    platformHarness: DownloadPlatformHarness,
): Promise<void> {
    if (transfer.done) {
        return;
    }
    const file = await platformHarness.fileExists(transfer.destPath);
    if (file.exists) {
        transfer.done = true;
    }
}

export async function enqueuePendingFileTransfer(
    transfer: PendingFileTransfer,
    platformHarness: DownloadPlatformHarness,
): Promise<void> {
    if (transfer.enqueued || transfer.done) {
        return;
    }
    await platformHarness.ensureParentDir(transfer.destPath);
    await platformHarness.downloadFile({
        url: transfer.url,
        destPath: transfer.destPath,
        background: transfer.background,
    });
    transfer.enqueued = true;
}
