let escapePopup = null;
let showingElectors = false;

function showEndorsements(gameData) {
    for (id in endorseButtons) {
        const val = endorseButtons[id];
        val.setCount(gameData.endorsements[val.dataKey]);
    }
}

function showMedia(gameData) {
    for (id in mediaButtons) {
        const val = mediaButtons[id];
        val.setCount(gameData.media[val.dataKey]);
    }
}

function showIssues(gameData) {
    for (index in issueButtons) {
        const val = issueButtons[index];
        const issueName = gameData.issues[index];
        val.setCount(gameData.issueScores[issueName]);
        val.button.style.backgroundImage = `url(${ISSUE_URLS[issueName]})`;
    }
}

function showCubes(gameData) {
    stateNames.forEach(state => {
        stateButtons[state].setCount(gameData.cubes[state]);
    });
}
function updateCubes(gameData) {
    if (!showingElectors) showCubes(gameData);
}

function showElectors() {
    stateNames.forEach(state => {
        stateButtons[state].setText(electors[state]);
    });
}

function showPoints(points, cardSlot) {
    cardSlot.pointsCover.innerText = points;
    if (points === 0) {
        cardSlot.pointsCover.innerText = "Done?";
    }
}

function hidePopup() {
    addCSSClass(choosePopup, "hidden");
}
function toggleShowElectors() {
    if (showingElectors) {
        showCubes(gameData);
        showingElectors = false;
        showElectorsButton.innerText = "Show (E)lectors";
    } else {
        showElectors();
        showingElectors = true;
        showElectorsButton.innerText = "Hide (E)lectors";
    }
}
showElectorsButton.onclick = toggleShowElectors;
document.addEventListener("keydown", e => {
    if (e.key === "e") toggleShowElectors();
});
chooseWindow.onclick = e => e.stopPropagation();

function showCardPopup(cardName, disableEvent) {
    removeAllChildren(chooseButtonsContainer);
    chooseTitle.innerText = `What would you like to use '${cardName}' for?`;

    const eventButton = document.createElement("button");
    eventButton.innerText = "Event";
    eventButton.disabled = disableEvent;
    const cpButton = document.createElement("button");
    cpButton.innerText = "Campaign";
    const issueButton = document.createElement("button");
    issueButton.innerText = "Issues";
    const mediaButton = document.createElement("button");
    mediaButton.innerText = "Media";
    
    chooseButtonsContainer.appendChild(eventButton);
    chooseButtonsContainer.appendChild(cpButton);
    chooseButtonsContainer.appendChild(issueButton);
    chooseButtonsContainer.appendChild(mediaButton);
    removeCSSClass(choosePopup, "hidden");
    canEscapePopup = true;

    return {
        eventButton: eventButton, 
        cpButton: cpButton,
        issueButton: issueButton,
        mediaButton: mediaButton
    };
}

function moveIconTo(icon, state) {
    const locStyle = window.getComputedStyle(stateButtons[state].button);
    icon.style.left = locStyle.getPropertyValue("left");
    icon.style.top = locStyle.getPropertyValue("top");
}
function moveIcons(gameData) {
    moveIconTo(kennedyIcon, gameData.kennedy.state);
    moveIconTo(nixonIcon, gameData.nixon.state);
}

function makeEmptyCard() {
    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("h3");
    header.className = "header";
    const body = document.createElement("div");
    body.className = "body";
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
    card.appendChild(body);
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

function displayHand(hand, exhausted, candidate) {
    const handCards = hand.map(name => CARDS[name]);
    const cardItems = [];
    while (handDiv.firstChild) handDiv.removeChild(handDiv.lastChild);

    for (let i = 0; i < handCards.length; i++) {
        const cardName = hand[i];
        const card = handCards[i];
        const cardSlot = makeEmptyCard();
        handDiv.appendChild(cardSlot.card);

        cardSlot.header.innerText = cardName;
        cardSlot.body.innerText = card.text;
        cardSlot.cp.innerText = card.points + " CP";
        cardSlot.rest.innerText = (4 - card.points) + " Rest";
        cardSlot.state.innerText = card.state === null ? "" : card.state.toUpperCase();
        cardSlot.candidateImg.src = PARTY_URL[card.party];
        cardSlot.issueImg.src = card.issue === null ? "" : ISSUE_URL[card.issue];
        removeCSSClass(cardSlot.card, "hidden");

        cardItems.push({
            name: cardName,
            card: card,
            cardSlot: cardSlot,
            button: cardSlot.card,
            isCandidate: false
        });
    }

    if (!exhausted) {
        const cardSlot = makeEmptyCard();
        handDiv.appendChild(cardSlot.card);

        cardSlot.header.innerText = "Candidate Card";
        cardSlot.body.innerText = "This card may only be played for campaign points. Once played, it is flipped to the exhausted side.";
        cardSlot.cp.innerText = "5 CP";
        cardSlot.rest.innerText = "0 Rest";
        cardSlot.state.innerText = candidate === KENNEDY ? "MA" : "CA";
        cardSlot.candidateImg.src = candidate === KENNEDY ? PARTY_URL[PARTY.DEMOCRAT] : PARTY_URL[PARTY.REPUBLICAN];
        cardSlot.issueImg.src = "";
        removeCSSClass(cardSlot.card, "hidden");

        cardItems.push({
            name: "Candidate Card",
            card: {points: 5, isCandidate: true},
            cardSlot: cardSlot,
            button: cardSlot.card,
            isCandidate: true
        });
    }

    return cardItems;
}

function showRound(gameData, playerCandidate) {
    const round = gameData.round;

    if (gameData.currentPlayer === playerCandidate && gameData.turn < TURNS_PER_ROUND) {
        turnIndicator.innerText = `Your turn! (Round ${round})`;
    } else {
        turnIndicator.innerText = `(Round ${round})`;
    }
}

function showBagRoll(gameData) {
    if (gameData.lastBagOut === null) return;
    infoDiv.innerText = `-${gameData.lastBagOut.name}-\nKennedy: ${gameData.lastBagOut.kennedy}\nNixon: ${gameData.lastBagOut.nixon}`;
}

function showShouldSwap() {
    infoDiv.innerText = "Select an issue\nto swap it left";
}

function showChooseEndorseRegion() {
    infoDiv.innerText = "Choose a region\nto endorse";
}

function finalizePopup() {
    removeAllChildren(chooseButtonsContainer);
    chooseTitle.innerText = "Finalize these moves?";

    const finalizeButton = document.createElement("button");
    finalizeButton.innerText = "Finalize";
    const resetButton = document.createElement("button");
    resetButton.innerText = "Reset";
    
    chooseButtonsContainer.appendChild(finalizeButton);
    chooseButtonsContainer.appendChild(resetButton);

    removeCSSClass(choosePopup, "hidden");
    return {finalizeButton: finalizeButton, resetButton: resetButton};
}

function rewardChoicePopup() {
    removeAllChildren(chooseButtonsContainer);
    chooseTitle.innerText = "Which issue reward do you want?";

    const momentumButton = document.createElement("button");
    momentumButton.innerText = "Momentum";
    const endorsementButton = document.createElement("button");
    endorsementButton.innerText = "Endorsement";
    
    chooseButtonsContainer.appendChild(momentumButton);
    chooseButtonsContainer.appendChild(endorsementButton);

    removeCSSClass(choosePopup, "hidden");
    return {momentumButton: momentumButton, endorsementButton: endorsementButton};
} 

function showPointsOnCard(cover, points) {
    cover.innerText = points;
    if (points === 0) cover.innerText = "Done?";
    removeCSSClass(cover, "hidden");
}