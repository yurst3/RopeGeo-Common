/** @jest-environment jsdom */

import { TextDecoder, TextEncoder } from 'util';
import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { render, waitFor, cleanup, act } from '@testing-library/react';
import { RegionPreviewsCursor } from '../../src/models/api/params/cursors/regionPreviewsCursor';
import { RopewikiRegionPreviewsParams } from '../../src/models/api/params/ropewikiRegionPreviewsParams';
import '../../src/models/api/results/ropewikiRegionPreviewsResult';
import { CursorPaginationResultType } from '../../src/models/api/results/cursorPaginationResults';
import { RopeGeoPagedDataLoader } from '../../src/components/RopeGeoPagedDataLoader';
import { Method, Service } from '../../src/components/RopeGeoDataLoader';
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
    loadingNextPage: boolean;
    data: unknown[] | null;
    errors: Error | null;
    loadNextPage: () => void;
    morePages: boolean;
    timeoutCountdown: number | null;
    reload: () => void;
};

function TestHost(props: {
    queryParams: RopewikiRegionPreviewsParams;
    onRender: (a: Args) => void;
}) {
    return (
        <RopeGeoPagedDataLoader
            service={Service.WEBSCRAPER}
            onlinePath="/ropewiki/region/:id/previews"
            onlinePathParams={{ id: 'region-uuid-0001' }}
            queryParams={props.queryParams}
        >
            {(args) => {
                props.onRender(args);
                return null;
            }}
        </RopeGeoPagedDataLoader>
    );
}

describe('RopeGeoPagedDataLoader', () => {
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

    it('initial fetch fills data; morePages false when nextCursor is null', async () => {
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
            expect(latest?.data).toHaveLength(1);
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = requestUrl(fetchMock.mock.calls[0]![0]);
        expect(url.startsWith(BASE)).toBe(true);
        expect(url).toContain('/ropewiki/region/region-uuid-0001/previews');
        expect(url).toContain('limit=10');
        expect(url.includes('cursor=')).toBe(false);
        expect(latest?.errors).toBeNull();
        expect(latest?.morePages).toBe(false);
    });

    it('reload clears data and refetches the first page', async () => {
        fetchMock
            .mockResolvedValueOnce(
                mockJsonResponse(
                    true,
                    200,
                    JSON.stringify(previewsPage([regionPreviewItem('r1', 'One')], null)),
                ),
            )
            .mockResolvedValueOnce(
                mockJsonResponse(
                    true,
                    200,
                    JSON.stringify(previewsPage([regionPreviewItem('r2', 'Two')], null)),
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
            expect((latest!.data as { id: string }[])[0]!.id).toBe('r1');
        });

        act(() => {
            latest?.reload();
        });

        await waitFor(() => {
            expect(latest?.data).toBeNull();
        });

        await waitFor(() => {
            expect((latest!.data as { id: string }[])[0]!.id).toBe('r2');
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
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
            expect(latest?.data).toHaveLength(1);
        });
    });

    it('morePages true when nextCursor is set; loadNextPage appends and clears morePages', async () => {
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
            expect(latest?.morePages).toBe(true);
        });
        expect(latest?.data).toHaveLength(1);

        await act(async () => {
            latest?.loadNextPage();
        });

        await waitFor(() => {
            expect(latest?.loadingNextPage).toBe(false);
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const secondUrl = requestUrl(fetchMock.mock.calls[1]![0]);
        expect(secondUrl).toContain('cursor=');
        expect(latest?.data).toHaveLength(2);
        const rows = latest!.data!;
        expect((rows[0] as { name: string }).name).toBe('First');
        expect((rows[1] as { name: string }).name).toBe('Second');
        expect(latest?.morePages).toBe(false);
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
            expect(latest?.errors?.message).toBe('503 down');
        });
        expect(latest?.data).toBeNull();
    });

    it('loadNextPage HTTP error does not clear existing data', async () => {
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
            expect(latest?.data).toHaveLength(1);
        });

        await act(async () => {
            latest?.loadNextPage();
        });

        await waitFor(() => {
            expect(latest?.loadingNextPage).toBe(false);
        });
        expect(latest?.data).toHaveLength(1);
        expect(((latest!.data as unknown[])[0] as { name: string }).name).toBe('Kept');
        expect(latest?.morePages).toBe(false);
        expect(latest?.errors?.message).toBe('500 fail');
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
                expect(latest?.errors?.message).toBe('Invalid JSON response');
            });
            expect(latest?.data).toBeNull();
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
            expect(latest?.data).toEqual([]);
        });
        const init = fetchMock.mock.calls[0]![1] as RequestInit;
        expect(init.method).toBe(Method.GET);
    });
});
