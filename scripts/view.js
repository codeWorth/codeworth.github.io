import * as UI from "./dom.js";
import {
    ISSUE_URLS, ELECTORS, stateNames, TURNS_PER_ROUND, KENNEDY, NIXON, STATE_CODES, CANDIDATE, PHASE
} from "./constants.js";
import { CANDIDATE_CARD, CANDIDATE_CARD_NAME, CARDS, ISSUE_URL, PARTY_URL, LIFETIME, ENDORSE_REGIONS } from "./cards.js";
import { addCSSClass, candidateDp, removeCSSClass, stateWinner, sum } from "./util.js";
import GameData from "./gameData.js";

let showingElectors = false;

/** @param {GameData} gameData */
export function showEndorsements(gameData) {
    for (const id in UI.endorseButtons) {
        const val = UI.endorseButtons[id];
        val.setCount(gameData.endorsements[val.dataKey]);
    }
}

/** @param {GameData} gameData */
export function showMedia(gameData) {
    for (const id in UI.mediaButtons) {
        const val = UI.mediaButtons[id];
        val.setCount(gameData.media[val.dataKey]);
    }
}

/** @param {GameData} gameData */
export function showIssues(gameData) {
    for (const index in UI.issueButtons) {
        const val = UI.issueButtons[index];
        const issueName = gameData.issues[index];
        if (issueName === null) {
            val.setCount(0);
            val.button.style.backgroundImage = "url(../images/blank_issue.png)";
        } else {
            val.setCount(gameData.issueScores[issueName]);
            val.button.style.backgroundImage = `url(${ISSUE_URLS(issueName)})`;
        }
    }
}

/**
 * @param {CANDIDATE} player
 * @param {GameData} gameData
 * @returns {number} 
 */
function tallyScore(player, gameData) {
    const dp = candidateDp(player);
    return Object.keys(ELECTORS)
        .map(stateName => stateWinner(stateName, gameData.cubes[stateName], gameData.endorsements) === dp ? ELECTORS[stateName] : 0)
        .reduce(sum, 0);
}

/** @param {GameData} gameData */
export function showCubes(gameData) {
    stateNames.forEach(state => {
        UI.stateButtons[state].setCount(gameData.cubes[state], state, gameData.endorsements);
    });
    UI.tallyDiv.innerText = `Electors Tally:\nKennedy: ${tallyScore(KENNEDY, gameData)}\nNixon: ${tallyScore(NIXON, gameData)}`;
}
/** @param {GameData} gameData */
export function updateCubes(gameData) {
    if (!showingElectors) showCubes(gameData);
}

UI.showSummaryButton.onclick = () => {
    addCSSClass(UI.choosePopup, "hidden");
}
UI.hideSummaryButton.onclick = () => {
    removeCSSClass(UI.choosePopup, "hidden");
}
function removeDeltas() {
    const deltaDivs = document.getElementsByClassName("delta");
    while (deltaDivs.length > 0) {
        deltaDivs[0].remove();
    }
    for (let i = 0; i < Object.keys(UI.issueButtons).length; i++) {
        UI.issueButtons[i].setHighlight(false);
    }
}
/**
 * @param {number} count 
 * @returns {HTMLElement}
 */
function createDelta(count) {
    const deltaDiv = document.createElement("div");
    deltaDiv.className = "delta";
    deltaDiv.innerText = count < 0 ? count.toString() : `+${count}`;
    return deltaDiv;
}
/**
 * @param {GameData} gameData 
 * @param {number} dp 
 */
