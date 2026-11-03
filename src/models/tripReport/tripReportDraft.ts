import type { TripReport } from './tripReport';
import { TripReportDates, type TripReportDatesJson } from './tripReportDates';

export type TripReportDraftJson = {
    id: string;
    title: string;
    dates: TripReportDatesJson;
    bannerImage?: string;
    /** ISO 8601 timestamp of the last autosave. */
    updatedAt: string;
};

/**
 * Summary of an unpublished trip report: just enough to show its preview card. The full report
 * is stored separately and loaded by `id` when the draft is opened.
 */
export class TripReportDraft {
    readonly id: string;
    readonly title: string;
    readonly dates: TripReportDates;
    readonly bannerImage?: string;
    readonly updatedAt: Date;

    constructor(
        id: string,
        title: string,
        dates: TripReportDates,
        bannerImage: string | undefined,
        updatedAt: Date,
    ) {
        this.id = id;
        this.title = title;
        this.dates = dates;
        this.bannerImage = bannerImage;
        this.updatedAt = updatedAt;
    }

    static fromTripReport(report: TripReport, updatedAt: Date = new Date()): TripReportDraft {
        return new TripReportDraft(
            report.id,
            report.title.trim(),
            report.dates,
            report.bannerImage,
            updatedAt,
        );
    }

    toJSON(): TripReportDraftJson {
        const json: TripReportDraftJson = {
            id: this.id,
            title: this.title,
            dates: this.dates.toJSON(),
            updatedAt: this.updatedAt.toISOString(),
        };
        if (this.bannerImage != null) json.bannerImage = this.bannerImage;
        return json;
    }

    static fromJSON(json: TripReportDraftJson): TripReportDraft {
        if (typeof json.id !== 'string' || json.id.length === 0) {
            throw new Error('TripReportDraft JSON is missing an id');
        }
        const updatedAt = new Date(json.updatedAt);
        return new TripReportDraft(
            json.id,
            typeof json.title === 'string' ? json.title : '',
            TripReportDates.fromJSON(json.dates),
            typeof json.bannerImage === 'string' ? json.bannerImage : undefined,
            Number.isNaN(updatedAt.getTime()) ? new Date(0) : updatedAt,
        );
    }
}
