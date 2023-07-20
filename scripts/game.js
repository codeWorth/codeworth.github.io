var user = undefined;
var gameId = undefined;
var db = undefined;
var doc = undefined;
var collection = undefined;
var query = undefined;
var getDoc = undefined;
var setDoc = undefined;
var getDocs = undefined;
var deleteDoc = undefined;
var updateDoc = undefined;
var onSnapshot = undefined

let gameSetup = null;
let gameData = null;
let cpMode = false;
let mediaMode = false;
let issuesMode = false;
let activeCard = null;
let pointsRemaining = -1;
let mediaPoints = 0;
let issuesBought = [];

async function setup(user_, db_, fbMethods) {
    user = user_;
    db = db_;
    doc = fbMethods.doc;
    collection = fbMethods.collection;
    query = fbMethods.query;
    getDoc = fbMethods.getDoc;
    setDoc = fbMethods.setDoc;
    getDocs = fbMethods.getDocs;
    deleteDoc = fbMethods.deleteDoc;
    updateDoc = fbMethods.updateDoc;
    onSnapshot = fbMethods.onSnapshot;

    gameSetup = new GameSetup(fbMethods, user, db, gameUpdate, enterGame);
    gameIdsField.innerText = (await gameSetup.getGames()).join("\n");
    userNameField.innerText = `Logged in as ${user.displayName} (${user.email})`;
}

function grabBagIsKennedy(count) {
    let kenCount = 0;

    for (let i = 0; i < count; i++) {
        if (gameData.kennedy.bag == 0) {
            gameData.kennedy.bag = 12;
        }
        if (gameData.nixon.bag == 0) {
            gameData.nixon.bag = 12;
        }

        const bagItem = Math.floor(Math.random() * (gameData.kennedy.bag + gameData.nixon.bag));
        const isKennedy = bagItem < gameData.kennedy.bag;

        gameData.kennedy.bag--;
        gameData.nixon.bag--;
        kenCount += isKennedy ? 1 : 0;
    }

    updateDoc(doc(db, "elec_games", gameId), {
        kennedy: gameData.kennedy,
        nixon: gameData.nixon
    });
    return kenCount;
}

async function getHand(gameEntry) {
    const handSize = 6;

    const availableCards = gameEntry.deck;
    const playerCandidate = getPlayerCandidate(gameData);
    const playerData = gameEntry[playerCandidate];

    if (playerData.hand.length > 0) {
        return playerData.hand;
    }

    const hand = [];
    for (let i = 0; i < handSize; i++) {
        hand.push(availableCards.splice(Math.floor(Math.random() * availableCards.length), 1)[0]);
    }
    playerData.hand = hand;

    await updateDoc(doc(db, "elec_games", gameId), {
        deck: availableCards,
        [playerCandidate]: playerData
    });
    return hand;
}

