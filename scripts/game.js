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

let gameData = null;
let showingElectors = false;
let canEscapePopup = false;
let cpMode = false;
let mediaMode = false;
let issuesMode = false;
let activeCard = null;
let pointsRemaining = -1;
let mediaPoints = 0;
let issuesBought = [];

async function setup(user_, db_, doc_, collection_, query_, getDoc_, setDoc_, getDocs_, deleteDoc_, updateDoc_, onSnapshot_) {
    user = user_;
    db = db_;
    doc = doc_;
    collection = collection_;
    query = query_;
    getDoc = getDoc_;
    setDoc = setDoc_;
    getDocs = getDocs_;
    deleteDoc = deleteDoc_;
    updateDoc = updateDoc_;
    onSnapshot = onSnapshot_;

    gameIdsField.innerText = (await getGames()).join("\n");
    userNameField.innerText = `Logged in as ${user.displayName} (${user.email})`;
}

async function getGamePlayers(gameId) {
    const gamePlayers = await getDocs(query(collection(db, "elec_games", gameId, "players")));
    return gamePlayers.docs.map(doc => doc.id);
}

async function getGames() {
    const userGames = await getDocs(query(collection(db, "users", user.email, "elec_games")));
    return gameIdsField.innerText = userGames.docs.map(doc => doc.id);
}

async function makeGame() {
    const newGameRef = doc(collection(db, "users", user.email, "elec_games"));
    const gameId = newGameRef.id;
    await setDoc(newGameRef, {});

    await setDoc(doc(db, "elec_games", gameId), {
        started: false,
        owner: user.email
    });

    await joinGame(gameId);
    gameIdsField.innerText = (await getGames()).join("\n");
}
createGameButton.onclick = makeGame;

async function joinGame(gameId) {
    const gameRef = doc(db, "elec_games", gameId);
    const gameEntry = await getDoc(gameRef);
    if (!gameEntry.exists()) {
        console.error("Failed to join game, doesn't exist");
        return;
    }

    onSnapshot(gameRef, game => gameUpdate(game.data()));

    if (gameEntry.data().started) {
        addCSSClass(joinPage, "hidden");
        enterGame(gameId);
        return;
    }

    await setDoc(doc(db, "users", user.email, "elec_games", gameId), {});
    await setDoc(doc(db, "elec_games", gameId, "players", user.email), {});
    const gamePlayerEmails = await getGamePlayers(gameId);
    const otherPlayerEmail = gamePlayerEmails.filter(email => email != user.email)[0];
    if (gamePlayerEmails.length >= 2) {
        addCSSClass(joinPage, "hidden");
        startGame(gameId, user.email, otherPlayerEmail);
    }
}
joinGameButton.onclick = () => joinGame(gameCodeField.value);

async function deleteGame(gameId) {
    const gamePlayerEmails = await getGamePlayers(gameId);
    await Promise.all(gamePlayerEmails.map(email => 
        deleteDoc(doc(db, "users", email, "elec_games", gameId))
    ));
    await Promise.all(gamePlayerEmails.map(email =>
        deleteDoc(doc(db, "elec_games", gameId, "players", email))
    ));
    
    await deleteDoc(doc(db, "elec_games", gameId));
}
deleteGameButton.onclick = () => deleteGame(gameCodeField.value);

async function startGame(gameId, selfPlayer, otherPlayer) {
    const order = Object.keys(ISSUE_URLS);
    const issues = [];
    for (let i = 0; i < Object.keys(ISSUE_URLS).length; i++) {
        const index = Math.floor(Math.random() * order.length);
        issues[i] = order[index];
        order.splice(index, 1);
    }

    await updateDoc(doc(db, "elec_games", gameId), {
        cubes: defaultCounts,
        issues: issues,
        choosingPlayer: Math.random() < 0.5 ? "kennedy" : "nixon"
    });
    removeCSSClass(choosePage, "hidden");
    kennedyButton.onclick = () => choosePlayer(gameId, true, selfPlayer, otherPlayer);
    nixonButton.onclick = () => choosePlayer(gameId, false, selfPlayer, otherPlayer);
}

