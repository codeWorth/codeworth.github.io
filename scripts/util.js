import * as CONSTANTS from "./constants.js";
import { getUser } from "./user.js";

export function removeCSSClass(elem, className) {
    const classes = elem.className.split(" ");
    elem.className = classes.filter(name => name != className).join(" ");
}

export function addCSSClass(elem, className) {
    removeCSSClass(elem, className);
    elem.className = elem.className + " " + className;
}

export function removeAllChildren(elem) {
    while (elem.firstChild) elem.removeChild(elem.lastChild);
}

export function playerIsKennedy(gameData) {
    return gameData.kennedy.uid === getUser().uid;
}

export function getPlayerCandidate(gameData) {
    return playerIsKennedy(gameData) ? CONSTANTS.KENNEDY : CONSTANTS.NIXON;
}

export function getOtherCandidate(gameData) {
    return playerIsKennedy(gameData) ? CONSTANTS.NIXON : CONSTANTS.KENNEDY;
}

export function oppositeCandidate(candidate) {
    return candidate === CONSTANTS.NIXON ? CONSTANTS.KENNEDY : CONSTANTS.NIXON;
}

export function candidateDp(candidate) {
    return candidate === CONSTANTS.NIXON ? 1 : -1;
}

export function candidateForDp(dp) {
    return dp === candidateDp(CONSTANTS.NIXON) ? CONSTANTS.NIXON : CONSTANTS.KENNEDY;
}

export function movementRegion(stateName) {
    if (stateName === "hawaii" || stateName === "alaska") {
        return stateName;
    } else {
        return CONSTANTS.STATE_REGION[stateName];
    }
}

export function moveCost(srcReg, dstReg) {
    if (srcReg === dstReg) return 0;
    return 1 + moveCost(CONSTANTS.movePath[srcReg][dstReg], dstReg);
}

export function moveUp(arr, item) {
    const index = arr.indexOf(item);
    if (index === 0) return;

    arr[index] = arr[index - 1];
    arr[index - 1] = item;
}

export function flagActive(data, flag) {
    return data.flags[flag] === data.round;
}

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

export function chooseFromBags(holder1, holder2, count, max) {
    let holder1Count = 0;
    
        for (let i = 0; i < count; i++) {
            if (holder1.bag == 0) {
                holder1.bag = max;
            }
            if (holder2.bag == 0) {
                holder2.bag = max;
            }
    
            const bagItem = Math.floor(Math.random() * (holder1.bag + holder2.bag));
            const isHolder1 = bagItem < holder1.bag;
            if (isHolder1) {
                holder1.bag--;
                holder1Count++;
            } else {
                holder2.bag--;
            }
        }
    
        return holder1Count;
}