export function showTurnSummary(gameData, dp) {
    removeCSSClass(UI.showSummaryButton, "hidden");
    removeCSSClass(UI.hideSummaryButton, "hidden");

    removeDeltas();

    for (const state of stateNames) {
        if (gameData.cubes[state] === gameData.prev.cubes[state]) continue;
        const delta = (gameData.cubes[state] - gameData.prev.cubes[state]) * dp;
        UI.stateButtons[state].button.appendChild(createDelta(delta));
    }
    for (const issue of Object.keys(gameData.issueScores)) {
        if (gameData.issueScores[issue] === gameData.prev.issueScores[issue]) continue;
        const delta = (gameData.issueScores[issue] - gameData.prev.issueScores[issue]) * dp;
        const issueIndex = gameData.issues.indexOf(issue);
        UI.issueButtons[issueIndex].button.appendChild(createDelta(delta));
    }
    for (const loc of Object.keys(gameData.media)) {
        if (gameData.media[loc] === gameData.prev.media[loc]) continue;
        const delta = (gameData.media[loc] - gameData.prev.media[loc]) * dp;
        UI.mediaButtons[`${loc}Media`].button.appendChild(createDelta(delta));
    }
    for (const loc of Object.keys(gameData.endorsements)) {
        if (gameData.endorsements[loc] === gameData.prev.endorsements[loc]) continue;
        const delta = (gameData.endorsements[loc] - gameData.prev.endorsements[loc]) * dp;
        UI.endorseButtons[`${loc}Endorse`].button.appendChild(createDelta(delta));
    }
    for (let i = 0; i < gameData.issues.length; i++) {
        if (gameData.issues[i] === gameData.prev.issues[i]) continue;
        UI.issueButtons[i].setHighlight(true);
        const index = gameData.prev.issues.indexOf(gameData.issues[i]);
        UI.issueButtons[index].setHighlight(true);
    }

    if (gameData.nixon.rest !== gameData.prev.nixon.rest) {
        const delta = gameData.nixon.rest - gameData.prev.nixon.rest;
        UI.nixonRestCount.parentElement?.appendChild(createDelta(delta));
    }
    if (gameData.kennedy.rest !== gameData.prev.kennedy.rest) {
        const delta = gameData.kennedy.rest - gameData.prev.kennedy.rest;
        UI.kennedyRestCount.parentElement?.appendChild(createDelta(delta));
    }
    if (gameData.nixon.momentum !== gameData.prev.nixon.momentum) {
        const delta = gameData.nixon.momentum - gameData.prev.nixon.momentum;
        UI.nixonMomentum.parentElement?.appendChild(createDelta(delta));
    }
    if (gameData.kennedy.momentum !== gameData.prev.kennedy.momentum) {
        const delta = gameData.kennedy.momentum - gameData.prev.kennedy.momentum;
        UI.kennedyMomentum.parentElement?.appendChild(createDelta(delta));
    }
}
export function hideTurnSummary() {
    addCSSClass(UI.showSummaryButton, "hidden");
    addCSSClass(UI.hideSummaryButton, "hidden");

    removeDeltas();
}

UI.showElectorsButton.onclick = () => toggleShowElectors();
document.addEventListener("keydown", e => {
    if (e.key === "e") toggleShowElectors();
});
stateNames.forEach(state => {
    UI.stateButtons[state].hideElectors();
});
export function toggleShowElectors() {
    if (showingElectors) {
        addCSSClass(UI.tallyDiv, "hidden");
        removeCSSClass(UI.infoDiv, "hidden");

        stateNames.forEach(state => {
            UI.stateButtons[state].hideElectors();
        });
        showingElectors = false;
        UI.showElectorsButton.innerText = "Show (E)lectors";
    } else {
        removeCSSClass(UI.tallyDiv, "hidden");
        addCSSClass(UI.infoDiv, "hidden");

        stateNames.forEach(state => {
            UI.stateButtons[state].showElectors(ELECTORS[state]);
        });
        showingElectors = true;
        UI.showElectorsButton.innerText = "Hide (E)lectors";
    }
}

const VIEWED_CARDS = {
    HAND: "hand",
    CAMPAIGN: "campaign",
    EFFECTS: "effects"
};
let viewedCards = VIEWED_CARDS.HAND;
UI.handModeButton.onclick = toggleHandMode;
function toggleHandMode() {
    if (viewedCards == VIEWED_CARDS.HAND) {
        showCampaignDeck();
    } else if (viewedCards === VIEWED_CARDS.CAMPAIGN) {
        showEffects();
    } else if (viewedCards === VIEWED_CARDS.EFFECTS) {
        showHand();
    }
}
export function showHand() {
    viewedCards = VIEWED_CARDS.HAND;
    UI.handModeButton.innerText = "Show Campaign Strategy";
    UI.handLabelDiv.innerText = "Hand";
    removeCSSClass(UI.handDiv, "hidden");
    addCSSClass(UI.campaignDiv, "hidden");
    addCSSClass(UI.effectsDiv, "hidden");
}
export function showCampaignDeck() {
    viewedCards = VIEWED_CARDS.CAMPAIGN;
    UI.handModeButton.innerText = "Show Active Effects";
    UI.handLabelDiv.innerText = "Campaign Deck";
    removeCSSClass(UI.campaignDiv, "hidden");
    addCSSClass(UI.handDiv, "hidden");
    addCSSClass(UI.effectsDiv, "hidden");
}
export function showEffects() {
    viewedCards = VIEWED_CARDS.EFFECTS;
    UI.handModeButton.innerText = "Show Hand";
    UI.handLabelDiv.innerText = "Active Effects";
    removeCSSClass(UI.effectsDiv, "hidden");
    addCSSClass(UI.handDiv, "hidden");
    addCSSClass(UI.campaignDiv, "hidden");
}

