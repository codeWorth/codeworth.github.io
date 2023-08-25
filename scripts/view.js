import * as UI from "./dom.js";
import {
    ISSUE_URLS, ELECTORS, stateNames, TURNS_PER_ROUND, KENNEDY, NIXON
} from "./constants.js";
import { CANDIDATE_CARD, CANDIDATE_CARD_NAME, CARDS, ISSUE_URL, PARTY_URL } from "./cards.js";
import { addCSSClass, removeCSSClass } from "./util.js";

let showingElectors = false;

export function showEndorsements(gameData) {
    for (const id in UI.endorseButtons) {
        const val = UI.endorseButtons[id];
        val.setCount(gameData.endorsements[val.dataKey]);
    }
}

export function showMedia(gameData) {
    for (const id in UI.mediaButtons) {
        const val = UI.mediaButtons[id];
        val.setCount(gameData.media[val.dataKey]);
    }
}

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

export function showCubes(gameData) {
    stateNames.forEach(state => {
        UI.stateButtons[state].setCount(gameData.cubes[state]);
    });
}
export function updateCubes(gameData) {
    if (!showingElectors) showCubes(gameData);
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
        showingHand = false;
        UI.handModeButton.innerText = "Show Hand";
        removeCSSClass(UI.campaignDiv, "hidden");
        addCSSClass(UI.handDiv, "hidden");
    } else {
        showingHand = true;
        UI.handModeButton.innerText = "Show Campaign Strategy";
        removeCSSClass(UI.handDiv, "hidden");
        addCSSClass(UI.campaignDiv, "hidden");
    }
}
export function showHand() {
    if (!showingHand) toggleHandMode();
}
export function showCampaignDeck() {
    if (showingHand) toggleHandMode();
}

UI.chooseWindow.onclick = e => e.stopPropagation();

export function moveIconTo(icon, state) {
    const locStyle = window.getComputedStyle(UI.stateButtons[state].button);
    icon.style.left = locStyle.getPropertyValue("left");
    icon.style.top = locStyle.getPropertyValue("top");
}
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

function writeToCard(cardObj, cardName, card) {
    cardObj.header.innerText = cardName;
    cardObj.body.innerText = card.text;
    cardObj.cp.innerText = card.points + " CP";
    cardObj.rest.innerText = card.rest + " Rest";
    cardObj.state.innerText = card.state === null ? "" : card.state.toUpperCase();
    cardObj.candidateImg.src = PARTY_URL[card.party];
    cardObj.issueImg.src = card.issue === null ? "../images/blank_issue.png" : ISSUE_URL[card.issue];
}

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

export function showRound(gameData, playerCandidate) {
    const round = gameData.round;

    if (gameData.currentPlayer === playerCandidate && gameData.turn < TURNS_PER_ROUND) {
        UI.turnIndicator.innerText = `Your turn! (Round ${round})`;
    } else {
        UI.turnIndicator.innerText = `(Round ${round})`;
    }
}

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

export function showPointsOnCard(cover, points) {
    cover.innerText = points;
    if (points === 0) cover.innerText = "Done?";
    removeCSSClass(cover, "hidden");
}

export function showMomentum(gameData) {
    UI.nixonMomentum.innerText = gameData.nixon.momentum;
    UI.kennedyMomentum.innerText = gameData.kennedy.momentum;
}
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
    UI.eventCounter.innerText = count;
}
export function hideEventCount() {
    addCSSClass(UI.eventCounter, "hidden");
}

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