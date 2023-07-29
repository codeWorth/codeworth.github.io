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

const fbPromises = new FbPromises();
let gameSetup = null;
let gameData = null;

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
        if (isKennedy) {
            gameData.kennedy.bag--;
            kenCount++;
        } else {
            gameData.nixon.bag--;
        }
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

async function selectCard(hand) {
    const playerCandidate = getPlayerCandidate(gameData);
    const cardItems = displayHand(
        hand, 
        gameData[playerCandidate].exhausted, 
        playerCandidate
    );
    const selectedCard = await awaitClickAndReturn(cardItems);
    cardChosen(selectedCard.name, selectedCard.card, selectedCard.cardSlot, selectedCard.isCandidate);
}

async function cardChosen(cardName, card, cardSlot, isCandidate) {
    const playerCandidate = getPlayerCandidate(gameData);
    if (gameData.currentPlayer !== playerCandidate) return;

    const {eventButton, cpButton, mediaButton, issueButton} = showCardPopup(cardName, isCandidate);
    escapePopup = new Deferred();
    const selectedButton = await Promise.any(
        awaitClick(eventButton, cpButton, mediaButton, issueButton, choosePopup),
        escapePopup.promise
    );
    hidePopup();

    if (selectedButton === eventButton) {

    } else if (selectedButton === cpButton) {

        showPointsOnCard(cardSlot.pointsCover, card.points);

        const done = new Deferred();
        cardSlot.onclick = () => done.resolve(done.promise);
        await useCampaignPoints(card.points, cardSlot, done.promise);
        addCSSClass(cardSlot.pointsCover, "hidden");
        await confirmCardChoices(cardName, card);

    } else if (selectedButton === mediaButton) {

        const points = grabBagIsKennedy(card.points);
        if (!playerIsKennedy(gameData)) {
            points = card.points - points;
        }
        showPointsOnCard(cardSlot.pointsCover, points);

        const done = new Deferred();
        cardSlot.onclick = () => done.resolve(done.promise);

        await useMediaPoints(points, cardSlot, done.promise);
        addCSSClass(cardSlot.pointsCover, "hidden");
        while (await confirmCardChoices(cardName, card)) {
            showPointsOnCard(cardSlot.pointsCover, points);
            await useMediaPoints(points, cardSlot, done.promise);
        }

    } else if (selectedButton === mediaButton) {

        showPointsOnCard(cardSlot.pointsCover, card.points);

        const done = new Deferred();
        cardSlot.onclick = () => done.resolve(done.promise);
        await useIssuePoints(card.points, cardSlot, done.promise);
        addCSSClass(cardSlot.pointsCover, "hidden");
        await confirmCardChoices(cardName, card);

    }
}

