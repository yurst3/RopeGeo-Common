import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { downloadHttpRequest } from '../../../src/download/helpers/downloadHttpRequest';

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

describe('downloadHttpRequest', () => {
    const originalFetch = globalThis.fetch;
    const mockGlobalFetch = jest.fn<typeof fetch>();

    beforeEach(() => {
        globalThis.fetch = mockGlobalFetch as typeof fetch;
    });

    afterEach(() => {
        mockGlobalFetch.mockReset();
        globalThis.fetch = originalFetch;
    });

    it('sends request with default headers when fetch succeeds', async () => {
        mockGlobalFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({}),
        } as unknown as FetchResponse);

        await downloadHttpRequest('https://example.com/');

        expect(mockGlobalFetch).toHaveBeenCalledTimes(1);
        const [url, init] = mockGlobalFetch.mock.calls[0]!;
        expect(url).toBe('https://example.com/');
        const headers = (init as RequestInit).headers as Record<string, string>;
        expect(headers['Accept']).toBe('application/json, text/html, application/xml, */*');
        expect(headers['Accept-Language']).toBe('en-US,en;q=0.9');
        expect((init as RequestInit).signal).toBeDefined();
    });

    it('throws when response is not OK (4xx)', async () => {
        mockGlobalFetch.mockResolvedValue({
            ok: false,
            status: 403,
            statusText: 'Forbidden',
            url: 'https://example.com/',
            headers: { get: () => null },
            clone: () => ({ text: () => Promise.resolve('Forbidden') }),
        } as unknown as FetchResponse);

        const err = await downloadHttpRequest('https://example.com/').catch((e) => e);
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('downloadHttpRequest non-OK: status=403');
    });

    it('throws when response is not OK (5xx)', async () => {
        mockGlobalFetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            url: 'https://example.com/',
            headers: { get: () => null },
            clone: () => ({ text: () => Promise.resolve('error') }),
        } as unknown as FetchResponse);

        const err = await downloadHttpRequest('https://example.com/').catch((e) => e);
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('downloadHttpRequest non-OK: status=500');
    });

    it('throws when fetch fails', async () => {
        mockGlobalFetch.mockRejectedValue(new Error('network failure'));

        const err = await downloadHttpRequest('https://example.com/').catch((e) => e);
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('downloadHttpRequest failed:');
    });

    it('throws when abort signal is already aborted', async () => {
        const controller = new AbortController();
        controller.abort(new Error('cancelled'));

        const err = await downloadHttpRequest('https://example.com/', controller.signal).catch(
            (e) => e,
        );
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toContain('downloadHttpRequest aborted:');
        expect(mockGlobalFetch).not.toHaveBeenCalled();
    });
});
