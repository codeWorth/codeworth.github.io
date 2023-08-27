export class AbortError extends Error {
    constructor(...args) {
        super(...args);
    }
}

/** @typedef {addEventListener: Function} Listener */

class DeferredBuilder {
    /**
     * @param {AbortSignal} abortSignal 
     */
    constructor(abortSignal) {
        this.def = new _deferred(abortSignal);
    }

    /**
     * @param {...Listener} clickables 
     * @returns {DeferredBuilder}
     */
    withAwaitClick(...clickables) {
        this.def.awaitClick(...clickables);
        return this;
    }

    /**
     * @param {...{button: Listener}} items 
     * @returns {DeferredBuilder}
     */
    withAwaitClickAndReturn(...items) {
        this.def.awaitClickAndReturn(...items);
        return this;
    }

    /**
     * @param {Listener} target 
     * @param {string} key 
     * @returns {DeferredBuilder}
     */
    withAwaitKey(target, key) {
        this.def.awaitKey(target, key);
        return this;
    }

    /**
     * @param {Function} task 
     * @returns {DeferredBuilder}
     */
    withOnFinish(task) {
        this.def.onFinish(task);
        return this;
    }

    /**
     * @returns {Promise<void>}
     */
    build() {
        return this.def.promise;
    }
}

class _deferred {
    /**
     * @param {AbortSignal} externalAbortSignal 
     */
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

/**
 * @param {AbortSignal} abortSignal 
 * @returns {DeferredBuilder}
 */
export function Deferred(abortSignal) {
    return new DeferredBuilder(abortSignal);
}

/**
 * @param {AbortSignal} abortSignal
 * @param {...Listener} clickables
 * @returns {Promise<void>}
 */
export function awaitClick(abortSignal, ...clickables) {
    return Deferred(abortSignal).withAwaitClick(...clickables).build();
}

/**
 * @param {AbortSignal} abortSignal
 * @param {...{button: Listener}} items
 * @returns {Promise<void>}
 */
export function awaitClickAndReturn(abortSignal, ...items) {
    return Deferred(abortSignal).withAwaitClickAndReturn(...items).build();
}