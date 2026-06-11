import { DownloadJob } from './downloadJob';
import type {
    DownloadJobQueueStoredState,
    DownloadJobUISnapshot,
    DownloadPlatformHarness,
} from './types';
import { InvalidDownloadJobStoredStateError } from './errors';

type Listener = (snapshots: Record<string, DownloadJobUISnapshot>) => void;
type SuccessHandler = (job: DownloadJob) => Promise<void> | void;

export class DownloadJobQueue {
    private static instance: DownloadJobQueue | null = null;

    private readonly platformHarness: DownloadPlatformHarness;
    private readonly jobsByPageId = new Map<string, DownloadJob>();
    private readonly listeners = new Set<Listener>();
    private readonly onSuccessHandlers = new Map<string, SuccessHandler>();
    private readonly activeAbortControllers = new Map<string, AbortController>();
    private readonly invalidStoredDownloadPageIds = new Set<string>();
    private queueOrder: string[] = [];
    private restored = false;
    private foregroundLoopActive = false;

    private constructor(platformHarness: DownloadPlatformHarness) {
        this.platformHarness = platformHarness;
    }

    static getInstance(platformHarness: DownloadPlatformHarness): DownloadJobQueue {
        if (DownloadJobQueue.instance == null) {
            DownloadJobQueue.instance = new DownloadJobQueue(platformHarness);
        }
        return DownloadJobQueue.instance;
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        listener(this.getSnapshots());
        return () => {
            this.listeners.delete(listener);
        };
    }

    enqueue(job: DownloadJob, onSuccess?: SuccessHandler): void {
        const existing = this.jobsByPageId.get(job.pageId);
        if (
            existing != null &&
            (existing.state === 'queued' || existing.state === 'running')
        ) {
            return;
        }
        this.jobsByPageId.set(job.pageId, job);
        if (!this.queueOrder.includes(job.pageId)) {
            this.queueOrder.push(job.pageId);
        }
        job.setOnChange(() => this.emit());
        if (onSuccess != null) {
            this.onSuccessHandlers.set(job.pageId, onSuccess);
        }
        void this.persist();
        this.emit();
    }

    abort(pageId: string): void {
        this.activeAbortControllers.get(pageId)?.abort();
        this.activeAbortControllers.delete(pageId);
        this.jobsByPageId.get(pageId)?.abort();
        this.jobsByPageId.delete(pageId);
        this.onSuccessHandlers.delete(pageId);
        this.queueOrder = this.queueOrder.filter((value) => value !== pageId);
        void this.persist();
        this.emit();
    }

    async restoreFromStorage(): Promise<void> {
        if (this.restored) {
            return;
        }
        this.restored = true;
        const stored = await this.platformHarness.loadJobStore();
        if (stored == null) {
            return;
        }

        const validQueueOrder: string[] = [];
        const validJobs: Record<string, DownloadJob> = {};
        for (const pageId of stored.queueOrder) {
            const raw = stored.jobs[pageId];
            if (raw == null) {
                continue;
            }
            try {
                const job = DownloadJob.fromStoredState(raw);
                if (job.state === 'success' || job.state === 'cancelled') {
                    continue;
                }
                validJobs[pageId] = job;
                validQueueOrder.push(pageId);
            } catch (error) {
                if (error instanceof InvalidDownloadJobStoredStateError) {
                    if (error.pageId != null) {
                        this.invalidStoredDownloadPageIds.add(error.pageId);
                    } else {
                        this.invalidStoredDownloadPageIds.add(pageId);
                    }
                    continue;
                }
                throw error;
            }
        }

        this.queueOrder = validQueueOrder;
        this.jobsByPageId.clear();
        for (const pageId of Object.keys(validJobs)) {
            const job = validJobs[pageId];
            job.setOnChange(() => this.emit());
            this.jobsByPageId.set(pageId, job);
        }

        const cleanedStore: DownloadJobQueueStoredState = {
            queueOrder: [...this.queueOrder],
            jobs: Object.fromEntries(
                [...this.jobsByPageId.entries()].map(([pageId, job]) => [
                    pageId,
                    job.toStoredState(),
                ]),
            ),
        };
        await this.platformHarness.saveJobStore(cleanedStore);
        this.emit();
    }

    consumeInvalidStoredDownloadPageIds(): string[] {
        const pageIds = [...this.invalidStoredDownloadPageIds];
        this.invalidStoredDownloadPageIds.clear();
        return pageIds;
    }

    async runForegroundTicksWhileActive(): Promise<void> {
        await this.restoreFromStorage();
        if (this.foregroundLoopActive) {
            return;
        }
        this.foregroundLoopActive = true;
        try {
            for (;;) {
                const activePageId = this.getActivePageId();
                if (activePageId == null) {
                    break;
                }
                await this.runSingleTickForPage(activePageId);
            }
        } finally {
            this.foregroundLoopActive = false;
        }
    }

    async runSingleBackgroundTick(): Promise<void> {
        await this.restoreFromStorage();
        const activePageId = this.getActivePageId();
        if (activePageId == null) {
            return;
        }
        await this.runSingleTickForPage(activePageId);
    }

    getSnapshots(): Record<string, DownloadJobUISnapshot> {
        return Object.fromEntries(
            [...this.jobsByPageId.entries()].map(([pageId, job]) => [
                pageId,
                job.toUISnapshot(),
            ]),
        );
    }

    private getActivePageId(): string | null {
        for (const pageId of this.queueOrder) {
            const job = this.jobsByPageId.get(pageId);
            if (job == null) {
                continue;
            }
            if (job.state === 'queued' || job.state === 'running') {
                return pageId;
            }
        }
        return null;
    }

    private async runSingleTickForPage(pageId: string): Promise<void> {
        const job = this.jobsByPageId.get(pageId);
        if (job == null) {
            this.queueOrder = this.queueOrder.filter((value) => value !== pageId);
            return;
        }
        const controller = new AbortController();
        this.activeAbortControllers.set(pageId, controller);
        try {
            await job.runTick(this.platformHarness, controller.signal);
            if (job.state === 'success') {
                await this.onSuccessHandlers.get(pageId)?.(job);
                this.queueOrder = this.queueOrder.filter((value) => value !== pageId);
                this.jobsByPageId.delete(pageId);
                this.onSuccessHandlers.delete(pageId);
            } else if (job.state === 'cancelled' || job.state === 'error') {
                this.queueOrder = this.queueOrder.filter((value) => value !== pageId);
            }
        } finally {
            this.activeAbortControllers.delete(pageId);
            await this.persist();
            this.emit();
        }
    }

    private async persist(): Promise<void> {
        const store: DownloadJobQueueStoredState = {
            queueOrder: [...this.queueOrder],
            jobs: Object.fromEntries(
                [...this.jobsByPageId.entries()].map(([pageId, job]) => [
                    pageId,
                    job.toStoredState(),
                ]),
            ),
        };
        await this.platformHarness.saveJobStore(store);
    }

    private emit(): void {
        const snapshots = this.getSnapshots();
        for (const listener of this.listeners) {
            listener(snapshots);
        }
    }
}
