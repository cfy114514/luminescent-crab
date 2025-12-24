
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Concurrency Helper (Async Pool)
export const asyncPool = async (poolLimit, iterable, iteratorFn) => {
    const ret = [];
    const executing = [];
    for (const item of iterable) {
        const p = Promise.resolve().then(() => iteratorFn(item, iterable));
        ret.push(p);
        if (poolLimit <= iterable.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= poolLimit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(ret);
};
