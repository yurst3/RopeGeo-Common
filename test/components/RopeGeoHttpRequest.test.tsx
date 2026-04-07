/** @jest-environment jsdom */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, waitFor, cleanup, act } from '@testing-library/react';
import { Bounds } from '../../src/models/minimap/bounds';
import { ResultType } from '../../src/models/api/results/result';
import '../../src/models/api/results/ropewikiRegionBoundsResult';
import {
    Method,
    RopeGeoHttpRequest,
    Service,
} from '../../src/components/RopeGeoHttpRequest';
import { mockJsonResponse, requestUrl } from '../helpers/jestFetch';

const BASE = 'https://api.webscraper.ropegeo.com';

function boundsResponseJson(): Record<string, unknown> {
    return {
        resultType: ResultType.RopewikiRegionBounds,
        result: { north: 41, south: 40, east: -110, west: -112 },
    };
}

type Args<T> = {
    loading: boolean;
    data: T | null;
    errors: Error | null;
};

function TestHost<T>(props: {
    method?: Method;
    path: string;
    pathParams?: Record<string, string>;
    queryParams?: Record<string, string | number | boolean | undefined>;
    body?: object;
    onRender: (a: Args<T>) => void;
}) {
    return (
        <RopeGeoHttpRequest<T>
            service={Service.WEBSCRAPER}
            method={props.method ?? Method.GET}
            path={props.path}
            pathParams={props.pathParams}
            queryParams={props.queryParams}
            body={props.body}
        >
            {(args) => {
                props.onRender(args);
                return null;
            }}
        </RopeGeoHttpRequest>
    );
}

describe('RopeGeoHttpRequest', () => {
    const fetchMock = jest.fn<typeof fetch>();

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as typeof fetch;
    });

    afterEach(() => {
        cleanup();
    });

    it('GET: parses Result body and exposes result as data', async () => {
        fetchMock.mockResolvedValue(
            mockJsonResponse(true, 200, JSON.stringify(boundsResponseJson())),
        );

        let latest: Args<Bounds> | undefined;
        render(
            <TestHost<Bounds>
                path="/ropewiki/region/:id/bounds"
                pathParams={{ id: 'abc-uuid-here-0001' }}
                onRender={(a) => {
                    latest = a as Args<Bounds>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = requestUrl(fetchMock.mock.calls[0]![0]);
        expect(url.startsWith(BASE)).toBe(true);
        expect(url).toContain('/ropewiki/region/abc-uuid-here-0001/bounds');
        expect(latest?.errors).toBeNull();
        expect(latest?.data).toBeInstanceOf(Bounds);
        expect(latest?.data?.north).toBe(41);
    });

    it('buildUrl adds query params (skips empty and undefined)', async () => {
        fetchMock.mockResolvedValue(
            mockJsonResponse(true, 200, JSON.stringify(boundsResponseJson())),
        );

        let latest: Args<Bounds> | undefined;
        render(
            <TestHost<Bounds>
                path="/ropewiki/region/:id/bounds"
                pathParams={{ id: 'rid' }}
                queryParams={{ a: '1', b: '', c: undefined, flag: true }}
                onRender={(a) => {
                    latest = a as Args<Bounds>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        const url = requestUrl(fetchMock.mock.calls[0]![0]);
        const u = new URL(url);
        expect(u.searchParams.get('a')).toBe('1');
        expect(u.searchParams.get('flag')).toBe('true');
        expect(u.searchParams.has('b')).toBe(false);
        expect(u.searchParams.has('c')).toBe(false);
    });

    it('sets errors on non-OK HTTP', async () => {
        fetchMock.mockResolvedValue(mockJsonResponse(false, 404, 'missing'));

        let latest: Args<Bounds> | undefined;
        render(
            <TestHost<Bounds>
                path="/x"
                onRender={(a) => {
                    latest = a as Args<Bounds>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(latest?.data).toBeNull();
        expect(latest?.errors?.message).toMatch(/HTTP 404/);
    });

    it('empty 200 body leaves data null without error', async () => {
        fetchMock.mockResolvedValue(mockJsonResponse(true, 200, ''));

        let latest: Args<Bounds> | undefined;
        render(
            <TestHost<Bounds>
                path="/x"
                onRender={(a) => {
                    latest = a as Args<Bounds>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(latest?.data).toBeNull();
        expect(latest?.errors).toBeNull();
    });

    it('invalid JSON sets errors and logs', async () => {
        const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            fetchMock.mockResolvedValue(mockJsonResponse(true, 200, 'not-json'));

            let latest: Args<Bounds> | undefined;
            render(
                <TestHost<Bounds>
                    path="/x"
                    onRender={(a) => {
                        latest = a as Args<Bounds>;
                    }}
                />,
            );

            await waitFor(() => {
                expect(latest?.loading).toBe(false);
            });
            expect(latest?.data).toBeNull();
            expect(latest?.errors).not.toBeNull();
        } finally {
            errSpy.mockRestore();
        }
    });

    it('POST sends JSON body', async () => {
        fetchMock.mockResolvedValue(
            mockJsonResponse(true, 200, JSON.stringify(boundsResponseJson())),
        );

        let latest: Args<Bounds> | undefined;
        render(
            <TestHost<Bounds>
                method={Method.POST}
                path="/ropewiki/region/:id/bounds"
                pathParams={{ id: 'r1' }}
                body={{ foo: 'bar' }}
                onRender={(a) => {
                    latest = a as Args<Bounds>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        const init = fetchMock.mock.calls[0]![1] as RequestInit;
        expect(init.method).toBe('POST');
        expect(init.body).toBe(JSON.stringify({ foo: 'bar' }));
    });

    it('GET does not attach body even when body prop is set', async () => {
        fetchMock.mockResolvedValue(
            mockJsonResponse(true, 200, JSON.stringify(boundsResponseJson())),
        );

        let latest: Args<Bounds> | undefined;
        render(
            <TestHost<Bounds>
                method={Method.GET}
                path="/x"
                body={{ skip: true }}
                onRender={(a) => {
                    latest = a as Args<Bounds>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        const init = fetchMock.mock.calls[0]![1] as RequestInit;
        expect(init.body).toBeUndefined();
    });
});