UI.chooseWindow.onclick = e => e.stopPropagation();

/**
 * @param {HTMLElement} icon 
 * @param {STATE_CODES} state 
 */
export function moveIconTo(icon, state) {
    const locStyle = window.getComputedStyle(UI.stateButtons[state].button);
    const pixelsPerRem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    icon.style.left = `${parseFloat(locStyle.getPropertyValue("left")) / pixelsPerRem}rem`;
    icon.style.top = `${parseFloat(locStyle.getPropertyValue("top")) / pixelsPerRem}rem`;
}
/** 
 * @param {GameData} gameData
 * @param {boolean} [noSmooth] 
 */
export function moveIcons(gameData, noSmooth) {
    if (!noSmooth) {
        addCSSClass(UI.nixonIcon, "smooth-pos");
        addCSSClass(UI.kennedyIcon, "smooth-pos");
    }

    moveIconTo(UI.kennedyIcon, gameData.kennedy.state);
    moveIconTo(UI.nixonIcon, gameData.nixon.state);
    addCSSClass
    removeCSSClass(UI.nixonIcon, "smooth-pos");
    removeCSSClass(UI.kennedyIcon, "smooth-pos");

}

/**
 * @typedef {Object} CardDiv
 * @property {HTMLDivElement} card 
 * @property {HTMLDivElement} header
 * @property {HTMLDivElement} body
 * @property {HTMLImageElement} candidateImg
 * @property {HTMLImageElement} issueImg
 * @property {HTMLDivElement} cp
 * @property {HTMLDivElement} state
 * @property {HTMLDivElement} rest
 * @property {HTMLDivElement} pointsCover
 */
/**
 * @returns {CardDiv}
 */
export function makeEmptyCard() {
    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("h3");
    header.className = "header";

    const bodyContainer = document.createElement("div");
    bodyContainer.className = "bodyContainer";
    const body = document.createElement("div");
    body.className = "body";
    bodyContainer.appendChild(body);
    
    const candidateImg = document.createElement("img");
    candidateImg.width = 40;
    candidateImg.className = "candidate";
    const issueImg = document.createElement("img");
    issueImg.width = 40;
    issueImg.className = "issue";

    const info = document.createElement("div");
    info.className = "info";
    const cp = document.createElement("div");
    cp.className = "cp";
    const state = document.createElement("div");
    state.className = "state";
    const rest = document.createElement("div");
    rest.className = "rest";
    info.appendChild(cp);
    info.appendChild(state);
    info.appendChild(rest);

    const pointsCover = document.createElement("div");
    pointsCover.className = "pointsCover hidden";

    card.appendChild(header);
    card.appendChild(bodyContainer);
    card.appendChild(candidateImg);
    card.appendChild(issueImg);
    card.appendChild(info);
    card.appendChild(pointsCover);

    return {
        card: card, 
        header: header, 
        body: body, 
        candidateImg: candidateImg, 
        issueImg: issueImg, 
        cp: cp, 
        state: state, 
        rest: rest, 
        pointsCover: pointsCover
    };
}

/**
 * @param {CardDiv} cardObj 
 * @param {string} cardName 
 * @param {import('./cards.js').Card} card 
 */
function writeToCard(cardObj, cardName, card) {
    cardObj.header.innerText = cardName;
    cardObj.body.innerText = card.text;
    cardObj.cp.innerText = card.points + " CP";
    cardObj.rest.innerText = card.rest + " Rest";
    cardObj.state.innerText = card.state.toUpperCase();
    cardObj.candidateImg.src = PARTY_URL(card.party);
    cardObj.issueImg.src = card.issue === null ? "../images/blank_issue.png" : ISSUE_URL(card.issue);
}

/**
 * @param {string[]} hand 
 * @param {boolean} exhausted 
 * @param {CANDIDATE} candidate 
 * @param {HTMLElement} [handDiv] 
 */
