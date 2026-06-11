import type { PageViewType } from '../models/pageViews/pageViewType';
import { hydrateTaskDependencyFromStoredState } from './helpers/downloadDependencyRegistry';
import type {
    DownloadJobConfig,
    DownloadJobContext,
    DownloadJobStoredState,
    DownloadJobUIState,
    DownloadJobUISnapshot,
    DownloadPlatformHarness,
    DownloadTaskDependency,
} from './types';
import { DownloadPhase } from './downloadPhase';
import { InvalidDownloadJobStoredStateError } from './errors';

type JobChangeListener = () => void;

export class DownloadJob {
    readonly pageId: string;
    readonly pageViewType: PageViewType;
    readonly config: DownloadJobConfig;
    readonly phases: DownloadPhase[];
    readonly taskDependencies: Record<string, DownloadTaskDependency>;
    state: DownloadJobUIState;
    currentPhaseIndex: number;
    errorMessage: string | null;
    private onChange: JobChangeListener | null;
    private readonly context: DownloadJobContext;

    constructor(args: {
        pageId: string;
        pageViewType: PageViewType;
        config: DownloadJobConfig;
        phases: DownloadPhase[];
        taskDependencies?: Record<string, DownloadTaskDependency>;
        state?: DownloadJobUIState;
        currentPhaseIndex?: number;
        errorMessage?: string | null;
    }) {
        this.pageId = args.pageId;
        this.pageViewType = args.pageViewType;
        this.config = args.config;
        this.phases = args.phases;
        this.taskDependencies = args.taskDependencies ?? {};
        this.state = args.state ?? 'queued';
        this.currentPhaseIndex = args.currentPhaseIndex ?? 0;
        this.errorMessage = args.errorMessage ?? null;
        this.onChange = null;
        this.context = {
            pageId: this.pageId,
            pageViewType: this.pageViewType,
            config: this.config,
            taskDependencies: this.taskDependencies,
            getDependency: (key: string): DownloadTaskDependency => {
                const dependency = this.taskDependencies[key];
                if (dependency == null) {
                    throw new Error(`DownloadJob missing dependency "${key}"`);
                }
                return dependency;
            },
            setDependency: (key: string, dep: DownloadTaskDependency): void => {
                this.taskDependencies[key] = dep;
            },
            appendPhases: (phases: DownloadPhase[]): void => {
                this.appendPhases(phases);
            },
        };
    }

    setOnChange(listener: JobChangeListener | null): void {
        this.onChange = listener;
    }

    appendPhases(phases: DownloadPhase[]): void {
        if (phases.length === 0) {
            return;
        }
        this.phases.push(...phases);
        this.emitChange();
    }

    async runTick(
        platformHarness: DownloadPlatformHarness,
        signal: AbortSignal,
    ): Promise<void> {
        if (this.state === 'success' || this.state === 'error' || this.state === 'cancelled') {
            return;
        }
        if (this.currentPhaseIndex >= this.phases.length) {
            this.state = 'success';
            this.emitChange();
            return;
        }

        this.state = 'running';
        const phase = this.phases[this.currentPhaseIndex];
        try {
            const done = await phase.runTick(this.context, platformHarness, signal);
            if (done) {
                this.currentPhaseIndex += 1;
                if (this.currentPhaseIndex >= this.phases.length) {
                    this.state = 'success';
                }
            }
            this.errorMessage = null;
            this.emitChange();
        } catch (error) {
            this.state = 'error';
            this.errorMessage = error instanceof Error ? error.message : String(error);
            this.emitChange();
            throw error;
        }
    }

    abort(): void {
        if (this.state === 'success') {
            return;
        }
        this.state = 'cancelled';
        this.errorMessage = null;
        this.emitChange();
    }

    toUISnapshot(): DownloadJobUISnapshot {
        const activePhase = this.phases[this.currentPhaseIndex];
        return {
            pageId: this.pageId,
            state: this.state,
            phaseTitle: activePhase?.title ?? '',
            phaseProgress: activePhase?.progressPercent ?? 1,
            displayStep: Math.min(this.currentPhaseIndex + 1, Math.max(this.phases.length, 1)),
            displayTotal: this.phases.length,
            errorMessage: this.errorMessage,
        };
    }

