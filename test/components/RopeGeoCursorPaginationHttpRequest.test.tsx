/** @jest-environment jsdom */

import { TextDecoder, TextEncoder } from 'util';
import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { render, waitFor, cleanup, act } from '@testing-library/react';
import { RegionPreviewsCursor } from '../../src/classes/cursors/regionPreviewsCursor';
import { RopewikiRegionPreviewsParams } from '../../src/classes/api/getRopewikiRegionPreviews/ropewikiRegionPreviewsParams';
import '../../src/classes/api/getRopewikiRegionPreviews/ropewikiRegionPreviewsResult';
import { CursorPaginationResultType } from '../../src/classes/results/cursorPaginationResults';
import {
    RopeGeoCursorPaginationHttpRequest,
} from '../../src/components/RopeGeoCursorPaginationHttpRequest';
import { Method, Service } from '../../src/components/RopeGeoHttpRequest';
import { mockJsonResponse, requestUrl } from '../helpers/jestFetch';

const BASE = 'https://api.webscraper.ropegeo.com';

function regionPreviewItem(id: string, name: string): Record<string, unknown> {
    return {
        previewType: 'region',
        id,
        name,
        parents: [],
        pageCount: 0,
        regionCount: 0,
        imageUrl: null,
        source: 'ropewiki',
    };
}

function previewsPage(
    items: Record<string, unknown>[],
    nextCursor: string | null,
): Record<string, unknown> {
    return {
        resultType: CursorPaginationResultType.RopewikiRegionPreviews,
        results: items,
        nextCursor,
    };
}

type Args = {
    loading: boolean;
    loadingMore: boolean;
    data: unknown[];
    errors: Error | null;
    loadMore: () => void;
    hasMore: boolean;
};

function TestHost(props: {
    queryParams: RopewikiRegionPreviewsParams;
    onRender: (a: Args) => void;
}) {
    return (
        <RopeGeoCursorPaginationHttpRequest
            service={Service.WEBSCRAPER}
            path="/ropewiki/region/:id/previews"
            pathParams={{ id: 'region-uuid-0001' }}
            queryParams={props.queryParams}
        >
            {(args) => {
                props.onRender(args);
                return null;
            }}
        </RopeGeoCursorPaginationHttpRequest>
    );
}

