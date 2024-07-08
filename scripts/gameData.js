import { FLAGS, KENNEDY, NIXON, PHASE, RESET_SIGNAL, STATE_REGION, STATE_CODES, CP_MOD_TYPE, CARD_MODE, ISSUE, CANDIDATE, REGION_NAME } from "./constants.js";
import { ENDORSE_REGIONS, LIFETIME } from "./cards.js";
import { candidateDp, chooseFromBags, flagActive, getOtherCandidate, getPlayerCandidate, stateWinner, sum } from "./util.js";

/**
 * @typedef {Object} HandsPair
 * @property {string[]} nixon
 * @property {string[]} kennedy
 */
/**
 * @typedef {Object} Cards
 * @property {string|null} nixon
 * @property {string|null} kennedy
 */
/**
 * @typedef {Object} Debate
 * @property {Object<ISSUE, HandsPair>} hands
 * @property {Cards} cards
 * @property {CANDIDATE} initiative
 * @property {string[]} issues
 * @property {number} resolveIndex
 * @property {boolean} cleanUp
 * @property {string} [needParty]
 */

/**
 * @typedef {Object} PlayerCounts
 * @property {number} kennedy
 * @property {number} nixon
 */

/**
 * @typedef {Object} LastBagOut
 * @property {number} kennedy
 * @property {number} nixon
 * @property {string} name
 */

/**
 * @typedef {Object} LastRoll
 * @property {number} points
 * @property {string} cardName
 */

/**
 * @typedef {Object} Discard
 * @property {string} name
 * @property {LIFETIME|number} lifetime
 * @property {string|null} player
 */

/**
 * @typedef {Object} CpMod
 * @property {string} player
 * @property {number} round
 * @property {number} boost
 * @property {number} [min]
 * @property {number} [max]
 * @property {CP_MOD_TYPE} type
 */

class FieldsObj {
    constructor(fields) {
        this._fieldNames = Object.keys(fields);
    }

    toDict() {
        return Object.fromEntries(this._fieldNames.map(field => {
            const val = this[field];
            if (val instanceof FieldsObj) {
                return [field, val.toDict()];
            } else {
                return [field, val];
            }
        }));
    }
}

class GameData extends FieldsObj {

    /** @type {boolean} */ 
    started
    /** @type {string|null} */
    choosingPlayer
    /** @type {CANDIDATE|null} */ 
    currentPlayer
    /** @type {PHASE} */
    phase
    /** @type {boolean} */ 
    preempted
    /** @type {string|null} */
    chosenCard
    /** @type {Cubes} */ 
    cubes
    /** @type {string[]} */ 
    issues
    /** @type {string[]} */ 
    deck
    /** @type {string[]} */ 
    endorsementsDeck
    /** @type {Discard[]} */
    discard
    /** @type {Debate} */
    debate
    /** @type {PlayerCounts & {winner: CANDIDATE}} */
    finalScore
    /** @type {number} */
    turn
    /** @type {number} */
    round
    /** @type {LastBagOut} */
    lastBagOut
    /** @type {LastRoll|null} */
    lastRoll
    /** @type {Object<string, number>} Keys are one of {@link ENDORSE_REGIONS}*/
    endorsements
    /** @type {Object<string, number>} Keys are one of {@link ENDORSE_REGIONS}*/
    media
    /** @type {Object<string, number>} Keys are one of {@link ISSUE}*/
    issueScores
    /** @type {Player} */
    kennedy
    /** @type {Player} */
    nixon
    /** @type {CpMod[]} */
    cpMods
    /** @type {Object<string, any>} */
    flags
    /** @type {Object} */
    prev
    /** @type {CARD_MODE|null} */
    cardMode
            
