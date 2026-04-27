/** @jest-environment jsdom */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { act, render, waitFor, cleanup } from '@testing-library/react';
import type { RouteGeoJsonFeature } from '../../src/models/routes/route';
import { RouteType } from '../../src/models/routes/routeType';
import '../../src/models/api/results/registerAllResultParsers';
import { RoutesParams } from '../../src/models/api/params/routesParams';
import { RopeGeoPaginationHttpRequest } from '../../src/components/RopeGeoPaginationHttpRequest';
import { Service } from '../../src/components/RopeGeoHttpRequest';
import { mockJsonResponse, requestUrl } from '../helpers/jestFetch';

const BASE = 'https://api.webscraper.ropegeo.com';

function routeFeature(
    page: number,
    index: number,
): Record<string, unknown> {
    const n = page * 10 + index;
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [n, -n] },
        properties: {
            id: `00000000-0000-4000-8000-${String(1_000_000 + n).slice(1)}`,
            name: `p${page}-i${index}`,
            type: RouteType.Canyon,
        },
    };
}

function routesPageJson(
    page: number,
    total: number,
    count: number,
): Record<string, unknown> {
    const results: Record<string, unknown>[] = [];
    for (let i = 0; i < count; i++) {
        results.push(routeFeature(page, i));
    }
    return {
        resultType: 'route',
        page,
        total,
        results,
    };
}

function parsePageFromUrl(url: string): number {
    const u = new URL(url);
    const p = u.searchParams.get('page');
    return p != null ? Number(p) : 1;
}

function jsonOk(body: Record<string, unknown>): Response {
    return mockJsonResponse(true, 200, JSON.stringify(body));
}

function jsonFail(status: number, body: string): Response {
    return mockJsonResponse(false, status, body);
}

type Args = {
    loading: boolean;
    refreshing: boolean;
    received: number;
    total: number | null;
    data: RouteGeoJsonFeature[] | null;
    errors: Error | null;
    timeoutCountdown: number | null;
    reload: () => void;
};

function TestHost(props: {
    queryParams: RoutesParams;
    batchSize?: number;
    onRender: (a: Args) => void;
}) {
    return (
        <RopeGeoPaginationHttpRequest<RouteGeoJsonFeature>
            service={Service.WEBSCRAPER}
            path="/routes"
            queryParams={props.queryParams}
            batchSize={props.batchSize}
        >
            {(args) => {
                props.onRender(args as Args);
                return null;
            }}
        </RopeGeoPaginationHttpRequest>
    );
}

