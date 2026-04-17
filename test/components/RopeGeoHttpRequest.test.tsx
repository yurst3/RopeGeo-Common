/** @jest-environment jsdom */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { act, render, waitFor, cleanup } from '@testing-library/react';
import { ResultType } from '../../src/models/api/results/result';
import '../../src/models/api/results/ropewikiPageViewResult';
import { RopewikiPageView } from '../../src/models/api/endpoints/ropewikiPageView';
import {
    Method,
    RopeGeoHttpRequest,
    Service,
} from '../../src/components/RopeGeoHttpRequest';
import { NETWORK_REQUEST_TIMED_OUT_MESSAGE } from '../../src/helpers/networkRequestPolicy';
import { mockJsonResponse, requestUrl } from '../helpers/jestFetch';

const BASE = 'https://api.webscraper.ropegeo.com';

function pageViewResponseJson(): Record<string, unknown> {
    return {
        resultType: ResultType.RopewikiPageView,
        result: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            routeType: 'Canyon',
            pageViewType: 'ropewiki',
            fetchType: 'online',
            name: 'Test Page',
            aka: [],
            url: 'https://ropewiki.com/page',
            quality: 4,
            userVotes: 10,
            regions: [{ id: 'r1', name: 'Region' }],
            difficulty: { technical: null, water: null, time: null, additionalRisk: null },
            permit: null,
            rappelCount: null,
            jumps: null,
            vehicle: null,
            rappelLongest: null,
            shuttleTime: null,
            overallLength: null,
            descentLength: null,
            exitLength: null,
            approachLength: null,
            overallTime: null,
            approachTime: null,
            descentTime: null,
            exitTime: null,
            approachElevGain: null,
            descentElevGain: null,
            exitElevGain: null,
            months: [],
            latestRevisionDate: '2024-01-01T00:00:00.000Z',
            bannerImage: null,
            betaSections: [],
            miniMap: null,
            coordinates: null,
        },
    };
}

type Args<T> = {
    loading: boolean;
    data: T | null;
    errors: Error | null;
    timeoutCountdown: number | null;
};

