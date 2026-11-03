import { createBlockId } from './createBlockId';
import { registerTripReportBlockParser, TripReportBlock } from './tripReportBlock';
import { TripReportBlockType } from './tripReportBlockType';

export type TripReportTextBlockJson = {
    blockType: TripReportBlockType.Text;
    id: string;
    header: string;
    body: string;
};

/** A text section of a trip report: an optional one-line header and a free-form body. */
export class TripReportTextBlock extends TripReportBlock {
    readonly blockType = TripReportBlockType.Text;
    readonly header: string;
    readonly body: string;

    constructor(id: string, header: string, body: string) {
        super(id);
        this.header = header;
        this.body = body;
    }

    static createEmpty(): TripReportTextBlock {
        return new TripReportTextBlock(createBlockId(TripReportBlockType.Text), '', '');
    }

    withHeader(header: string): TripReportTextBlock {
        return new TripReportTextBlock(this.id, header, this.body);
    }

    withBody(body: string): TripReportTextBlock {
        return new TripReportTextBlock(this.id, this.header, body);
    }

    toJSON(): TripReportTextBlockJson {
        return { blockType: this.blockType, id: this.id, header: this.header, body: this.body };
    }

    /** Missing `header` or `body` read as empty text; any other non-string value throws. */
    static fromResult(result: unknown): TripReportTextBlock {
        const r = TripReportBlock.assertBlockType(result, TripReportBlockType.Text, 'TripReportTextBlock');
        return new TripReportTextBlock(
            TripReportBlock.assertNonEmptyString(r.id, 'TripReportTextBlock.id'),
            TripReportBlock.parseOptionalString(r.header, 'TripReportTextBlock.header'),
            TripReportBlock.parseOptionalString(r.body, 'TripReportTextBlock.body'),
        );
    }
}

registerTripReportBlockParser(TripReportBlockType.Text, (res) => TripReportTextBlock.fromResult(res));