export function displayHand(hand, exhausted, candidate, handDiv) {
    if (!handDiv) handDiv = UI.handDiv;
    const handCards = hand.map(name => CARDS[name]);
    const cardItems = [];

    const cardDivs = handDiv.querySelectorAll(".card");
    cardDivs.forEach(cardDiv => handDiv.removeChild(cardDiv));

    for (let i = 0; i < handCards.length; i++) {
        const cardName = hand[i];
        const card = handCards[i];
        const cardSlot = makeEmptyCard();
        handDiv.appendChild(cardSlot.card);
        writeToCard(cardSlot, cardName, card);

        cardItems.push({
            name: cardName,
            card: card,
            cardSlot: cardSlot,
            button: cardSlot.card,
            isCandidate: false
        });
    }

    if (!exhausted) {
        const fakeCard = CANDIDATE_CARD(candidate);
        const cardSlot = makeEmptyCard();
        handDiv.appendChild(cardSlot.card);

        cardSlot.header.innerText = CANDIDATE_CARD_NAME;
        cardSlot.body.innerText = fakeCard.text;
        cardSlot.cp.innerText = fakeCard.points + " CP";
        cardSlot.rest.innerText = fakeCard.rest + " Rest";
        cardSlot.state.innerText = fakeCard.state.toUpperCase();
        cardSlot.candidateImg.src = PARTY_URL(fakeCard.party);
        cardSlot.issueImg.src = "../images/blank_issue.png";

        cardItems.push({
            name: CANDIDATE_CARD_NAME,
            card: fakeCard,
            cardSlot: cardSlot,
            button: cardSlot.card,
            isCandidate: true
        });
    }

    return cardItems;
}

/**
 * @param {string[]} hand 
 */
export function displayCampaignDeck(hand) {
    const handCards = hand.map(name => CARDS[name]);
    const cardItems = [];

    const cardDivs = UI.campaignDiv.querySelectorAll(".card");
    cardDivs.forEach(cardDiv => UI.campaignDiv.removeChild(cardDiv));

    for (let i = 0; i < handCards.length; i++) {
        const cardName = hand[i];
        const card = handCards[i];
        const cardSlot = makeEmptyCard();
        UI.campaignDiv.appendChild(cardSlot.card);
        writeToCard(cardSlot, cardName, card);

        cardItems.push({
            name: cardName,
            card: card,
            cardSlot: cardSlot,
            button: cardSlot.card
        });
    }

    return cardItems;
}

/**
 * @param {string|number} value 
 * @returns {boolean}
 */
function isNumber(value) {
    return !isNaN(/** @type {number} */ (value));
}

/**
 * @param {import("./gameData.js").Discard[]} discard 
 * @param {number} turn
 */
export function displayEffects(discard, turn) {
    const effectCards = discard
        .filter(card => 
            (!isNumber(card.lifetime) && card.lifetime !== LIFETIME.NONE) || //@ts-ignore
            (isNumber(card.lifetime) && parseInt(card.lifetime) >= turn));
    const cardItems = [];

    const cardDivs = UI.effectsDiv.querySelectorAll(".card");
    cardDivs.forEach(cardDiv => UI.effectsDiv.removeChild(cardDiv));

    for (let i = 0; i < effectCards.length; i++) {
        const card = effectCards[i];
        const cardSlot = makeEmptyCard();
        UI.effectsDiv.appendChild(cardSlot.card);
        writeToCard(cardSlot, card.name, CARDS[card.name]);

        cardItems.push({
            name: card.name,
            card: card,
            cardSlot: cardSlot,
            button: cardSlot.card
        });
    }

    return cardItems;
}

/**
 * @param {GameData} gameData 
 * @param {CANDIDATE} playerCandidate 
 */
