export class AbortError extends Error {
    constructor(...args) {
        super(...args);
    }
}

class DeferredBuilder {
    constructor(abortSignal) {
        this.def = new _deferred(abortSignal);
    }

    withAwaitClick(...clickables) {
        this.def.awaitClick(...clickables);
        return this;
    }

    withAwaitClickAndReturn(...items) {
        this.def.awaitClickAndReturn(...items);
        return this;
    }

    withAwaitKey(target, key) {
        this.def.awaitKey(target, key);
        return this;
    }

    withOnFinish(task) {
        this.def.onFinish(task);
        return this;
    }

    build() {
        return this.def.promise;
    }
}

class _deferred {
    constructor(externalAbortSignal) {
        this.aborter = new AbortController();
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });

        externalAbortSignal.addEventListener("abort", () => {
            this.reject(new AbortError("Global abort was triggered"));
        }, {once: true});
    }

    onFinish(task) {
        this.aborter.signal.addEventListener("abort", task, {once: true});
    }

    resolve(result) {
        this.aborter.abort();
        this._resolve(result);
    }

    reject(result) {
        this.aborter.abort();
        this._reject(result);
    }

    awaitClick(...buttons) {
        buttons.forEach(button => {
            button.addEventListener(
                "click", 
                () => this.resolve(button), 
                {signal: this.aborter.signal}
            )
        });
    }

    awaitClickAndReturn(...items) {
        items.forEach(item => {
            item.button.addEventListener(
                "click", 
                () => this.resolve(item), 
                {signal: this.aborter.signal}
            )
        });
    }

    awaitKey(target, key) {
        target.addEventListener(
            "keydown", 
            e => { if (e.key === key) this.resolve(key); }, 
            {signal: this.aborter.signal}
        );
    }
}

export function Deferred(abortSignal) {
    return new DeferredBuilder(abortSignal);
}

export function awaitClick(abortSignal, ...clickables) {
    return Deferred(abortSignal).withAwaitClick(...clickables).build();
}

export function awaitClickAndReturn(abortSignal, ...items) {
    return Deferred(abortSignal).withAwaitClickAndReturn(...items).build();
}