describe('RopeGeoCursorPaginationHttpRequest', () => {
    const fetchMock = jest.fn<typeof fetch>();

    beforeAll(() => {
        if (globalThis.TextEncoder === undefined) {
            Object.assign(globalThis, { TextEncoder, TextDecoder });
        }
    });

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as typeof fetch;
    });

    afterEach(() => {
        cleanup();
    });

    it('initial fetch fills data; hasMore false when nextCursor is null', async () => {
        fetchMock.mockResolvedValue(
            mockJsonResponse(
                true,
                200,
                JSON.stringify(
                    previewsPage([regionPreviewItem('r1', 'One')], null),
                ),
            ),
        );

        const params = new RopewikiRegionPreviewsParams(10);
        let latest: Args | undefined;
        render(
            <TestHost
                queryParams={params}
                onRender={(a) => {
                    latest = a;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = requestUrl(fetchMock.mock.calls[0]![0]);
        expect(url.startsWith(BASE)).toBe(true);
        expect(url).toContain('/ropewiki/region/region-uuid-0001/previews');
        expect(url).toContain('limit=10');
        expect(url.includes('cursor=')).toBe(false);
        expect(latest?.errors).toBeNull();
        expect(latest?.data).toHaveLength(1);
        expect(latest?.hasMore).toBe(false);
    });

    it('unwraps { data: ... } wrapper before parsing', async () => {
        const inner = previewsPage([regionPreviewItem('r1', 'Wrapped')], null);
        fetchMock.mockResolvedValue(
            mockJsonResponse(true, 200, JSON.stringify({ data: inner })),
        );

        let latest: Args | undefined;
        render(
            <TestHost
                queryParams={new RopewikiRegionPreviewsParams(5)}
                onRender={(a) => {
                    latest = a;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(latest?.data).toHaveLength(1);
    });

    it('hasMore true when nextCursor is set; loadMore appends and clears hasMore', async () => {
        const cursor = new RegionPreviewsCursor(0.5, 'page', 'next-chunk');
        const nextEncoded = cursor.encodeBase64();

        fetchMock.mockImplementation((input) => {
            const url = requestUrl(input);
            if (!url.includes('cursor=')) {
                return Promise.resolve(
                    mockJsonResponse(
                        true,
                        200,
                        JSON.stringify(
                            previewsPage(
                                [regionPreviewItem('a', 'First')],
                                nextEncoded,
                            ),
                        ),
                    ),
                );
            }
            return Promise.resolve(
                mockJsonResponse(
                    true,
                    200,
                    JSON.stringify(
                        previewsPage([regionPreviewItem('b', 'Second')], null),
                    ),
                ),
            );
        });

        let latest: Args | undefined;
        render(
            <TestHost
                queryParams={new RopewikiRegionPreviewsParams(10)}
                onRender={(a) => {
                    latest = a;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(latest?.hasMore).toBe(true);
        expect(latest?.data).toHaveLength(1);

        await act(async () => {
            latest?.loadMore();
        });

        await waitFor(() => {
            expect(latest?.loadingMore).toBe(false);
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const secondUrl = requestUrl(fetchMock.mock.calls[1]![0]);
        expect(secondUrl).toContain('cursor=');
        expect(latest?.data).toHaveLength(2);
        expect((latest?.data[0] as { name: string }).name).toBe('First');
        expect((latest?.data[1] as { name: string }).name).toBe('Second');
        expect(latest?.hasMore).toBe(false);
    });

    it('initial HTTP error sets errors and clears data', async () => {
        fetchMock.mockResolvedValue(mockJsonResponse(false, 503, 'down'));

        let latest: Args | undefined;
        render(
            <TestHost
                queryParams={new RopewikiRegionPreviewsParams(10)}
                onRender={(a) => {
                    latest = a;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(latest?.data).toEqual([]);
        expect(latest?.errors?.message).toMatch(/HTTP 503/);
    });

    it('loadMore HTTP error does not clear existing data', async () => {
        const cursor = new RegionPreviewsCursor(0.1, 'page', 'x');
        fetchMock.mockImplementation((input) => {
            const url = requestUrl(input);
            if (!url.includes('cursor=')) {
                return Promise.resolve(
                    mockJsonResponse(
                        true,
                        200,
                        JSON.stringify(
                            previewsPage(
                                [regionPreviewItem('keep', 'Kept')],
                                cursor.encodeBase64(),
                            ),
                        ),
                    ),
                );
            }
            return Promise.resolve(mockJsonResponse(false, 500, 'fail'));
        });

        let latest: Args | undefined;
        render(
            <TestHost
                queryParams={new RopewikiRegionPreviewsParams(10)}
                onRender={(a) => {
                    latest = a;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(latest?.data).toHaveLength(1);

        await act(async () => {
            latest?.loadMore();
        });

        await waitFor(() => {
            expect(latest?.loadingMore).toBe(false);
        });
        expect(latest?.data).toHaveLength(1);
        expect((latest?.data[0] as { name: string }).name).toBe('Kept');
    });

    it('invalid JSON on initial load sets errors', async () => {
        const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            fetchMock.mockResolvedValue(mockJsonResponse(true, 200, '{'));

            let latest: Args | undefined;
            render(
                <TestHost
                    queryParams={new RopewikiRegionPreviewsParams(10)}
                    onRender={(a) => {
                        latest = a;
                    }}
                />,
            );

            await waitFor(() => {
                expect(latest?.loading).toBe(false);
            });
            expect(latest?.errors?.message).toBe('Invalid JSON response');
            expect(latest?.data).toEqual([]);
        } finally {
            errSpy.mockRestore();
        }
    });

    it('uses default GET method', async () => {
        fetchMock.mockResolvedValue(
            mockJsonResponse(
                true,
                200,
                JSON.stringify(previewsPage([], null)),
            ),
        );

        let latest: Args | undefined;
        render(
            <TestHost
                queryParams={new RopewikiRegionPreviewsParams(10)}
                onRender={(a) => {
                    latest = a;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        const init = fetchMock.mock.calls[0]![1] as RequestInit;
        expect(init.method).toBe(Method.GET);
    });
});