async function useCampaignPoints(points, cardSlot, donePromise) {
    const stateButtons = stateNames.map(name => ({
        name: name,
        button: stateButtons[name].button
    }));

    let exited = false;
    while (points > 0) {
        const buttonClicked = await Promise.any(
            awaitClickAndReturn(stateButtons),
            donePromise
        );

        if (buttonClicked === donePromise) {
            exited = true;
            break;
        } else {
            points = spendState(buttonClicked.name, points);
            showPoints(points, cardSlot);
        }
    }

    if (!exited) await donePromise;
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
function spendState(stateName, points){
    const playerCandidate = getPlayerCandidate(gameData);
    const playerLocation = gameData[playerCandidate].state;

    const mc = moveCost(movementRegion(playerLocation), movementRegion(stateName));
    if (mc > points) return points;

    points -= mc;
    gameData[playerCandidate].state = stateName;
    moveIconTo(playerCandidate === NIXON ?  nixonIcon : kennedyIcon, stateName);
    if (points <= 0) return points;

    points--;
    gameData.cubes[stateName] += candidateDp(playerCandidate);
    showCubes(gameData);
    return points;
}

async function useMediaPoints(points, cardSlot, donePromise) {
    const playerCandidate = getPlayerCandidate(gameData);
    const mediaItems = Object.values(mediaButtons).map(bt => ({
        name: bt.dataKey,
        button: bt.button
    }));

    while (points > 0) {
        const buttonClicked = await Promise.any(
            awaitClickAndReturn(mediaItems),
            donePromise
        );

        if (buttonClicked === donePromise) {
            exited = true;
            break;
        } else {
            gameData.media[buttonClicked.name] += candidateDp(playerCandidate);
            points--;
            showMedia(gameData);
            showPoints(points, cardSlot);
        }
    }

    if (!exited) await donePromise;
}

async function useIssuePoints(points, cardSlot, donePromise) {
    const issuesBought = [];
    const issueItems = Object.keys(issueButtons).map(index => ({
        name: gameData.issues[index],
        button: issueButtons[index].button
    }));

    while (points > 0) {
        const buttonClicked = await Promise.any(
            awaitClickAndReturn(issueItems),
            donePromise
        );

        if (buttonClicked === donePromise) {
            exited = true;
            break;
        } else {
            points = spendIssue(buttonClicked.name, points, issuesBought);
            showPoints(points, cardSlot);
        }
    }

    if (!exited) await donePromise;    
}
function spendIssue(issueName, points, issuesBought) {
    const cost = issuesBought.includes(issueName) ? 2 : 1;
    if (points < cost) return points;

    const playerCandidate = getPlayerCandidate(gameData);
    gameData.issueScores[issueName] += candidateDp(playerCandidate);
    points -= cost;
    showMedia(gameData);
    issuesBought.push(issueName);
}

async function confirmCardChoices(cardName, card) {
    const {finalizeButton, resetButton} = finalizePopup();
    const popupButton = await awaitClick(finalizeButton, resetButton);
    
    addCSSClass(choosePopup, "hidden");
    if (popupButton === finalizeButton) {
        usedCard(cardName, card);
        return true;
    } else if (popupButton === resetButton) {
        const gameData = (await getDoc(doc(db, "elec_games", gameId))).data();
        gameUpdate(gameData);
        return false;
    }
}

function usedCard(cardName, card) {
    const playerCandidate = getPlayerCandidate(gameData);
    const playerData = gameData[playerCandidate];
    playerData.hand = playerData.hand.filter(name => name != cardName);
    if (card.isCandidate) playerData.exhausted = true;
    if (!card.isCandidate) playerData.rest += 4 - card.points;
    nextTurn(playerData, playerCandidate, cardName);
}

function nextTurn(playerData, playerCandidate, cardName) {
    gameData.turn++;
    gameData[playerCandidate] = playerData;
    const updateData = {
        turn: gameData.turn,
        cubes: gameData.cubes,
        media: gameData.media,
        issueScores: gameData.issueScores,
        endorsements: gameData.endorsements,
        [playerCandidate]: playerData,
        currentPlayer: getOtherCandidate(gameData),
        discard: [...gameData.discard, cardName]
    };

    if (gameData.turn === TURNS_PER_ROUND) {
        updateData.currentPlayer = null;
        updateDoc(doc(db, "elec_games", gameId), updateData)
            .then(() => endPlayPhase(gameData));
    } else {
        updateDoc(doc(db, "elec_games", gameId), updateData);
    }
}

async function endPlayPhase(gameData) {
    const updateData = {
        kennedy: gameData.kennedy,
        nixon: gameData.nixon
    };

    updateData.phase = PHASE.MOMENTUM;
    updateData.turns = 0;
    updateData.kennedy.momentum = Math.ceil(gameData.kennedy.momentum / 2);
    updateData.nixon.momentum = Math.ceil(gameData.nixon.momentum / 2);

    const media = REGIONS
        .map(region => gameData.media[region] ? gameData.media[region] : 0)
        .reduce((a,b)=>a+b, 0);
    if (media > 0) {
        updateData.choosingPlayer = NIXON;
        updateData.phase = PHASE.ISSUE_SWAP;
    } else if (media < 0) {
        updateData.choosingPlayer = KENNEDY;
        updateData.phase = PHASE.ISSUE_SWAP;
    }

    await updateDoc(doc(db, "elec_games", gameId), updateData);
    await fbPromises.await(data => data.phase === PHASE.MOMENTUM);
    momentumAwards(gameData);
}
async function momentumAwards(gameData) {
    const issue1Name = gameData.issues[0];
    const issue2Name = gameData.issues[1];
    const issue3Name = gameData.issues[2];

    const issue1Score = gameData.issueScores[issue1Name];
    const issue2Score = gameData.issueScores[issue2Name];
    const issue3Score = gameData.issueScores[issue3Name];

    let updateData = {
        kennedy: gameData.kennedy,
        nixon: gameData.nixon
    };
    if (issue3Score > 0) {
        updateData.nixon.momentum++;
    } else if (issue3Score < 0) {
        updateData.kennedy.momentum++;
    }

    if (issue2Score > 0) {
        updateData.choosingPlayer = NIXON;
        updateData.phase = PHASE.ISSUE_REWARD_CHOICE;
    } else if (issue2Score < 0) {
        updateData.choosingPlayer = KENNEDY;
        updateData.phase = PHASE.ISSUE_REWARD_CHOICE;
    }
    await updateDoc(doc(db, "elec_games", gameId), updateData);
    await fbPromises.await(data => data.phase === PHASE.MOMENTUM);

    updateData = {
        kennedy: gameData.kennedy,
        nixon: gameData.nixon
    };
    if (issue1Score > 0) {
        updateData.nixon.momentum++;
        updateData.phase = PHASE.ENDORSE_REWARD;
        updateData.choosingPlayer = NIXON;
    } else {
        updateData.kennedy.momentum++;
        updateData.phase = PHASE.ENDORSE_REWARD;
        updateData.choosingPlayer = KENNEDY;
    }
    await updateDoc(doc(db, "elec_games", gameId), updateData);
    await fbPromises.await(data => data.phase === PHASE.MOMENTUM);
}

async function chooseIssueReward() {
    const {momentumButton, endorsementButton} = rewardChoicePopup();
    const choiceButton = await awaitClick(momentumButton, endorsementButton);
    addCSSClass(choosePopup, "hidden");

    if (choiceButton === momentumButton) {
        gameData[playerCandidate].momentum++;
        updateDoc(doc(db, "elec_games", gameId), {
            [playerCandidate]: gameData[playerCandidate],
            phase: PHASE.MOMENTUM,
            choosingPlayer: null
        });
    } else if (choiceButton === endorsementButton) {
        const endorseCard = drawEndorsementCard();
        useEndorsementCard(endorseCard, PHASE.MOMENTUM);
    }
}

function drawEndorsementCard() {
    const cardIndex = Math.floor(Math.random() * gameData.endorsementsDeck.length);
    const card = gameData.endorsementsDeck[cardIndex];
    gameData.endorsementsDeck.splice(cardIndex, 1);
    updateDoc(doc(db, "elec_games", gameId), {
        endorsementsDeck: gameData.endorsementsDeck
    });
    return card;
}
async function useEndorsementCard(endorseCard, endPhase) {
    const playerCandidate = getPlayerCandidate(gameData);

    if (endorseCard === REGIONS.ALL) {
        showChooseEndorseRegion();
        const endorseItems = Object.values(endorseButtons).map(bt => ({
            name: bt.dataKey,
            button: bt.button
        }));
        const clickedEndorsement = await awaitClickAndReturn(endorseItems);

        gameData.endorsements[clickedEndorsement.name] += candidateDp(playerCandidate);
    } else {
        gameData.endorsements[endorseCard] += candidateDp(playerCandidate);
    }

    updateDoc(doc(db, "elec_games", gameId), {
        endorsements: gameData.endorsements,
        phase: endPhase,
        choosingPlayer: null
    });
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
    fbPromises.update(data);
    if (!gameData.started) return;
    updateCubes(gameData);

    const playerCandidate = getPlayerCandidate(gameData);
    showEndorsements(gameData);
    showMedia(gameData);
    showMedia(gameData);
    moveIcons(gameData);
    showRound(gameData, playerCandidate);
    infoDiv.innerText = "";
    showBagRoll(gameData);

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
                phase: PHASE.PLAY_CARDS,
                choosingPlayer: null
            });
            addCSSClass(choosePopup, "hidden");
        };
        secondButton.onclick = () => {
            updateDoc(doc(db, "elec_games", gameId), {
                currentPlayer: (playerCandidate === KENNEDY ? NIXON : KENNEDY),
                phase: PHASE.PLAY_CARDS,
                choosingPlayer: null
            });
            addCSSClass(choosePopup, "hidden");
        };
        return;
    }
    
    if (gameData[playerCandidate].hand.length > 0 || (gameData.currentPlayer === playerCandidate && gameData.phase === PHASE.PLAY_CARDS)) {
        getHand(gameData, user.email).then(selectCard);
        return;
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === PHASE.ISSUE_SWAP) {
        showShouldSwap();
        Object.keys(issueButtons).forEach(i => issueButtons[i].button.onclick = () => {
            if (gameData.phase !== PHASE.ISSUE_SWAP) return;
            if (i === 0) return;
            const issue = gameData.issues[i];
            const swapIssue = gameData.issues[i - 1];
            gameData.issues[i] = swapIssue;
            gameData.issues[i - 1] = issue;

            updateDoc(doc(db, "elec_games", gameId), {
                issues: gameData.issues,
                phase: PHASE.MOMENTUM,
                choosingPlayer: null
            }).then(() => momentumAwards(gameData, {
                kennedy: gameData.kennedy,
                nixon: gameData.nixon
            }));
        });
        return;
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === PHASE.ISSUE_REWARD_CHOICE) {
        chooseIssueReward();
        return;
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === PHASE.ENDORSE_REWARD) {
        useEndorsementCard(drawEndorsementCard(), PHASE.MOMENTUM);
    }
}