export function showRound(gameData, playerCandidate) {
    const round = gameData.round;

    const yourMovePlayCards = 
        (gameData.currentPlayer === playerCandidate && gameData.turn < TURNS_PER_ROUND && gameData.event === null && gameData.chosenCard === null) ||
        (gameData.event && gameData.event.target === playerCandidate) ||
        (gameData.currentPlayer !== playerCandidate && gameData.event === null && gameData.chosenCard !== null);
    const yourMoveEvent = 
        gameData.event !== null && gameData.event.target === playerCandidate;
    const yourMoveOtherwise = 
        gameData.choosingPlayer === playerCandidate &&
        (gameData.phase === PHASE.ISSUE_SWAP || 
            gameData.phase === PHASE.ISSUE_REWARD_CHOICE ||
            gameData.phase === PHASE.ISSUE_ENDORSE_REWARD ||
            gameData.phase === PHASE.STRATEGY ||
            gameData.phase === PHASE.TRIGGER_EVENT);

    if ((gameData.phase == PHASE.PLAY_CARDS && yourMovePlayCards) || yourMoveEvent || yourMoveOtherwise) {
        UI.turnIndicator.innerText = `Your move! (Turn ${round})`;
    } else {
        UI.turnIndicator.innerText = `(Turn ${round})`;
    }

    if (gameData.phase === PHASE.ISSUE_SWAP || 
        gameData.phase === PHASE.ISSUE_REWARD_CHOICE || 
        gameData.phase === PHASE.ISSUE_ENDORSE_REWARD
    ) {
        UI.subTurnIndicator.innerText = `Momentum Phase`;
    } else if (gameData.phase === PHASE.STRATEGY) {
        UI.subTurnIndicator.innerText = `Strategy Phase`;
    } else {
        UI.subTurnIndicator.innerText = `Phase ${Math.floor(gameData.turn/2)+1}`;
    }
}

/** @param {GameData} gameData */
export function showBagRoll(gameData) {
    if (gameData.lastBagOut === null) return;
    setInfoText(`-${gameData.lastBagOut.name}-\nKennedy: ${gameData.lastBagOut.kennedy}\nNixon: ${gameData.lastBagOut.nixon}`);
}

/** @param {string} msg */
export function showInfo(msg) {
    setInfoText(msg);
}

export function showShouldSwap() {
    setInfoText("Select an issue to swap it left.");
}

export function showChooseEndorseRegion() {
    setInfoText("Choose a region to endorse.");
}

/** @param {number} count */
export function showShouldDiscard(count) {
    if (count === 1) {
        setInfoText(`Select ${count} card to add to your campaign deck.`);
    } else {
        setInfoText(`Select ${count} cards to add to your campaign deck.`);
    }
}

/** @param {string} msg */
function setInfoText(msg) {
    UI.infoDiv.innerText = msg;
}

/**
 * @param {HTMLElement} cover 
 * @param {number} points 
 */
export function showPointsOnCard(cover, points) {
    cover.innerText = points.toString();
    if (points === 0) cover.innerText = "Done?";
    removeCSSClass(cover, "hidden");
}

/** @param {GameData} gameData */
export function showMomentum(gameData) {
    UI.nixonMomentum.innerText = gameData.nixon.momentum.toString();
    UI.kennedyMomentum.innerText = gameData.kennedy.momentum.toString();
}
/** @param {GameData} gameData */
export function showRest(gameData) {
    UI.nixonRestCount.innerText = gameData.nixon.rest.toString();
    UI.kennedyRestCount.innerText = gameData.kennedy.rest.toString();
}

export function highlightSelf(playerCandidate) {
    if (playerCandidate === NIXON) {
        addCSSClass(UI.nixonIcon, "pi-self");
        removeCSSClass(UI.kennedyIcon, "pi-self");
    } else if (playerCandidate === KENNEDY) {
        addCSSClass(UI.kennedyIcon, "pi-self");
        removeCSSClass(UI.nixonIcon, "pi-self");
    }
}

export function showEventCount(count) {
    removeCSSClass(UI.eventCounter, "hidden");
    UI.eventCounter.innerHTML = count;
}
export function hideEventCount() {
    addCSSClass(UI.eventCounter, "hidden");
}

/** @param {GameData} gameData */
export function showDebateWindow(gameData) {
    const hands = gameData.debate.hands;
    const issues = gameData.debate.issues;
    for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        if (hands[issue]) {
            UI.debateRows[i].issue.style.backgroundImage = `url(${ISSUE_URLS(issue)})`;
            displayHand(hands[issue].nixon, true, NIXON, UI.debateRows[i].left);
            displayHand(hands[issue].kennedy, true, KENNEDY, UI.debateRows[i].right);
        } else {
            UI.debateRows[i].issue.style.backgroundImage = "none";
            displayHand([], true, NIXON, UI.debateRows[i].left);
            displayHand([], true, KENNEDY, UI.debateRows[i].right);
        }
    }

    removeCSSClass(UI.debateWindow, "hidden");
}
export function hideDebateWindow() {
    addCSSClass(UI.debateWindow, "hidden");
}