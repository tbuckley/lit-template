export type SubscribeFn<T> = (state: T) => void;
export type UnsubscribeFn = () => void;
export type ApplyFn<T> = (state: T) => T;
export interface Store<T> {
    get(): Readonly<T>;
    subscribe(fn: SubscribeFn<T>): UnsubscribeFn;
    apply(fn: ApplyFn<T>): Promise<void>;
}

export function createStore<T>(initialState: T): Store<T> {
    let state: T = initialState;
    let subscribers: SubscribeFn<T>[] = [];

    let waitingForTick: null | Promise<void> = null;
    async function triggerSubscribersOnNextTick(): Promise<void> {
        if(waitingForTick) {return waitingForTick;}
        waitingForTick = Promise.resolve().then(() => {
            waitingForTick = null;
            subscribers.forEach(fn => fn(state));
        });
        return waitingForTick;
    }

    let isApplying = false;

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
        async apply(fn: ApplyFn<T>): Promise<void> {
            console.assert(!isApplying, "cannot apply while already applying");
            isApplying = true;
            state = fn(state);
            isApplying = false;
            return triggerSubscribersOnNextTick();
        }
    }
}

export type SelectorCache<T> =
    | {type: "none"}
    | {type: "cache", args: any[], result: T};

export type ArgFn<S, A> = (state: S) => A;
export function createSelector<S, T, A>(args: [ArgFn<S, A>], fn: (a: A) => T): (state: S) => T;
export function createSelector<S, T, A, B>(args: [ArgFn<S, A>, ArgFn<S,B>], fn: (a: A, b: B) => T): (state: S) => T;
export function createSelector<S, T, A, B, C>(args: [ArgFn<S, A>, ArgFn<S,B>, ArgFn<S,C>], fn: (a: A, b: B, c: C) => T): (state: S) => T;
export function createSelector<S, T>(args: ArgFn<S,any>[], fn: (...args: any[]) => T): (state: S) => T {
    let cache: SelectorCache<T> = {type: "none"};
    return function(state: S): T {
        const newArgs: any[] = args.map(fn => fn(state));
        if(cache.type === "cache" && argsMatch(cache.args, newArgs)) {
            return cache.result;
        }
        const result = fn(...newArgs);
        cache = {type: "cache", args: newArgs, result: result};
        return result;
    };
}

function argsMatch(cache: any[], latest: any[]): boolean {
    if(cache.length !== latest.length) {
        throw new Error("cannot change number of args!");
    }
    for(let i = 0; i < cache.length; i++) {
        if(cache[i] !== latest[i]) {
            return false;
        }
    }
    return true;
}

export type Constructor<T> = new(...args: any[]) => T;
interface CustomElement {
    connectedCallback?(): void;
    disconnectedCallback?(): void;
    readonly isConnected: boolean;
}

export const connect =
    <S>(store: Store<S>) =>
    <T extends Constructor<CustomElement>>(baseElement: T) =>
    class extends baseElement {
        _storeUnsubscribe!: UnsubscribeFn;

        connectedCallback() {
            if(super.connectedCallback) {
                super.connectedCallback();
            }

            this._storeUnsubscribe = store.subscribe((state) => this.stateChanged(state));
            this.stateChanged(store.get());
        }

        disconnectedCallback() {
            this._storeUnsubscribe();

            if(super.disconnectedCallback) {
                super.disconnectedCallback();
            }
        }

        stateChanged(_state: S) {}
    }