    constructor(fields) {
        super(fields);
        const player = getPlayerCandidate(fields);

        for (const field in fields) {
            if (field === NIXON || field === KENNEDY) {
                this[field] = new Player(fields[field], field, player, this);
            } else if (field === "cubes") {
                this[field] = new Cubes(fields[field], this);
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
        if (this.event && this.event.after) {
            let lastEvent = newEvent;
            while (lastEvent.after) lastEvent = lastEvent.after;
            lastEvent.after = this.event.after;
        }
        this._event = newEvent;
    }

    eventFinished() {
        if (this.event.after) {
            this._event = this.event.after;
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
            lastEvent.after = JSON.parse(JSON.stringify(event)); // prevent self reference
        } else {
            this.event = event;
        }
    }

    delayEvent() {
        this._event = {after: this._event};
    }
}

class Cubes extends FieldsObj {

    /** @type {number} */
    alabama
    /** @type {number} */
    alaska
    /** @type {number} */
    arizona
    /** @type {number} */
    arkansas
    /** @type {number} */
    california
    /** @type {number} */
    colorado
    /** @type {number} */
    connecticut
    /** @type {number} */
    delaware
    /** @type {number} */
    florida
    /** @type {number} */
    georgia
    /** @type {number} */
    hawaii
    /** @type {number} */
    idaho
    /** @type {number} */
    illinois
    /** @type {number} */
    indiana
    /** @type {number} */
    iowa
    /** @type {number} */
    kansas
    /** @type {number} */
    kentucky
    /** @type {number} */
    louisiana
    /** @type {number} */
    maine
    /** @type {number} */
    maryland
    /** @type {number} */
    massachusetts
    /** @type {number} */
    michigan
    /** @type {number} */
    minnesota
    /** @type {number} */
    mississippi
    /** @type {number} */
    missouri
    /** @type {number} */
    montana
    /** @type {number} */
    nebraska
    /** @type {number} */
    nevada
    /** @type {number} */
    newhampshire
    /** @type {number} */
    newjersey
    /** @type {number} */
    newmexico
    /** @type {number} */
    newyork
    /** @type {number} */
    northcarolina
    /** @type {number} */
    northdakota
    /** @type {number} */
    ohio
    /** @type {number} */
    oklahoma
    /** @type {number} */
    oregon
    /** @type {number} */
    pennsylvania
    /** @type {number} */
    rhodeisland
    /** @type {number} */
    southcarolina
    /** @type {number} */
    southdakota
    /** @type {number} */
    tennessee
    /** @type {number} */
    texas
    /** @type {number} */
    utah
    /** @type {number} */
    vermont
    /** @type {number} */
    virginia
    /** @type {number} */
    washington
    /** @type {number} */
    westvirginia
    /** @type {number} */
    wisconsin
    /** @type {number} */
    wyoming

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

        if (this._parent.phase === PHASE.DEBATE_RESOLVE) return false;
        if (Math.sign(this._parent.media[REGION_NAME[STATE_REGION[stateName]]]) === dp) return false;
        const flag = this._parent.flags[FLAGS.ADVANCE_MEN];
        if (flag && flag.player === player && flag.round === this._parent.round) return false;

        if (player === NIXON && flagActive(this._parent, FLAGS.HOSTILE_PRESS)) return true;
        const stateScore = this._parent.cubes[stateName];
        if (Math.sign(stateScore) === -dp && Math.abs(stateScore) >= 4) return true;
        if (this._parent[opponent].state === stateName) return true;
        return false;
    }

    /**
     * @param {string} stateName 
     * @param {number} delta 
     */
    supportCheckSetState(stateName, delta) {
        const score = this[stateName] + delta;
        const absDelta = Math.abs(delta);
        const player = getPlayerCandidate(this._parent);

        if (this.needSupportCheck(stateName)) {
            const counts = chooseFromBags(this._parent.kennedy, this._parent.nixon, absDelta, 12);
            this._parent.lastBagOut = {
                kennedy: counts.count1,
                nixon: counts.count2,
                name: "Support Check"
            };
            const supportCount = player === KENNEDY ? counts.count1 : counts.count2; 
            delta = Math.sign(delta) * supportCount;
            this[stateName] += delta;
        } else {
            this[stateName] = score;
        }
    }
}

export class Player extends FieldsObj {

    /** @type {number} */
    bag
    /** @type {string[]} */
    campaignDeck
    /** @type {boolean} */
    exhausted
    /** @type {string[]} */
    hand
    /** @type {number} */
    rest
    /** @type {string} */
    state
    /** @type {string} */
    uid

    constructor(fields, candidate, userCandidate, parent) {
        super(fields);
        this._candidate = candidate;
        this._userCandidate = userCandidate;
        this._parent = parent;

        for (const field in fields) {
            this[field] = fields[field];
        };
    }

    /** @returns {number} */
    get momentum() {
        return this._momentum;
    }

    set momentum(newMomentum) {
        if (newMomentum < this._momentum
            && !this.canMomentum(1)
        ) {
            throw RESET_SIGNAL;
        }

        this._momentum = Math.max(0, newMomentum);
    }

    nixonCanMomentum(count) {
        if (this._parent.flags[FLAGS.JOE_KENNEDY] === this._parent.round) return false;
        if (this._momentum < count) return false;
        return true;
    }

    kennedyCanMomentum(count) {
        if (this._parent.flags[FLAGS.PUERTO_RICAN] === this._parent.round) return false;
        if (this._momentum < count) return false;
        return true;
    }

    canMomentum(count) {
        if (this._candidate === NIXON && this._userCandidate === NIXON) return this.nixonCanMomentum(count);
        if (this._candidate === KENNEDY && this._userCandidate === KENNEDY) return this.kennedyCanMomentum(count);
        return true; // player A can always remove player B's momentum
    }

    momentumDecay() {
        this._momentum = Math.ceil(this._momentum / 2);
    }
}

export default GameData;