function chooseCard(cardName, card, cardSlot) {
    if (gameData.currentPlayer !== getPlayerCandidate(gameData)) return;

    if (cpMode || mediaMode || issuesMode) {
        if (cardSlot !== activeCard.cardSlot) return; 

        removeAllChildren(chooseButtonsContainer);
        chooseTitle.innerText = "Finalize these moves?";

        const finalizeButton = document.createElement("button");
        finalizeButton.innerText = "Finalize";
        const resetButton = document.createElement("button");
        resetButton.innerText = "Reset";
        
        chooseButtonsContainer.appendChild(finalizeButton);
        chooseButtonsContainer.appendChild(resetButton);
        
        if (cpMode) onclickCpMode(finalizeButton, resetButton, cardSlot, cardName, card);
        if (mediaMode) onclickMediaMode(finalizeButton, resetButton, cardSlot, cardName, card);
        if (issuesMode) onclickIssuesMode(finalizeButton, resetButton, cardSlot, cardName, card);

        removeCSSClass(choosePopup, "hidden");
        return;
    }

    const {eventButton, cpButton, mediaButton, issueButton} = showCardPopup();

    cpButton.onclick = () => {
        cardSlot.pointsCover.innerText = card.points;
        if (card.points === 0) cardSlot.pointsCover.innerText = "Done?";
        removeCSSClass(cardSlot.pointsCover, "hidden");
        cpMode = true;
        pointsRemaining = card.points;
        activeCard = {
            card: card,
            cardSlot: cardSlot
        };
        hidePopup();
        stateNames.forEach(name => stateButtons[name].button.onclick = () => clickedState(name, cardSlot));
    };
    mediaButton.onclick = () => {
        mediaPoints = grabBagIsKennedy(card.points);
        if (!playerIsKennedy(gameData)) {
            mediaPoints = card.points - mediaPoints;
        }

        cardSlot.pointsCover.innerText = mediaPoints;
        if (mediaPoints === 0) cardSlot.pointsCover.innerText = "Done?";
        removeCSSClass(cardSlot.pointsCover, "hidden");
        mediaMode = true;
        pointsRemaining = mediaPoints;
        activeCard = {
            card: card,
            cardSlot: cardSlot
        };
        hidePopup();
        Object.values(mediaButtons).forEach(bt => bt.button.onclick = () => clickedMedia(bt.dataKey, cardSlot));
    };
    issueButton.onclick = () => {
        cardSlot.pointsCover.innerText = card.points;
        if (card.points === 0) cardSlot.pointsCover.innerText = "Done?";
        removeCSSClass(cardSlot.pointsCover, "hidden");
        issuesMode = true;
        issuesBought = [];
        pointsRemaining = card.points;
        activeCard = {
            card: card,
            cardSlot: cardSlot
        };
        hidePopup();
        Object.keys(issueButtons).forEach(i => issueButtons[i].button.onclick = () => clickedIssue(i, cardSlot));
    };
}

function onclickCpMode(finalizeButton, resetButton, cardSlot, cardName, card) {
    finalizeButton.onclick = () => {
        cpMode = false;
        usedCard(cardSlot, cardName, card);
    };
    resetButton.onclick = async () => {
        const gameData = (await getDoc(doc(db, "elec_games", gameId))).data();
        gameUpdate(gameData);
        addCSSClass(cardSlot.pointsCover, "hidden");
        pointsRemaining = -1;
        cpMode = false;
        activeCard = null;
        addCSSClass(choosePopup, "hidden");
    };
}

function onclickMediaMode(finalizeButton, resetButton, cardSlot, cardName, card) {
    finalizeButton.onclick = () => {
        mediaMode = false;
        usedCard(cardSlot, cardName, card);
    };
    resetButton.onclick = async () => {
        const gameData = (await getDoc(doc(db, "elec_games", gameId))).data();
        gameUpdate(gameData);
        pointsRemaining = mediaPoints;
        cardSlot.pointsCover.innerText = mediaPoints;
        addCSSClass(choosePopup, "hidden");
    };
}

function onclickIssuesMode(finalizeButton, resetButton, cardSlot, cardName, card) {
    finalizeButton.onclick = () => {
        issuesMode = false;
        usedCard(cardSlot, cardName, card);
    };
    resetButton.onclick = async () => {
        const gameData = (await getDoc(doc(db, "elec_games", gameId))).data();
        gameUpdate(gameData);
        addCSSClass(cardSlot.pointsCover, "hidden");
        pointsRemaining = -1;
        issuesMode = false;
        activeCard = null;
        addCSSClass(choosePopup, "hidden");
    };
}

function usedCard(cardSlot, cardName, card) {
    addCSSClass(cardSlot.pointsCover, "hidden");
    pointsRemaining = -1;
    activeCard = null;
    addCSSClass(choosePopup, "hidden");

    const playerCandidate = getPlayerCandidate(gameData);
    const playerData = gameData[playerCandidate];
    playerData.hand = playerData.hand.filter(name => name != cardName);
    playerData.rest += 4 - card.points;
    updateDoc(doc(db, "elec_games", gameId), {
        cubes: gameData.cubes,
        media: gameData.media,
        issueScores: gameData.issueScores,
        endorsements: gameData.endorsements,
        [playerCandidate]: playerData,
        currentPlayer: getOtherCandidate(gameData),
        discard: [...gameData.discard, cardName]
    });
}

