import { FLAGS, KENNEDY, NIXON, RESET_SIGNAL, STATE_REGION, stateCodes } from "./constants";
import { candidateDp, chooseFromBags, getOtherCandidate, getPlayerCandidate } from "./util";

class FieldsObj {
    constructor(fields) {
        this._fieldNames = Object.keys(fields);
    }

    toDict() {
        return Object.fromEntries(this._fieldNames.map(field => {
            const val = this[field];
            if (!(val instanceof Object) || val.constructor === Object) {
                return [field, val];
            } else {
                return [field, val.toDict()];
            }
        }));
    }
}

class GameData extends FieldsObj {
    constructor(fields) {
        super(fields);
        const player = getPlayerCandidate(fields);

        for (const field in fields) {
            if (field === NIXON || field === KENNEDY) {
                this[field] = new Player(fields[field], field, player, this);
            } else if (field === "cubes") {
                this[field] = new Proxy(new Cubes(fields[field], this), {
                    get(target, prop) {
                        return target[prop];
                    },
                    set(target, prop, newValue) {
                        if (Object.values(stateCodes).includes(prop)) {
                            target.setState(prop, newValue);
                        } else {
                            target[prop] = newValue;
                        }
                    }
                });
            } else {
                this[field] = fields[field];
            }
        };
    }

    get event() {
        return this._event;
    }

    /**
     * This sets the current event to newEvent.
     * This assumes that the current event is done, if it still exists.
     * If the current event has an after, then it will happen after newEvent entirely completes.
     * This includes any afters of newEvent.
     * In other words, lets say we current have event A, with event B as its after.
     * A -> B
     * We want to set event C, which has event D as its after.
     * Event A is assumed to be done now, so the new chain of events will go:
     * C -> D -> B
     * If we did this again, adding event X with event Y after it, the chain would be:
     * X -> Y -> D -> B
     */
    set event(newEvent) {
        if (this.event !== null && this.event.after) {
            let lastEvent = newEvent;
            while (lastEvent.after) lastEvent = lastEvent.after;
            lastEvent.after = this.event.after;
        }
        this._event = newEvent;
    }

    eventFinished() {
        if (this.event.after) {
            this.event = after;
        } else {
            this._event = null;
        }
    }

    /**
     * Queue an event to happen after the current one completes, if there is a current event.
     * If there isn't a current event, just sets the event directly.
     * If the current event chain is A -> B -> C, and we queue D, the new chain is
     * A -> B -> C -> D.
     */
    queueEvent(event) {
        if (this.event) {
            let lastEvent = this.event;
            while (lastEvent.after) lastEvent = lastEvent.after;
            lastEvent.after = newEvent;
        } else {
            this.event = event;
        }
    }
}

class Cubes extends FieldsObj {
    constructor(fields, parent) {
        super(fields);
        this._parent = parent;
        for (const field in fields) {
            this[field] = fields[field];
        };
    }

    needSupportCheck(stateName) {
        const player = getPlayerCandidate(this._parent);
        const opponent = getOtherCandidate(this._parent);
        const dp = candidateDp(player);

        if (Math.sign(this._parent.media[STATE_REGION[stateName]]) === dp) return false;
        const flag = this._parent.flags[FLAGS.ADVANCE_MEN];
        if (flag && flag.player === player && flag.round === this._parent.round) return false;

        const stateScore = this._parent.cubes[stateName];
        if (Math.sign(stateScore) === -dp && Math.abs(stateScore) >= 4) return true;
        if (this._parent[opponent].state === stateName) return true;
        return false;
    }

    setState(stateName, score) {
        const delta = score - this[stateName];
        const absDelta = Math.abs(delta);
        const player = getPlayerCandidate(this._parent);

        if (this.needSupportCheck(stateName)) {
            let supportCount = chooseFromBags(this._parent.kennedy, this._parent.nixon, absDelta, 12);
            if (player === NIXON) {
                supportCount = absDelta - supportCount;
            }
            this[stateName] += Math.sign(delta) * supportCount;
        } else {
            this[stateName] = score;
        }
    }
}

class Player extends FieldsObj {
    constructor(fields, candidate, userCandidate, parent) {
        super(fields);
        this._candidate = candidate;
        this._userCandidate = userCandidate;
        this._parent = parent;

        for (const field in fields) {
            this[field] = fields[field];
        };
    }

    get momentum() {
        return this._momentum;
    }

    set momentum(newMomentum) {
        if (newMomentum < this._momentum
            && this._candidate === KENNEDY && this._userCandidate === KENNEDY
            && !this.kennedyCanMomentum()
        ) {
            throw RESET_SIGNAL;
        }
        if (newMomentum < this._momentum
            && this._candidate === NIXON && this._userCandidate === NIXON
            && !this.nixonCanMomentum()
        ) {
            throw RESET_SIGNAL;
        }

        this._momentum = Math.max(0, newMomentum);
    }

    nixonCanMomentum() {
        if (this._parent.flags[FLAGS.JOE_KENNEDY] === this._parent.round) return false;
        return true;
    }

    kennedyCanMomentum() {
        if (this._parent.flags[FLAGS.PUERTO_RICAN] === this._parent.round) return false;
        return true;
    }

    canMomentum() {
        if (this._candidate === NIXON && this._userCandidate === NIXON) return this.nixonCanMomentum();
        if (this._candidate === KENNEDY && this._userCandidate === KENNEDY) return this.kennedyCanMomentum();
        return true; // player A can always remove player B's momentum
    }

    momentumDecay() {
        this._momentum = Math.ceil(this._momentum / 2);
    }
}

export default GameData;