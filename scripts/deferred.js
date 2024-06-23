export class AbortError extends Error {
    constructor(...args) {
        super(...args);
    }
}

/**  
 * @typedef {Object} Listener
 * @property {Function} addEventListener
*/
/**
 * @typedef {Object} Item
 * @property {Listener} button
 */

/** @template T */
export class DeferredBuilder {
    /**
     * @param {AbortSignal} abortSignal 
     */
    constructor(abortSignal) {
        this.def = new _deferred(abortSignal);
    }

    /**
     * @param {...Listener & T} clickables 
     * @returns {DeferredBuilder}
     */
    withAwaitClick(...clickables) {
        this.def.awaitClick(...clickables);
        return this;
    }

    /**
     * @param {...Item & T} items 
     * @returns {DeferredBuilder}
     */
    withAwaitClickAndReturn(...items) {
        this.def.awaitClickAndReturn(...items);
        return this;
    }

    /**
     * @param {Listener} target 
     * @param {T} key 
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
     * @returns {Promise<T>}
     */
    build() {
        return this.def.promise;
    }
}

/** @template T */
class _deferred {
    /** 
     * @callback Resolver
     * @param {T} result
     */
    /** @type {Resolver} */
    _resolve

    /** @param {AbortSignal} externalAbortSignal */
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

    /** @param {T} result */
    resolve(result) {
        this.aborter.abort();
        this._resolve(result);
    }

    reject(result) {
        this.aborter.abort();
        this._reject(result);
    }

    /** @param  {...Listener & T} buttons */
    awaitClick(...buttons) {
        buttons.forEach(button => {
            button.addEventListener(
                "click", 
                () => this.resolve(button), 
                {signal: this.aborter.signal}
            )
        });
    }

    /** @param  {...Item & T} items */
    awaitClickAndReturn(...items) {
        items.forEach(item => {
            item.button.addEventListener(
                "click", 
                () => this.resolve(item), 
                {signal: this.aborter.signal}
            )
        });
    }

    /**
     * @param {Listener} target 
     * @param {T} key 
     */
    awaitKey(target, key) {
        document.createElement("div").onkeydown = (e) => e;
        target.addEventListener(
            "keydown", 
            e => { if (e.key === key) this.resolve(key); }, 
            {signal: this.aborter.signal}
        );
    }
}

/**
 * @param {AbortSignal} abortSignal 
 * @template T
 * @returns {DeferredBuilder<T>}
 */
export function Deferred(abortSignal) {
    return new DeferredBuilder(abortSignal);
}

/**
 * @template T
 * @param {AbortSignal} abortSignal
 * @param {...Listener & T} clickables
 * @returns {Promise<T>}
 */
export function awaitClick(abortSignal, ...clickables) {
    return Deferred(abortSignal).withAwaitClick(...clickables).build();
}

/**
 * @template T
 * @param {AbortSignal} abortSignal
 * @param {...Item & T} items
 * @returns {Promise<T>}
 */
export function awaitClickAndReturn(abortSignal, ...items) {
    return Deferred(abortSignal).withAwaitClickAndReturn(...items).build();
}