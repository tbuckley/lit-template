export type SubscribeFn<T> = (state: T) => void;
export type UnsubscribeFn = () => void;
export type ApplyFn<T> = (state: T) => T;

export function createStore<T>(initialState: T) {
    let state: T = initialState;
    let subscribers: SubscribeFn<T>[] = [];
    let applying = false;
    return {
        get(): Readonly<T> {
            return state;
        },
        subscribe(fn: SubscribeFn<T>): UnsubscribeFn {
            subscribers.push(fn);
            fn(state);
            return function() {
                let index = subscribers.indexOf(fn);
                if(index === -1) {
                    throw new Error("cannot unsubscribe multiple times");
                }
                subscribers.splice(index, 1);
            };
        },
        apply(fn: ApplyFn<T>) {
            console.assert(!applying, "cannot call store.apply() within another call");
            applying = true;
            state = fn(state);
            subscribers.forEach(fn => fn(state));
            applying = false;
        }
    }
}