describe('RopeGeoPaginationHttpRequest', () => {
    const fetchMock = jest.fn<typeof fetch>();

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as typeof fetch;
    });

    afterEach(() => {
        cleanup();
    });

    it('loads a single short page and sets data in API order', async () => {
        const params = new RoutesParams({ region: null, limit: 10, page: 1 });
        fetchMock.mockImplementation((input) => {
            const url = requestUrl(input);
            expect(url.startsWith(BASE)).toBe(true);
            const page = parsePageFromUrl(url);
            expect(page).toBe(1);
            return Promise.resolve(jsonOk(routesPageJson(1, 3, 3)));
        });

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
        expect(latest?.errors).toBeNull();
        expect(latest?.total).toBe(3);
        expect(latest?.received).toBe(3);
        expect(latest?.data?.map((f) => f.properties.name)).toEqual([
            'p1-i0',
            'p1-i1',
            'p1-i2',
        ]);
    });

    it('reload resets progress and refetches from page 1', async () => {
        const params = new RoutesParams({ region: null, limit: 10, page: 1 });
        const pageJson = routesPageJson(1, 2, 2);
        fetchMock
            .mockResolvedValueOnce(jsonOk(pageJson))
            .mockImplementationOnce(() =>
                new Promise((resolve) => {
                    setTimeout(() => resolve(jsonOk(pageJson)), 40);
                }),
            );

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

        await act(async () => {
            latest!.reload();
        });

        await waitFor(() => {
            expect(latest?.loading).toBe(true);
        });
        expect(latest?.errors).toBeNull();
        expect(latest?.received).toBe(0);
        expect(latest?.total).toBeNull();
        expect(latest?.data).toBeNull();

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('concatenates multiple pages in ascending page order (not completion order)', async () => {
        const params = new RoutesParams({ region: null, limit: 2, page: 1 });
        fetchMock.mockImplementation((input) => {
            const url = requestUrl(input);
            const page = parsePageFromUrl(url);
            if (page === 1) {
                return Promise.resolve(jsonOk(routesPageJson(1, 5, 2)));
            }
            if (page === 2) {
                return new Promise((resolve) => {
                    setTimeout(
                        () => resolve(jsonOk(routesPageJson(2, 5, 2))),
                        40,
                    );
                });
            }
            if (page === 3) {
                return Promise.resolve(jsonOk(routesPageJson(3, 5, 1)));
            }
            return Promise.resolve(jsonFail(404, 'bad page'));
        });

        let latest: Args | undefined;
        render(
            <TestHost
                queryParams={params}
                batchSize={2}
                onRender={(a) => {
                    latest = a;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(latest?.data?.map((f) => f.properties.name)).toEqual([
            'p1-i0',
            'p1-i1',
            'p2-i0',
            'p2-i1',
            'p3-i0',
        ]);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('fetches remaining pages in batches of batchSize', async () => {
        const params = new RoutesParams({ region: null, limit: 2, page: 1 });
        fetchMock.mockImplementation((input) => {
            const url = requestUrl(input);
            const page = parsePageFromUrl(url);
            if (page === 1) return Promise.resolve(jsonOk(routesPageJson(1, 9, 2)));
            if (page >= 2 && page <= 5) {
                const count = page === 5 ? 1 : 2;
                return Promise.resolve(jsonOk(routesPageJson(page, 9, count)));
            }
            return Promise.resolve(jsonFail(404, 'bad'));
        });

        let latest: Args | undefined;
        render(
            <TestHost
                queryParams={params}
                batchSize={2}
                onRender={(a) => {
                    latest = a;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(fetchMock).toHaveBeenCalledTimes(5);
        expect(latest?.received).toBe(9);
        expect(latest?.data).toHaveLength(9);
    });

    it('sets errors and clears data when a later page returns HTTP error', async () => {
        const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const params = new RoutesParams({ region: null, limit: 2, page: 1 });
            fetchMock.mockImplementation((input) => {
                const url = requestUrl(input);
                const page = parsePageFromUrl(url);
                if (page === 1)
                    return Promise.resolve(jsonOk(routesPageJson(1, 6, 2)));
                if (page === 2) return Promise.resolve(jsonFail(500, 'nope'));
                return Promise.resolve(jsonOk(routesPageJson(page, 6, 2)));
            });

            let latest: Args | undefined;
            render(
                <TestHost
                    queryParams={params}
                    batchSize={3}
                    onRender={(a) => {
                        latest = a;
                    }}
                />,
            );

            await waitFor(() => {
                expect(latest?.loading).toBe(false);
            });
            expect(latest?.data).toBeNull();
            expect(latest?.errors?.message).toBe("500 nope");
        } finally {
            errSpy.mockRestore();
        }
    });

    it('defaults batchSize floor to 1 when batchSize is 0', async () => {
        const params = new RoutesParams({ region: null, limit: 5, page: 1 });
        fetchMock.mockImplementation((input) => {
            const url = requestUrl(input);
            const page = parsePageFromUrl(url);
            if (page === 1) return Promise.resolve(jsonOk(routesPageJson(1, 8, 5)));
            if (page === 2) return Promise.resolve(jsonOk(routesPageJson(2, 8, 3)));
            return Promise.resolve(jsonFail(404, 'bad'));
        });

        let latest: Args | undefined;
        render(
            <TestHost
                queryParams={params}
                batchSize={0}
                onRender={(a) => {
                    latest = a;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(latest?.data).toHaveLength(8);
    });
});