function losePoints(count, cardSlot) {
    pointsRemaining -= count;
    showPoints(pointsRemaining, cardSlot);
}
function movementRegion(stateName) {
    if (stateName === "hawaii" || stateName === "alaska") {
        return stateName;
    } else {
        return stateRegion[stateName];
    }
}
function moveCost(srcReg, dstReg) {
    if (srcReg === dstReg) return 0;
    return 1 + moveCost(movePath[srcReg][dstReg], dstReg);
}
function clickedState(stateName, cardSlot){
    if (!cpMode) return;
    if (pointsRemaining <= 0) return;
    const playerCandidate = getPlayerCandidate(gameData);
    const playerLocation = gameData[playerCandidate].state;
    const dp = playerCandidate === "nixon" ? 1 : -1;

    const mc = moveCost(movementRegion(playerLocation), movementRegion(stateName));
    if (mc > pointsRemaining) return;
    losePoints(mc, cardSlot);
    gameData[playerCandidate].state = stateName;
    moveIconTo(playerCandidate === "nixon" ?  nixonIcon : kennedyIcon, stateName);

    if (pointsRemaining <= 0) return;
    losePoints(1, cardSlot);
    gameData.cubes[stateName] += dp;
    showCubes(gameData);
}

function clickedMedia(mediaName, cardSlot) {
    if (!mediaMode) return;
    if (pointsRemaining <= 0) return;

    const playerCandidate = getPlayerCandidate(gameData);
    const dp = playerCandidate === "nixon" ? 1 : -1;

    gameData.media[mediaName] += dp;
    losePoints(1, cardSlot);
    showMedia(gameData);
}

function clickedIssue(index, cardSlot) {
    if (!issuesMode) return;
    if (pointsRemaining <= 0) return;

    const issueName = gameData.issues[index];
    const cost = issuesBought.includes(issueName) ? 2 : 1;
    if (pointsRemaining < cost) return;

    const playerCandidate = getPlayerCandidate(gameData);
    const dp = playerCandidate === "nixon" ? 1 : -1;
    gameData.issueScores[issueName] += dp;
    losePoints(cost, cardSlot);
    showMedia(gameData);
    issuesBought.push(issueName);
}

async function enterGame(gameId_) {
    gameId = gameId_;
    removeCSSClass(gamePage, "hidden");
    const gameData = (await getDoc(doc(db, "elec_games", gameId))).data();
    gameUpdate(gameData);
    showCubes(gameData);
}

function gameUpdate(data) {
    gameData = data;
    if (!gameData.started) return;
    updateCubes(gameData);

    showEndorsements(gameData);
    showMedia(gameData);
    showMedia(gameData);
    moveIcons(gameData);
    const playerCandidate = getPlayerCandidate(gameData);
    if (data.currentPlayer === playerCandidate) {
        removeCSSClass(turnIndicator, "hidden");
    } else {
        addCSSClass(turnIndicator, "hidden");
    }

    if (gameData.phase === PHASE.CHOOSE_FIRST && gameData.choosingPlayer === playerCandidate) {
        removeAllChildren(chooseButtonsContainer);
        chooseTitle.innerText = "Would you like to go first or second?";

        const firstButton = document.createElement("button");
        firstButton.innerText = "First";
        const secondButton = document.createElement("button");
        secondButton.innerText = "Second";
        
        chooseButtonsContainer.appendChild(firstButton);
        chooseButtonsContainer.appendChild(secondButton);

        removeCSSClass(choosePopup, "hidden");
        firstButton.onclick = () => {
            updateDoc(doc(db, "elec_games", gameId), {
                currentPlayer: playerCandidate,
                phase: PHASE.PLAY_CARDS
            });
            addCSSClass(choosePopup, "hidden");
        };
        secondButton.onclick = () => {
            updateDoc(doc(db, "elec_games", gameId), {
                currentPlayer: (playerCandidate === "kennedy" ? "nixon" : "kennedy"),
                phase: PHASE.PLAY_CARDS
            });
            addCSSClass(choosePopup, "hidden");
        };
        return;
    }

    if (gameData[playerCandidate].hand.length > 0 || (gameData.currentPlayer === playerCandidate && gameData.phase === PHASE.PLAY_CARDS)) {
        getHand(gameData, user.email)
            .then(hand => displayHand(hand, gameData[playerCandidate].exhausted, playerCandidate, chooseCard));
    }
}