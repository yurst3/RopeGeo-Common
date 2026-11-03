export function startOfDay(date: Date): Date {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

export function addDays(date: Date, days: number): Date {
    const next = startOfDay(date);
    next.setDate(next.getDate() + days);
    return next;
}

function isBeforeDay(a: Date, b: Date): boolean {
    return startOfDay(a).getTime() < startOfDay(b).getTime();
}

/** Local calendar day as "YYYY-MM-DD", so a stored date never shifts with the time zone. */
function toDayKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

function fromDayKey(key: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    if (match == null) throw new Error(`Invalid trip report date: ${key}`);
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export type TripReportDatesJson = {
    /** "YYYY-MM-DD" */
    start: string;
    /** "YYYY-MM-DD"; omitted for a single-day trip. */
    end?: string;
};

/**
 * When a trip happened. A single-day trip has no end date; a multi-day trip's end date is
 * always at least one day after its start date. Dates are stored at the start of the day.
 */
export class TripReportDates {
    readonly startDate: Date;
    readonly endDate: Date | null;

    constructor(startDate: Date, endDate: Date | null = null) {
        this.startDate = startOfDay(startDate);
        this.endDate =
            endDate == null
                ? null
                : isBeforeDay(this.startDate, endDate)
                  ? startOfDay(endDate)
                  : addDays(this.startDate, 1);
    }

    static singleDay(date: Date = new Date()): TripReportDates {
        return new TripReportDates(date);
    }

    get isMultipleDays(): boolean {
        return this.endDate != null;
    }

    /** Keeps the end date, pushing it to the day after `date` if it would no longer be later. */
    withStartDate(date: Date): TripReportDates {
        return new TripReportDates(date, this.endDate);
    }

    withEndDate(date: Date): TripReportDates {
        return new TripReportDates(this.startDate, date);
    }

    /** Turning multiple days on starts the end date at the day after the start date. */
    withMultipleDays(enabled: boolean): TripReportDates {
        if (!enabled) {
            return new TripReportDates(this.startDate);
        }
        return new TripReportDates(this.startDate, this.endDate ?? addDays(this.startDate, 1));
    }

    toJSON(): TripReportDatesJson {
        const json: TripReportDatesJson = { start: toDayKey(this.startDate) };
        if (this.endDate != null) json.end = toDayKey(this.endDate);
        return json;
    }

    static fromJSON(json: TripReportDatesJson): TripReportDates {
        return new TripReportDates(
            fromDayKey(json.start),
            json.end != null ? fromDayKey(json.end) : null,
        );
    }
}