function TestHost<T>(props: {
    method?: Method;
    path: string;
    pathParams?: Record<string, string>;
    queryParams?: Record<string, string | number | boolean | undefined>;
    body?: object;
    timeoutAfterSeconds?: number;
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
            timeoutAfterSeconds={props.timeoutAfterSeconds}
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
            mockJsonResponse(true, 200, JSON.stringify(pageViewResponseJson())),
        );

        let latest: Args<RopewikiPageView> | undefined;
        render(
            <TestHost<RopewikiPageView>
                path="/ropewiki/page/:id"
                pathParams={{ id: 'abc-uuid-here-0001' }}
                onRender={(a) => {
                    latest = a as Args<RopewikiPageView>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = requestUrl(fetchMock.mock.calls[0]![0]);
        expect(url.startsWith(BASE)).toBe(true);
        expect(url).toContain('/ropewiki/page/abc-uuid-here-0001');
        expect(latest?.errors).toBeNull();
        expect(latest?.data).toBeInstanceOf(RopewikiPageView);
        expect(latest?.data?.name).toBe('Test Page');
    });

    it('buildUrl adds query params (skips empty and undefined)', async () => {
        fetchMock.mockResolvedValue(
            mockJsonResponse(true, 200, JSON.stringify(pageViewResponseJson())),
        );

        let latest: Args<RopewikiPageView> | undefined;
        render(
            <TestHost<RopewikiPageView>
                path="/ropewiki/page/:id"
                pathParams={{ id: 'rid' }}
                queryParams={{ a: '1', b: '', c: undefined, flag: true }}
                onRender={(a) => {
                    latest = a as Args<RopewikiPageView>;
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

        let latest: Args<RopewikiPageView> | undefined;
        render(
            <TestHost<RopewikiPageView>
                path="/x"
                onRender={(a) => {
                    latest = a as Args<RopewikiPageView>;
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

        let latest: Args<RopewikiPageView> | undefined;
        render(
            <TestHost<RopewikiPageView>
                path="/x"
                onRender={(a) => {
                    latest = a as Args<RopewikiPageView>;
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

            let latest: Args<RopewikiPageView> | undefined;
            render(
                <TestHost<RopewikiPageView>
                    path="/x"
                    onRender={(a) => {
                        latest = a as Args<RopewikiPageView>;
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
            mockJsonResponse(true, 200, JSON.stringify(pageViewResponseJson())),
        );

        let latest: Args<RopewikiPageView> | undefined;
        render(
            <TestHost<RopewikiPageView>
                method={Method.POST}
                path="/ropewiki/page/:id"
                pathParams={{ id: 'r1' }}
                body={{ foo: 'bar' }}
                onRender={(a) => {
                    latest = a as Args<RopewikiPageView>;
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
            mockJsonResponse(true, 200, JSON.stringify(pageViewResponseJson())),
        );

        let latest: Args<RopewikiPageView> | undefined;
        render(
            <TestHost<RopewikiPageView>
                method={Method.GET}
                path="/x"
                body={{ skip: true }}
                onRender={(a) => {
                    latest = a as Args<RopewikiPageView>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.loading).toBe(false);
        });
        const init = fetchMock.mock.calls[0]![1] as RequestInit;
        expect(init.body).toBeUndefined();
    });

    it('emits timeoutCountdown from full default window then times out', async () => {
        jest.useFakeTimers();
        fetchMock.mockImplementation((_input, init?: RequestInit) => {
            return new Promise<Response>((_resolve, reject) => {
                const signal = init?.signal;
                if (signal?.aborted) {
                    reject(new DOMException('Aborted', 'AbortError'));
                    return;
                }
                const onAbort = () => {
                    reject(new DOMException('Aborted', 'AbortError'));
                };
                signal?.addEventListener('abort', onAbort, { once: true });
            });
        });

        let latest: Args<RopewikiPageView> | undefined;
        render(
            <TestHost<RopewikiPageView>
                path="/ropewiki/page/:id"
                pathParams={{ id: 'slow' }}
                onRender={(a) => {
                    latest = a as Args<RopewikiPageView>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.timeoutCountdown).toBe(30);
        });

        await act(async () => {
            await jest.advanceTimersByTimeAsync(1000);
        });
        expect(latest?.timeoutCountdown).toBe(29);

        await act(async () => {
            await jest.advanceTimersByTimeAsync(29_000);
            await Promise.resolve();
        });
        await waitFor(() => {
            expect(latest?.loading).toBe(false);
            expect(latest?.errors?.message).toBe(NETWORK_REQUEST_TIMED_OUT_MESSAGE);
            expect(latest?.timeoutCountdown).toBeNull();
        });

        jest.useRealTimers();
    });

    it('honors timeoutAfterSeconds for deadline and countdown scale', async () => {
        jest.useFakeTimers();
        fetchMock.mockImplementation((_input, init?: RequestInit) => {
            return new Promise<Response>((_resolve, reject) => {
                const signal = init?.signal;
                if (signal?.aborted) {
                    reject(new DOMException('Aborted', 'AbortError'));
                    return;
                }
                signal?.addEventListener(
                    'abort',
                    () => {
                        reject(new DOMException('Aborted', 'AbortError'));
                    },
                    { once: true },
                );
            });
        });

        let latest: Args<RopewikiPageView> | undefined;
        render(
            <TestHost<RopewikiPageView>
                path="/ropewiki/page/:id"
                pathParams={{ id: 't5' }}
                timeoutAfterSeconds={5}
                onRender={(a) => {
                    latest = a as Args<RopewikiPageView>;
                }}
            />,
        );

        await waitFor(() => {
            expect(latest?.timeoutCountdown).toBe(5);
        });

        await act(async () => {
            await jest.advanceTimersByTimeAsync(5_000);
            await Promise.resolve();
        });
        await waitFor(() => {
            expect(latest?.loading).toBe(false);
            expect(latest?.errors?.message).toBe(NETWORK_REQUEST_TIMED_OUT_MESSAGE);
        });

        jest.useRealTimers();
    });
});
