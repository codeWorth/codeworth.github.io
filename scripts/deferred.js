class FbPromises {
    constructor() {
        this.promises = [];
    }

    await(condition) {
        const deferred = new Deferred();
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
            .forEach(prom => prom.deferred.reject(new Error("FbPromises was canceled.")));
    }
}

class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}

async function awaitClick(...buttons) {
    const def = new Deferred();
    buttons.forEach(button => 
        button.onclick = () => def.resolve(button)
    );
    return def.promise;
}

async function awaitClickAndReturn(items) {
    const def = new Deferred();
    buttons.forEach(item => 
        item.button.onclick = () => def.resolve(item)
    );
    return def.promise;
}