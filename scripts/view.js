let canEscapePopup = false;
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
    canEscapePopup = false;
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
document.onkeydown = (e) => {
    if (e.key === "e") toggleShowElectors();
    if (e.key === "Escape" && canEscapePopup) {
        hidePopup();
    }
};
choosePopup.onclick = () => {
    if (canEscapePopup) {
        hidePopup();
    }
};
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

function displayHand(hand, exhausted, candidate, chooseCard) {
    const handCards = hand.map(name => CARDS[name]);
    for (let i = 0; i < 8; i++) {
        addCSSClass(cardSlots[i+1].card, "hidden");
    }

    for (let i = 0; i < handCards.length; i++) {
        const cardName = hand[i];
        const card = handCards[i];
        const cardSlot = cardSlots[i+1];

        cardSlot.header.innerText = cardName;
        cardSlot.body.innerText = card.text;
        cardSlot.cp.innerText = card.points + " CP";
        cardSlot.rest.innerText = (4 - card.points) + " Rest";
        cardSlot.state.innerText = card.state === null ? "" : card.state.toUpperCase();
        cardSlot.candidateImg.src = PARTY_URL[card.party];
        cardSlot.issueImg.src = card.issue === null ? "" : ISSUE_URL[card.issue];
        removeCSSClass(cardSlot.card, "hidden");

        cardSlot.card.onclick = () => {
            chooseCard(cardName, card, cardSlot, false);
        }
    }

    if (!exhausted) {
        const cardSlot = cardSlots[handCards.length];

        cardSlot.header.innerText = "Candidate Card";
        cardSlot.body.innerText = "This card may only be played for campaign points. Once played, it is flipped to the exhausted side.";
        cardSlot.cp.innerText = "5 CP";
        cardSlot.rest.innerText = "0 Rest";
        cardSlot.state.innerText = candidate === "kennedy" ? "MA" : "CA";
        cardSlot.candidateImg.src = candidate === "kennedy" ? PARTY_URL[PARTY.DEMOCRAT] : PARTY_URL[PARTY.REPUBLICAN];
        cardSlot.issueImg.src = "";
        removeCSSClass(cardSlot.card, "hidden");

        cardSlot.card.onclick = () => {
            chooseCard("Candidate Card", {points: 5, isCandidate: true}, cardSlot, true);
        }
    }
}

function showRound(gameData, playerCandidate) {
    const round = Math.floor(gameData.totalTurns / (TURNS_PER_ROUND + 2)) + 1;

    if (gameData.currentPlayer === playerCandidate && gameData.turn < TURNS_PER_ROUND) {
        turnIndicator.innerText = `Your turn! (Round ${round})`;
    } else {
        turnIndicator.innerText = `(Round ${round})`;
    }
}

function showInitiativeRoll(gameData) {
    infoDiv.innerText = `-Initiative-\nKennedy: ${gameData.lastBagOut.kennedy}\nNixon: ${gameData.lastBagOut.nixon}`;
}

function showSupportChecks(gameData) {
    infoDiv.innerText = `-Support Checks-\nKennedy: ${gameData.lastBagOut.kennedy}\nNixon: ${gameData.lastBagOut.nixon}`;
}