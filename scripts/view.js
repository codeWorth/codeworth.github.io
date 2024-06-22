import * as UI from "./dom.js";
import {
    ISSUE_URLS, ELECTORS, stateNames, TURNS_PER_ROUND, KENNEDY, NIXON, STATE_CODES, CANDIDATE, PHASE
} from "./constants.js";
import { CANDIDATE_CARD, CANDIDATE_CARD_NAME, CARDS, ISSUE_URL, PARTY_URL } from "./cards.js";
import { addCSSClass, removeCSSClass } from "./util.js";

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
            val.button.style.backgroundImage = `url(${ISSUE_URLS[issueName]})`;
        }
    }
}

/** @param {GameData} gameData */
export function showCubes(gameData) {
    stateNames.forEach(state => {
        UI.stateButtons[state].setCount(gameData.cubes[state]);
    });
}
/** @param {GameData} gameData */
export function updateCubes(gameData) {
    if (!showingElectors) showCubes(gameData);
}

UI.showSummaryButton.onclick = () => {
    addCSSClass(choosePopup, "hidden");
}
UI.hideSummaryButton.onclick = () => {
    removeCSSClass(choosePopup, "hidden");
}
function removeDeltas() {
    const deltaDivs = document.getElementsByClassName("delta");
    while (deltaDivs.length > 0) {
        deltaDivs[0].parentElement.removeChild(deltaDivs[0]);
    }
    for (let i = 0; i < UI.issueButtons.length; i++) {
        UI.issueButtons[i].setHighlight(false);
    }
}
function createDelta(count) {
    const deltaDiv = document.createElement("div");
    deltaDiv.className = "delta";
    deltaDiv.innerText = count < 0 ? count : `+${count}`;
    return deltaDiv;
}
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
        stateNames.forEach(state => {
            UI.stateButtons[state].hideElectors();
        });
        showingElectors = false;
        UI.showElectorsButton.innerText = "Show (E)lectors";
    } else {
        stateNames.forEach(state => {
            UI.stateButtons[state].showElectors(ELECTORS[state]);
        });
        showingElectors = true;
        UI.showElectorsButton.innerText = "Hide (E)lectors";
    }
}

let showingHand = true;
UI.handModeButton.onclick = toggleHandMode;
function toggleHandMode() {
    if (showingHand) {
        showCampaignDeck();
    } else {
        showHand();
    }
}
export function showHand() {
    showingHand = true;
    UI.handModeButton.innerText = "Show Campaign Strategy";
    removeCSSClass(UI.handDiv, "hidden");
    addCSSClass(UI.campaignDiv, "hidden");
}
export function showCampaignDeck() {
    showingHand = false;
    UI.handModeButton.innerText = "Show Hand";
    removeCSSClass(UI.campaignDiv, "hidden");
    addCSSClass(UI.handDiv, "hidden");
}

UI.chooseWindow.onclick = e => e.stopPropagation();

/**
 * @param {HTMLElement} icon 
 * @param {STATE_CODES} state 
 */
export function moveIconTo(icon, state) {
    const locStyle = window.getComputedStyle(UI.stateButtons[state].button);
    icon.style.left = locStyle.getPropertyValue("left");
    icon.style.top = locStyle.getPropertyValue("top");
}
/** @param {GameData} gameData */
export function moveIcons(gameData) {
    moveIconTo(UI.kennedyIcon, gameData.kennedy.state);
    moveIconTo(UI.nixonIcon, gameData.nixon.state);
}

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
    candidateImg.width = "40";
    candidateImg.className = "candidate";
    const issueImg = document.createElement("img");
    issueImg.width = "40";
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
 * @param {HTMLElement} cardObj 
 * @param {string} cardName 
 * @param {Card} card 
 */
function writeToCard(cardObj, cardName, card) {
    cardObj.header.innerText = cardName;
    cardObj.body.innerText = card.text;
    cardObj.cp.innerText = card.points + " CP";
    cardObj.rest.innerText = card.rest + " Rest";
    cardObj.state.innerText = card.state === null ? "" : card.state.toUpperCase();
    cardObj.candidateImg.src = PARTY_URL[card.party];
    cardObj.issueImg.src = card.issue === null ? "../images/blank_issue.png" : ISSUE_URL[card.issue];
}

/**
 * @param {string[]} hand 
 * @param {boolean} exhausted 
 * @param {CANDIDATE} candidate 
 * @param {HTMLElement|undefined} handDiv 
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
        cardSlot.candidateImg.src = PARTY_URL[fakeCard.party];
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
 * @param {GameData} gameData 
 * @param {CANDIDATE} playerCandidate 
 */
export function showRound(gameData, playerCandidate) {
    const round = gameData.round;

    if (
        (gameData.currentPlayer === playerCandidate && gameData.turn < TURNS_PER_ROUND && gameData.chosenCard === null) ||
        (gameData.currentPlayer !== playerCandidate && gameData.chosenCard !== null)
    ) {
        UI.turnIndicator.innerText = `Your move! (Turn ${round})`;
    } else {
        UI.turnIndicator.innerText = `(Turn ${round})`;
    }

    if (gameData.phase === PHASE.ISSUE_SWAP || 
        gameData.phase === PHASE.ISSUE_REWARD_CHOICE || 
        gameData.phase === PHASE.ISSUE1_ENDORSE_REWARD
    ) {
        UI.subTurnIndicator.innerText = `Momentum Phase`;
    } else if (gameData.phase === PHASE.STRATEGY) {
        UI.subTurnIndicator.innerText = `Strategy Phase`;
    } else {
        UI.subTurnIndicator.innerText = `Phase ${gameData.turn+1}`;
    }
}

/** @param {GameData} gameData */
export function showBagRoll(gameData) {
    if (gameData.lastBagOut === null) return;
    UI.infoDiv.innerText = `-${gameData.lastBagOut.name}-\nKennedy: ${gameData.lastBagOut.kennedy}\nNixon: ${gameData.lastBagOut.nixon}`;
}

export function showInfo(msg) {
    UI.infoDiv.innerText = msg;
}

export function showShouldSwap() {
    UI.infoDiv.innerText = "Select an issue to swap it left.";
}

export function showChooseEndorseRegion() {
    UI.infoDiv.innerText = "Choose a region to endorse.";
}

export function showShouldDiscard(count) {
    if (count === 1) {
        UI.infoDiv.innerText = `Select ${count} card to add to your campaign deck.`;
    } else {
        UI.infoDiv.innerText = `Select ${count} cards to add to your campaign deck.`;
    }
}

/**
 * @param {HTMLElement} cover 
 * @param {number} points 
 */
export function showPointsOnCard(cover, points) {
    cover.innerText = points;
    if (points === 0) cover.innerText = "Done?";
    removeCSSClass(cover, "hidden");
}

/** @param {GameData} gameData */
export function showMomentum(gameData) {
    UI.nixonMomentum.innerText = gameData.nixon.momentum;
    UI.kennedyMomentum.innerText = gameData.kennedy.momentum;
}
/** @param {GameData} gameData */
export function showRest(gameData) {
    UI.nixonRestCount.innerText = gameData.nixon.rest;
    UI.kennedyRestCount.innerText = gameData.kennedy.rest;
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
            UI.debateRows[i].issue.style.backgroundImage = `url(${ISSUE_URLS[issue]})`;
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