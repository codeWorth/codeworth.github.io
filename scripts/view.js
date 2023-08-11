import * as UI from "./dom.js";
import {
    ISSUE_URLS, ELECTORS, stateNames, TURNS_PER_ROUND, KENNEDY
} from "./constants.js";
import { CARDS, ISSUE_URL, PARTY, PARTY_URL } from "./cards.js";
import { removeAllChildren, removeCSSClass } from "./util.js";

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
        val.setCount(gameData.issueScores[issueName]);
        val.button.style.backgroundImage = `url(${ISSUE_URLS[issueName]})`;
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

export function showElectors() {
    stateNames.forEach(state => {
        UI.stateButtons[state].setText(ELECTORS[state]);
    });
}

export function toggleShowElectors() {
    if (showingElectors) {
        showCubes(gameData);
        showingElectors = false;
        UI.showElectorsButton.innerText = "Show (E)lectors";
    } else {
        showElectors();
        showingElectors = true;
        UI.showElectorsButton.innerText = "Hide (E)lectors";
    }
}
UI.showElectorsButton.onclick = toggleShowElectors;
document.addEventListener("keydown", e => {
    if (e.key === "e") toggleShowElectors();
});
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

export function displayHand(hand, exhausted, candidate) {
    const handCards = hand.map(name => CARDS[name]);
    const cardItems = [];
    removeAllChildren(UI.handDiv);

    for (let i = 0; i < handCards.length; i++) {
        const cardName = hand[i];
        const card = handCards[i];
        const cardSlot = makeEmptyCard();
        UI.handDiv.appendChild(cardSlot.card);

        cardSlot.header.innerText = cardName;
        cardSlot.body.innerText = card.text;
        cardSlot.cp.innerText = card.points + " CP";
        cardSlot.rest.innerText = (4 - card.points) + " Rest";
        cardSlot.state.innerText = card.state === null ? "" : card.state.toUpperCase();
        cardSlot.candidateImg.src = PARTY_URL[card.party];
        cardSlot.issueImg.src = card.issue === null ? "" : ISSUE_URL[card.issue];

        cardItems.push({
            name: cardName,
            card: {...card, rest: 4 - card.points},
            cardSlot: cardSlot,
            button: cardSlot.card,
            isCandidate: false
        });
    }

    if (!exhausted) {
        const fakeCard = {
            points: 5,
            rest: 0,
            text: "This card may only be played for campaign points. Once played, it is flipped to the exhausted side.",
            state: candidate === KENNEDY ? "ma" : "ca",
            party: candidate === KENNEDY ? PARTY.DEMOCRAT : PARTY.REPUBLICAN,
            issue: null,
            isCandidate: true
        };
        const cardSlot = makeEmptyCard();
        UI.handDiv.appendChild(cardSlot.card);

        cardSlot.header.innerText = "Candidate Card";
        cardSlot.body.innerText = fakeCard.text;
        cardSlot.cp.innerText = fakeCard.points + " CP";
        cardSlot.rest.innerText = fakeCard.rest + " Rest";
        cardSlot.state.innerText = fakeCard.state.toUpperCase();
        cardSlot.candidateImg.src = PARTY_URL[fakeCard.party];
        cardSlot.issueImg.src = "";

        cardItems.push({
            name: "Candidate Card",
            card: fakeCard,
            cardSlot: cardSlot,
            button: cardSlot.card,
            isCandidate: true
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

export function showShouldSwap() {
    UI.infoDiv.innerText = "Select an issue\nto swap it left";
}

export function showChooseEndorseRegion() {
    UI.infoDiv.innerText = "Choose a region\nto endorse";
}

export function showShouldDiscard(count) {
    if (count === 1) {
        UI.infoDiv.innerText = `Select ${count} card\nto discard`;
    } else {
        UI.infoDiv.innerText = `Select ${count} cards\nto discard`;
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