async function choosePlayer(gameId, isKennedy, selfPlayer, otherPlayer) {
    await updateDoc(doc(db, "elec_games", gameId), {
        started: true,
        round: 1,
        currentPlayer: null,
        phase: PHASE.CHOOSE_FIRST,
        kennedy: {
            email: isKennedy ? selfPlayer : otherPlayer,
            bag: 0,
            hand: [],
            state: "california",
            rest: 0
        },
        nixon: {
            email: isKennedy ? otherPlayer : selfPlayer,
            bag: 0,
            hand: [],
            state: "massachusetts",
            rest: 0
        },
        deck: Object.keys(CARDS),
        discard: [],
        endorsements: {
            west: 0,
            east: 0,
            mid: 0,
            south: 0
        },
        media: {
            west: 0,
            east: 0,
            mid: 0,
            south: 0
        },
        issueScores: {
            [Object.keys(ISSUE_URLS)[0]]: 0,
            [Object.keys(ISSUE_URLS)[1]]: 0,
            [Object.keys(ISSUE_URLS)[2]]: 0
        }
    });
    addCSSClass(choosePage, "hidden");
    enterGame(gameId);
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

function showEndorsements() {
    for (id in endorseButtons) {
        const val = endorseButtons[id];
        val.setCount(gameData.endorsements[val.dataKey]);
    }
}

function showMedia() {
    for (id in mediaButtons) {
        const val = mediaButtons[id];
        val.setCount(gameData.media[val.dataKey]);
    }
}

function showIssues() {
    for (index in issueButtons) {
        const val = issueButtons[index];
        const issueName = gameData.issues[index];
        val.setCount(gameData.issueScores[issueName]);
        val.button.style.backgroundImage = `url(${ISSUE_URLS[issueName]})`;
    }
}

function showCubes() {
    stateNames.forEach(state => {
        stateButtons[state].setCount(gameData.cubes[state]);
    });
}

function showElectors() {
    stateNames.forEach(state => {
        stateButtons[state].setText(electors[state]);
    });
}

function playerIsKennedy() {
    return gameData.kennedy.email === user.email;
}
function getPlayerCandidate() {
    return playerIsKennedy() ? "kennedy" : "nixon";
}
function getOtherCandidate() {
    return playerIsKennedy() ? "nixon" : "kennedy";
}
async function getHand(gameEntry) {
    const handSize = 6;

    const availableCards = gameEntry.deck;
    const playerCandidate = getPlayerCandidate();
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
async function displayHand(gameEntry, email) {
    const hand = await getHand(gameEntry, email);
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
            chooseCard(cardName, card, cardSlot);
        }
    }
}

function chooseCard(cardName, card, cardSlot) {
    if (gameData.currentPlayer !== getPlayerCandidate()) return;

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

    removeAllChildren(chooseButtonsContainer);
    chooseTitle.innerText = `What would you like to use '${cardName}' for?`;

    const eventButton = document.createElement("button");
    eventButton.innerText = "Event";
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
    canEscapePopup = true;

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
        if (!playerIsKennedy()) {
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

    removeCSSClass(choosePopup, "hidden");
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

    const playerCandidate = getPlayerCandidate();
    const playerData = gameData[playerCandidate];
    playerData.hand = playerData.hand.filter(name => name != cardName);
    playerData.rest += 4 - card.points;
    updateDoc(doc(db, "elec_games", gameId), {
        cubes: gameData.cubes,
        media: gameData.media,
        issueScores: gameData.issueScores,
        endorsements: gameData.endorsements,
        [playerCandidate]: playerData,
        currentPlayer: getOtherCandidate(),
        discard: [...gameData.discard, cardName]
    });
}

function losePoints(count, cardSlot) {
    pointsRemaining -= count;
    cardSlot.pointsCover.innerText = pointsRemaining;
    if (pointsRemaining === 0) {
        cardSlot.pointsCover.innerText = "Done?";
    }
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
    const playerCandidate = getPlayerCandidate();
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
    showCubes();
}

function clickedMedia(mediaName, cardSlot) {
    if (!mediaMode) return;
    if (pointsRemaining <= 0) return;

    const playerCandidate = getPlayerCandidate();
    const dp = playerCandidate === "nixon" ? 1 : -1;

    gameData.media[mediaName] += dp;
    losePoints(1, cardSlot);
    showMedia();
}

function clickedIssue(index, cardSlot) {
    if (!issuesMode) return;
    if (pointsRemaining <= 0) return;

    const issueName = gameData.issues[index];
    const cost = issuesBought.includes(issueName) ? 2 : 1;
    if (pointsRemaining < cost) return;

    const playerCandidate = getPlayerCandidate();
    const dp = playerCandidate === "nixon" ? 1 : -1;
    gameData.issueScores[issueName] += dp;
    losePoints(cost, cardSlot);
    showIssues();
    issuesBought.push(issueName);
}

async function enterGame(gameId_) {
    gameId = gameId_;
    removeCSSClass(gamePage, "hidden");
    const gameData = (await getDoc(doc(db, "elec_games", gameId))).data();
    gameUpdate(gameData);
    showCubes();
}

function hidePopup() {
    addCSSClass(choosePopup, "hidden");
    canEscapePopup = false;
}
function toggleShowElectors() {
    if (showingElectors) {
        showCubes();
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

function moveIconTo(icon, state) {
    const locStyle = window.getComputedStyle(stateButtons[state].button);
    icon.style.left = locStyle.getPropertyValue("left");
    icon.style.top = locStyle.getPropertyValue("top");
}
function moveIcons(gameData) {
    moveIconTo(kennedyIcon, gameData.kennedy.state);
    moveIconTo(nixonIcon, gameData.nixon.state);
}

function gameUpdate(data) {
    gameData = data;
    if (!showingElectors) showCubes();
    if (!gameData.started) return;

    showEndorsements();
    showMedia();
    showIssues();
    moveIcons(gameData);
    const playerCandidate = getPlayerCandidate();
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
        displayHand(gameData, user.email);
    }
}