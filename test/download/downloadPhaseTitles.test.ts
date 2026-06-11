import { describe, it, expect } from '@jest/globals';
import { MiniMapType } from '../../src/models/minimap/abstract/miniMapType';
import {
    buildDeleteStoredPagePhase,
    titleForPhase,
} from '../../src/download/helpers/downloadPhaseTitles';
import { DeleteStoredPageTask } from '../../src/download/tasks/deleteStoredPageTask';
import { FetchImageFilesTask } from '../../src/download/tasks/fetchImageFilesTask';
import { FetchMapboxPackTask } from '../../src/download/tasks/fetchMapboxPackTask';
import { FetchPageJsonTask } from '../../src/download/tasks/fetchPageJsonTask';
import { FetchRegionRouteListTask } from '../../src/download/tasks/fetchRegionRouteListTask';
import { FetchRopeGeoTileFilesTask } from '../../src/download/tasks/fetchRopeGeoTileFilesTask';
import { SaveOfflinePageTask } from '../../src/download/tasks/saveOfflinePageTask';
import { DownloadDependencyKeys } from '../../src/download/dependencies/downloadDependencyKeys';

describe('titleForPhase', () => {
    it('returns Deleting stored page for delete task', () => {
        expect(titleForPhase([new DeleteStoredPageTask()])).toBe('Deleting stored page');
    });

    it('returns Downloading page for fetch page JSON task', () => {
        expect(titleForPhase([new FetchPageJsonTask()])).toBe('Downloading page');
    });

    it('returns Downloading map data when tile files task is present', () => {
        expect(titleForPhase([new FetchRopeGeoTileFilesTask(5)])).toBe('Downloading map data');
    });

    it('returns Saving page for save task', () => {
        expect(titleForPhase([new SaveOfflinePageTask([DownloadDependencyKeys.SaveOfflinePageView])])).toBe(
            'Saving page',
        );
    });

    it('returns Downloading Media when image task has total > 0', () => {
        expect(titleForPhase([new FetchImageFilesTask({ total: 3 })])).toBe('Downloading Media');
    });

    it('returns Downloading local routes for region route list task', () => {
        expect(titleForPhase([new FetchRegionRouteListTask(10)])).toBe('Downloading local routes');
    });

    it('returns Downloading Mapbox Pack for mapbox task without images', () => {
        expect(titleForPhase([new FetchMapboxPackTask()])).toBe('Downloading Mapbox Pack');
    });

    it('prefers Downloading Media over Mapbox when both are in the phase', () => {
        expect(
            titleForPhase([
                new FetchImageFilesTask({ total: 2 }),
                new FetchMapboxPackTask(),
            ]),
        ).toBe('Downloading Media');
    });
});

describe('buildDeleteStoredPagePhase', () => {
    it('builds a phase with delete task and correct title', () => {
        const phase = buildDeleteStoredPagePhase();
        expect(phase.title).toBe('Deleting stored page');
        expect(phase.tasks[0]).toBeInstanceOf(DeleteStoredPageTask);
    });
});
