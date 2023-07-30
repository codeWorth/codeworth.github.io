const CLEARED_MESSAGE = "All promises were cleared";

class FbPromises {
    constructor() {
        this.promises = [];
    }

    await(condition) {
        const deferred = new _deferred();
        this.promises.push({
            deferred: deferred,
            condition: condition
        });
        return deferred.promise;
    }

    update(state) {
        this.promises
            .filter(prom => prom.condition(state))
            .forEach(prom => prom.deferred.resolve(state));
    }

    cancel() {
        this.promises
            .forEach(prom => prom.deferred.reject(new Error(CLEARED_MESSAGE)));
    }
}

class DeferredBuilder {
    static deferrals = [];
    constructor() {
        this.def = new _deferred();
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

    build() {
        DeferredBuilder.deferrals.push(this.def);
        return this.def.promise;
    }

    static cancelAll() {
        DeferredBuilder.deferrals.forEach(deferral => 
            deferral.reject(new Error(CLEARED_MESSAGE))
        );
    }
}

class _deferred {
    constructor() {
        this.aborter = new AbortController();
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
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
            e => { if (e.key === key) waiter.resolve(waiter); }, 
            {signal: this.aborter.signal}
        );
    }
}

function Deferred() {
    return new DeferredBuilder();
}

function awaitClick(...clickables) {
    return Deferred().withAwaitClick(...clickables).build();
}

function awaitClickAndReturn(...items) {
    return Deferred().withAwaitClickAndReturn(...items).build();
}