import * as CONSTANTS from "./constants.js";
import { getUser } from "./user.js";
import GameData from "./gameData.js";
import { ENDORSE_NAME } from "./cards.js";

/**
 * @param {Element} elem 
 * @param {string} className 
 */
export function removeCSSClass(elem, className) {
    const classes = elem.className.split(" ");
    elem.className = classes.filter(name => name != className).join(" ");
}

/**
 * @param {Element} elem 
 * @param {string} className 
 */
export function addCSSClass(elem, className) {
    removeCSSClass(elem, className);
    elem.className = elem.className + " " + className;
}

/**
 * @param {Element} elem 
 */
export function removeAllChildren(elem) {
    while (elem.lastChild) elem.removeChild(elem.lastChild);
}

/**
 * @param {GameData} gameData 
 * @returns {boolean}
 */
export function playerIsKennedy(gameData) {
    return gameData.kennedy.uid === getUser().uid;
}

/**
 * @param {GameData} gameData 
 * @returns {CONSTANTS.CANDIDATE}
 */
export function getPlayerCandidate(gameData) {
    return playerIsKennedy(gameData) ? CONSTANTS.KENNEDY : CONSTANTS.NIXON;
}

/**
 * @param {GameData} gameData 
 * @returns {CONSTANTS.CANDIDATE}
 */
export function getOtherCandidate(gameData) {
    return playerIsKennedy(gameData) ? CONSTANTS.NIXON : CONSTANTS.KENNEDY;
}

/**
 * @param {CONSTANTS.CANDIDATE|null} candidate
 * @returns {CONSTANTS.CANDIDATE}
 */
export function oppositeCandidate(candidate) {
    if (candidate === null) {
        console.error("Null candidate!");
        throw CONSTANTS.RESET_SIGNAL;
    }
    return candidate === CONSTANTS.NIXON ? CONSTANTS.KENNEDY : CONSTANTS.NIXON;
}

/**
 * @param {CONSTANTS.CANDIDATE} candidate 
 * @returns {1|-1}
 */
export function candidateDp(candidate) {
    return candidate === CONSTANTS.NIXON ? 1 : -1;
}

/**
 * @param {1|-1|number} dp 
 * @returns {CONSTANTS.CANDIDATE}
 */
export function candidateForDp(dp) {
    return dp === candidateDp(CONSTANTS.NIXON) ? CONSTANTS.NIXON : CONSTANTS.KENNEDY;
}

/**
 * @param {CONSTANTS.STATE_CODES} stateName 
 * @returns {CONSTANTS.STATE_CODES|number}
 */
export function movementRegion(stateName) {
    if (stateName === "hawaii" || stateName === "alaska") {
        return stateName;
    } else {
        return CONSTANTS.STATE_REGION[stateName];
    }
}

/**
 * @param {CONSTANTS.STATE_CODES|number} srcReg 
 * @param {CONSTANTS.STATE_CODES|number} dstReg 
 * @returns {number}
 */
export function moveCost(srcReg, dstReg) {
    if (srcReg === dstReg) return 0;
    return 1 + moveCost(CONSTANTS.movePath[srcReg][dstReg], dstReg);
}

/**
 * @template T
 * @param {T[]} arr 
 * @param {T} item 
 */
export function moveUp(arr, item) {
    const index = arr.indexOf(item);
    if (index === 0) return;

    arr[index] = arr[index - 1];
    arr[index - 1] = item;
}

/**
 * @param {GameData} data 
 * @param {string} flag 
 * @returns {boolean}
 */
export function flagActive(data, flag) {
    return data.flags[flag] === data.round;
}

/**
 * @param {string[]} names 
 * @param {string} seperator 
 * @returns {string}
 */
export function listAndCapitalize(names, seperator) {
    const capNames = names
        .map(name => name.toLowerCase())
        .filter(name => name.length > 0)
        .map(name => name[0].toUpperCase() + name.substring(1));
    if (capNames.length === 0) return "";
    if (capNames.length === 1) return capNames[0];
    if (capNames.length === 2) return capNames.join(` ${seperator} `);
    
    return capNames.slice(0, -1).join(", ") + `, ${seperator} ` + capNames.slice(-1)[0];
}

/**
 * Removes up to count items from the given array.
 * Returns the removed items.
 * @template T
 * @param {T[]} array 
 * @param {number} count 
 * @returns {T[]}
 */
export function popRandom(array, count) {
    const removed = [];
    for (let i = 0; i < count; i++) {
        if (array.length === 0) break;
        removed.push(
            array.splice(Math.floor(Math.random() * array.length), 1)[0]
        );
    }
    return removed;
}

/**
 * @param {{bag: number}} holder1 
 * @param {{bag: number}} holder2 
 * @param {number} count 
 * @param {number} max 
 * @returns {{count1: number, count2: number}}
 */
export function chooseFromBags(holder1, holder2, count, max) {
    let holder1Count = 0;
    let holder2Count = 0;
    
    for (let i = 0; i < count; i++) {
        if (holder1.bag == 0) {
            holder1.bag = max;
        }
        if (holder2.bag == 0) {
            holder2.bag = max;
        }

        if (holder1.bag + holder2.bag === 0) break;
        const bagItem = Math.floor(Math.random() * (holder1.bag + holder2.bag));
        const isHolder1 = bagItem < holder1.bag;
        if (isHolder1) {
            holder1.bag--;
            holder1Count++;
        } else {
            holder2.bag--;
            holder2Count++;
        }
    }

    return {
        count1: holder1Count,
        count2: holder2Count
    };
}

/**
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
export function sum(a, b) {
    return a+b;
}

/**
 * @param {number} ms 
 * @returns {Promise<void>}
 */
export function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {number} number
 * @returns {-1|0|1} 
 */
export function sign(number) {
    //@ts-ignore
    return Math.sign(number);
}

/**
 * 
 * @param {string} state 
 * @param {number} cubes 
 * @param {Object<string, number>} endorsements
 * @returns {-1|1}
 */
export function stateWinner(state, cubes, endorsements) {
    const s = sign(cubes);
    if (s !== 0) return s;

    const endorse = sign(endorsements[ENDORSE_NAME(CONSTANTS.STATE_REGION[state])]);
    if (endorse !== 0) return endorse;

    return CONSTANTS.stateLeanNixon[state] ? candidateDp(CONSTANTS.NIXON) : candidateDp(CONSTANTS.KENNEDY);
}