    toStoredState(): DownloadJobStoredState {
        return {
            pageId: this.pageId,
            pageViewType: this.pageViewType,
            savedAt: this.config.savedAt,
            mapboxStyleUrl: this.config.mapboxStyleUrl,
            webScraperBaseUrl: this.config.webScraperBaseUrl,
            state: this.state,
            currentPhaseIndex: this.currentPhaseIndex,
            phases: this.phases.map((phase) => phase.toStoredState()),
            taskDependencies: Object.fromEntries(
                Object.entries(this.taskDependencies).map(([key, dependency]) => [
                    key,
                    dependency.toStoredState(),
                ]),
            ),
            errorMessage: this.errorMessage,
        };
    }

    static fromStoredState(raw: unknown): DownloadJob {
        if (raw == null || typeof raw !== 'object') {
            throw new InvalidDownloadJobStoredStateError('DownloadJob state must be an object');
        }
        const value = raw as Record<string, unknown>;
        const pageId =
            typeof value.pageId === 'string' && value.pageId.length > 0
                ? value.pageId
                : null;
        if (pageId == null) {
            throw new InvalidDownloadJobStoredStateError('DownloadJob.pageId is required');
        }
        if (typeof value.pageViewType !== 'string') {
            throw new InvalidDownloadJobStoredStateError(
                'DownloadJob.pageViewType is required',
                pageId,
            );
        }
        if (!Array.isArray(value.phases)) {
            throw new InvalidDownloadJobStoredStateError(
                'DownloadJob.phases must be an array',
                pageId,
            );
        }
        if (
            typeof value.savedAt !== 'number' ||
            typeof value.mapboxStyleUrl !== 'string' ||
            typeof value.webScraperBaseUrl !== 'string'
        ) {
            throw new InvalidDownloadJobStoredStateError(
                'DownloadJob config fields are invalid',
                pageId,
            );
        }
        const phases = value.phases.map((phase) => DownloadPhase.fromStoredState(phase));
        const currentPhaseIndexRaw = value.currentPhaseIndex;
        if (
            typeof currentPhaseIndexRaw !== 'number' ||
            !Number.isInteger(currentPhaseIndexRaw) ||
            currentPhaseIndexRaw < 0
        ) {
            throw new InvalidDownloadJobStoredStateError(
                'DownloadJob.currentPhaseIndex is invalid',
                pageId,
            );
        }
        const currentPhaseIndex = currentPhaseIndexRaw;
        if (value.taskDependencies == null || typeof value.taskDependencies !== 'object') {
            throw new InvalidDownloadJobStoredStateError(
                'DownloadJob.taskDependencies is invalid',
                pageId,
            );
        }
        const taskDependencies: Record<string, DownloadTaskDependency> = {};
        for (const [key, dependency] of Object.entries(
            value.taskDependencies as Record<string, unknown>,
        )) {
            taskDependencies[key] = hydrateTaskDependencyFromStoredState(dependency);
        }
        const jobState = value.state;
        if (
            jobState !== 'queued' &&
            jobState !== 'running' &&
            jobState !== 'success' &&
            jobState !== 'error' &&
            jobState !== 'cancelled'
        ) {
            throw new InvalidDownloadJobStoredStateError('DownloadJob.state is invalid', pageId);
        }
        const jobStateValue: DownloadJobUIState = jobState;

        return new DownloadJob({
            pageId,
            pageViewType: value.pageViewType as PageViewType,
            config: {
                savedAt: value.savedAt as number,
                mapboxStyleUrl: value.mapboxStyleUrl as string,
                webScraperBaseUrl: value.webScraperBaseUrl as string,
            },
            phases,
            taskDependencies,
            state: jobStateValue,
            currentPhaseIndex,
            errorMessage:
                typeof value.errorMessage === 'string' ? value.errorMessage : null,
        });
    }

    private emitChange(): void {
        this.config.onProgress?.(this.toUISnapshot());
        this.onChange?.();
    }
}
