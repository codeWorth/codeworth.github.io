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
    return gameData.kennedy.email === getUser().email;
}

export function getPlayerCandidate(gameData) {
    return playerIsKennedy(gameData) ? CONSTANTS.KENNEDY : CONSTANTS.NIXON;
}

export function getOtherCandidate(gameData) {
    return playerIsKennedy(gameData) ? CONSTANTS.NIXON :CONSTANTS.KENNEDY;
}

export function candidateDp(candidate) {
    return candidate === CONSTANTS.NIXON ? 1 : -1;
}

export function movementRegion(stateName) {
    if (stateName === "hawaii" || stateName === "alaska") {
        return stateName;
    } else {
        return CONSTANTS.stateRegion[stateName];
    }
}

export function moveCost(srcReg, dstReg) {
    if (srcReg === dstReg) return 0;
    return 1 + moveCost(CONSTANTS.movePath[srcReg][dstReg], dstReg);
}