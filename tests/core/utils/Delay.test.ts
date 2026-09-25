import { expect } from '@jest/globals';
import { delay } from '../../../src/core/utils/Delay';

describe('Delay utility function', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => {
        jest.clearAllTimers();
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it.each([
        ['zero', 0, 0],
        ['large', 999999, 999999],
        ['NaN', NaN, 0],
        ['null', null, 0],
        ['undefined', undefined, 0],
        ['negative', -100, -100],
        ['Infinity', Infinity, Infinity],
        ['non-numeric string', 'not a number', 0],
        ['numeric string', '100', '100'],
    ])('passes the expected timeout for %s', async (_label, input, expected) => {
        const timer = jest.spyOn(global, 'setTimeout');
        const pending = delay(input as any);
        expect(timer).toHaveBeenCalledTimes(1);
        expect(timer).toHaveBeenCalledWith(expect.any(Function), expected);
        await jest.runAllTimersAsync();
        await expect(pending).resolves.toBeUndefined();
    });

    it('uses zero when no argument is provided', async () => {
        const timer = jest.spyOn(global, 'setTimeout');
        const pending = delay();
        expect(timer).toHaveBeenCalledWith(expect.any(Function), 0);
        await jest.runAllTimersAsync();
        await pending;
    });

    it('does not resolve before the requested delay', async () => {
        let resolved = false;
        const pending = delay(100).then(() => { resolved = true; });
        await jest.advanceTimersByTimeAsync(99);
        expect(resolved).toBe(false);
        await jest.advanceTimersByTimeAsync(1);
        await pending;
        expect(resolved).toBe(true);
    });

    it('returns a Promise', async () => {
        const pending = delay(10);
        expect(pending).toBeInstanceOf(Promise);
        await jest.runAllTimersAsync();
        await pending;
    });

    it('is thenable', async () => {
        const pending = delay(10).then(() => 'resolved');
        await jest.runAllTimersAsync();
        await expect(pending).resolves.toBe('resolved');
    });

    it('works with async/await', async () => {
        let executed = false;
        const pending = (async () => { await delay(10); executed = true; })();
        expect(executed).toBe(false);
        await jest.runAllTimersAsync();
        await pending;
        expect(executed).toBe(true);
    });

    it('works in Promise chains', async () => {
        const pending = Promise.resolve().then(() => delay(10)).then(() => 'done');
        await jest.runAllTimersAsync();
        await expect(pending).resolves.toBe('done');
    });

    it('handles concurrent delays independently', async () => {
        const completed: number[] = [];
        const pending = Promise.all([50, 100, 75].map(ms => delay(ms).then(() => completed.push(ms))));
        await jest.advanceTimersByTimeAsync(49);
        expect(completed).toEqual([]);
        await jest.advanceTimersByTimeAsync(1);
        expect(completed).toEqual([50]);
        await jest.advanceTimersByTimeAsync(25);
        expect(completed).toEqual([50, 75]);
        await jest.advanceTimersByTimeAsync(25);
        await pending;
        expect(completed).toEqual([50, 75, 100]);
    });

    it('adds sequential delays', async () => {
        let completed = 0;
        const pending = (async () => {
            for (let i = 0; i < 3; i++) { await delay(50); completed++; }
        })();
        for (let i = 0; i < 3; i++) {
            await jest.advanceTimersByTimeAsync(49);
            expect(completed).toBe(i);
            await jest.advanceTimersByTimeAsync(1);
            expect(completed).toBe(i + 1);
        }
        await pending;
    });
});