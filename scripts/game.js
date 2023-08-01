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
let cancelUI = new AbortController();

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

async function selectCard(cardItems) {
    let choseCard = false;

    if (gameData.lastRoll === null) {
        const selectedCard = await awaitClickAndReturn(...cardItems);
        choseCard = await cardChosen(
            selectedCard.name, 
            selectedCard.card, 
            selectedCard.cardSlot,
            selectedCard.isCandidate
        );
    } else {
        const selectedCard = cardItems.find(item => item.name === gameData.lastRoll.cardName);
        choseCard = await alreadyChoseMediaCard(
            selectedCard.name, 
            selectedCard.card, 
            selectedCard.cardSlot, 
            gameData.lastRoll.points
        );
    }

    if (choseCard) {
        nextTurn(selectedCard.name);
    } else {
        selectCard(cardItems);
    }
}

async function alreadyChoseMediaCard(cardName, card, cardSlot, points) {
    showPointsOnCard(cardSlot.pointsCover, points);

    await useMediaPoints(points, cardSlot, cardSlot.card);
    addCSSClass(cardSlot.pointsCover, "hidden");
    return await confirmCardChoices(cardName, card);
}

async function cardChosen(cardName, card, cardSlot, isCandidate) {
    const playerCandidate = getPlayerCandidate(gameData);
    if (gameData.currentPlayer !== playerCandidate) return {};

    const {eventButton, cpButton, mediaButton, issueButton} = showCardPopup(cardName, isCandidate);
    const selectedButton = await popupSelector()
        .withAwaitClick(choosePopup)
        .withAwaitKey(document, "Escape")
        .build();

    if (selectedButton === eventButton) {
        return {};
    }
    if (selectedButton === cpButton) {
        showPointsOnCard(cardSlot.pointsCover, card.points);

        await useCampaignPoints(card.points, cardSlot, cardSlot.card);
        addCSSClass(cardSlot.pointsCover, "hidden");
        return confirmCardChoices(cardName, card);
    }
    if (selectedButton === mediaButton) {
        const points = grabBagIsKennedy(card.points);
        if (!playerIsKennedy(gameData)) {
            points = card.points - points;
        }
        updateDoc(doc(db, "elec_games", gameId), {
            lastRoll: {
                points: points,
                cardName: cardName
            }
        });
        return false;
    }
    if (selectedButton === issueButton) {
        showPointsOnCard(cardSlot.pointsCover, card.points);

        await useIssuePoints(card.points, cardSlot, cardSlot.card);
        addCSSClass(cardSlot.pointsCover, "hidden");
        return await confirmCardChoices(cardName, card);
    }

    return false;
}

async function useCampaignPoints(points, cardSlot, doneButton) {
    const stateItems = stateNames.map(name => ({
        name: name,
        button: stateButtons[name].button
    }));

    let exited = false;
    while (points > 0) {
        const buttonClicked = await Deferred()
            .withAwaitClickAndReturn(...stateItems)
            .withAwaitClick(doneButton)
            .build();

        if (buttonClicked === doneButton) {
            exited = true;
            break;
        } else {
            points = spendState(buttonClicked.name, points);
            showPoints(points, cardSlot);
        }
    }

    if (!exited) await awaitClick(doneButton);
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

async function useMediaPoints(points, cardSlot, doneButton) {
    const playerCandidate = getPlayerCandidate(gameData);
    const mediaItems = Object.values(mediaButtons).map(bt => ({
        name: bt.dataKey,
        button: bt.button
    }));

    let exited = false;
    while (points > 0) {
        const buttonClicked = await Deferred()
            .withAwaitClickAndReturn(...mediaItems)
            .withAwaitClick(doneButton)
            .build();

        if (buttonClicked === doneButton) {
            exited = true;
            break;
        } else {
            gameData.media[buttonClicked.name] += candidateDp(playerCandidate);
            points--;
            showMedia(gameData);
            showPoints(points, cardSlot);
        }
    }

    if (!exited) await awaitClick(doneButton);
}

async function useIssuePoints(points, cardSlot, doneButton) {
    const issuesBought = [];
    const issueItems = Object.keys(issueButtons).map(index => ({
        name: gameData.issues[index],
        button: issueButtons[index].button
    }));

    let exited = false;
    while (points > 0) {
        const buttonClicked = await Deferred()
            .withAwaitClickAndReturn(...issueItems)
            .withAwaitClick(doneButton)
            .build();

        if (buttonClicked === doneButton) {
            exited = true;
            break;
        } else {
            points = spendIssue(buttonClicked.name, points, issuesBought);
            showPoints(points, cardSlot);
        }
    }

    if (!exited) await awaitClick(doneButton);
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
    const [finalizeButton, resetButton] = showPopup("Finalize these moves?", "Finalize", "Reset");
    const popupButton = await popupSelector().build();
    
    if (popupButton === finalizeButton) {
        return usedCard(cardName, card);
    } else if (popupButton === resetButton) {
        // const gameData = (await getDoc(doc(db, "elec_games", gameId))).data();
        return null;
    }
}

function usedCard(cardName, card) {
    const candidate = getPlayerCandidate(gameData);
    const updateData = {
        [candidate]: gameData.candidate
    };

    updateData[candidate].hand = gameData[candidate].hand.filter(name => name != cardName);
    if (card.isCandidate) updateData[candidate].exhausted = true;
    if (!card.isCandidate) updateData[candidate].rest += 4 - card.points;

    return updateData;
}

function nextTurn(cardName) {
    const candidate = getPlayerCandidate(gameData);
    gameData.turn++;

    const updateData = {
        turn: gameData.turn,
        cubes: gameData.cubes,
        media: gameData.media,
        issueScores: gameData.issueScores,
        endorsements: gameData.endorsements,
        [candidate]: gameData[candidate],
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

function endPlayPhase(gameData) {
    const updateData = {
        kennedy: gameData.kennedy,
        nixon: gameData.nixon
    };

    updateData.phase = PHASE.MOMENTUM;
    updateData.choosingPlayer = getPlayerCandidate(gameData);
    updateData.turns = 0;
    updateData.kennedy.momentum = Math.ceil(gameData.kennedy.momentum / 2);
    updateData.nixon.momentum = Math.ceil(gameData.nixon.momentum / 2);

    const media = Object.values(REGIONS)
        .map(region => gameData.media[region] ? gameData.media[region] : 0)
        .reduce((a,b)=>a+b, 0);
    if (media > 0) {
        updateData.choosingPlayer = NIXON;
        updateData.phase = PHASE.ISSUE_SWAP;
    } else if (media < 0) {
        updateData.choosingPlayer = KENNEDY;
        updateData.phase = PHASE.ISSUE_SWAP;
    }

    updateDoc(doc(db, "elec_games", gameId), updateData);
}

async function issueSwap() {
    showShouldSwap();
    const issueItems = Object.keys(issueButtons).map(index => ({
        index: index,
        button: issueButtons[index].button
    }));

    const issueClicked = await awaitClickAndReturn(cancelUI, ...issueItems);

    const i = issueClicked.index;
    if (i === 0) return issueSwap();

    const issue = gameData.issues[i];
    const swapIssue = gameData.issues[i - 1];
    gameData.issues[i] = swapIssue;
    gameData.issues[i - 1] = issue;

    return updateDoc(doc(db, "elec_games", gameId), {
        issues: gameData.issues,
        phase: PHASE.MOMENTUM
    });
}

function getIssue1Score() {
    const issue1Name = gameData.issues[0];
    return gameData.issueScores[issue1Name];
}
function momentumAwards() {
    const issue2Name = gameData.issues[1];
    const issue3Name = gameData.issues[2];

    const issue1Score = getIssue1Score();
    const issue2Score = gameData.issueScores[issue2Name];
    const issue3Score = gameData.issueScores[issue3Name];

    const updateData = {
        kennedy: gameData.kennedy,
        nixon: gameData.nixon
    };
    if (issue3Score > 0) {
        updateData.nixon.momentum++;
    } else if (issue3Score < 0) {
        updateData.kennedy.momentum++;
    }

    updateData.phase = PHASE.ISSUE1_ENDORSE_REWARD;
    if (issue2Score > 0) {
        updateData.choosingPlayer = NIXON;
        updateData.phase = PHASE.ISSUE_REWARD_CHOICE;
    } else if (issue2Score < 0) {
        updateData.choosingPlayer = KENNEDY;
        updateData.phase = PHASE.ISSUE_REWARD_CHOICE;
    }

    if (issue1Score > 0) {
        updateData.nixon.momentum++;
    } else if (issue1Score < 0) {
        updateData.kennedy.momentum++;
    }

    updateDoc(doc(db, "elec_games", gameId), updateData);
}

async function chooseIssueReward() {
    const [momentumButton, endorsementButton] = showPopup("Which issue reward do you want?", "Momentum", "Endorsement");
    const choiceButton = await popupSelector().build();

    const issue1Score = getIssue1Score();
    const updateData = {
        phase: PHASE.ISSUE1_ENDORSE_REWARD,
        choosingPlayer: issue1Score > 0 ? NIXON : KENNEDY
    };

    if (choiceButton === momentumButton) {
        const candidate = getPlayerCandidate(gameData);
        gameData[candidate].momentum++;
        updateData[candidate] = gameData[candidate];
    } else if (choiceButton === endorsementButton) {
        const endorseCard = drawEndorsementCard();
        updateData.endorsements = await useEndorsementCard(endorseCard);
    }

    updateDoc(doc(db, "elec_games", gameId), updateData);
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
async function useEndorsementCard(endorseCard) {
    const playerCandidate = getPlayerCandidate(gameData);
    const endorsements = gameData.endorsements;

    if (endorseCard === REGIONS.ALL) {
        showChooseEndorseRegion();
        const endorseItems = Object.values(endorseButtons).map(bt => ({
            name: bt.dataKey,
            button: bt.button
        }));
        const clickedEndorsement = await awaitClickAndReturn(...endorseItems);

        endorsements[clickedEndorsement.name] += candidateDp(playerCandidate);
    } else {
        endorsements[endorseCard] += candidateDp(playerCandidate);
    }

    return endorsements;
}

async function discardToCampaign() {
    const playerCandidate = getPlayerCandidate(gameData);
    const count = gameData.round <= 5 ? 1 : 2;
    const playerData = gameData[playerCandidate];
    showShouldDiscard(count);

    for (let i = 0; i < count; i++) {
        const cardItems = displayHand(playerData.hand, true, playerCandidate);
        const selectedCard = await awaitClickAndReturn(...cardItems);

        playerData.campaignDeck.push(selectedCard.name);
        playerData.hand = playerData.hand.filter(name => name !== selectedCard.name);
    }
    
    return playerData;
}

async function firstStrategy() {
    const playerCandidate = getPlayerCandidate(gameData);
    const updateData = {};

    Object.keys(gameData.issueScores).forEach(name => {
        const score = gameData.issueScores[name];
        gameData.issueScores[name] = score - Math.sign(score);
    })
    updateData.issueScores = gameData.issueScores;

    updateData[playerCandidate] = await discardToCampaign();
    updateData[playerCandidate].bag += updateData[playerCandidate].rest;
    updateData[playerCandidate].rest = 0;
    updateData.discard = [...gameData.discard, ...updateData[playerCandidate].hand];
    updateData[playerCandidate].hand = [];

    updateData.phase = PHASE.STRATEGY;
    updateData.choosingPlayer = getOtherCandidate(gameData);
    updateDoc(doc(db, "elec_games", gameId), updateData);
}

function initiativeCheck() {
    let kenCount = grabBagIsKennedy(2);
    if (kenCount === 2) {
        return { 
            kennedy: 2,
            nixon: 0
        };
    }
    if (kenCount === -2) {
        return { 
            kennedy: 0,
            nixon: 2
        };
    }

    if (grabBagIsKennedy(1) === 1) {
        return { 
            kennedy: 2,
            nixon: 1
        };
    } else {
        return { 
            kennedy: 1,
            nixon: 2
        };
    }
}

async function secondStrategy() {
    const playerCandidate = getPlayerCandidate(gameData);
    const updateData = {};

    updateData[playerCandidate] = await discardToCampaign();
    updateData[playerCandidate].bag += updateData[playerCandidate].rest;
    updateData[playerCandidate].rest = 0;
    updateData.discard = [...gameData.discard, ...updateData[playerCandidate].hand];
    updateData[playerCandidate].hand = [];

    const check = initiativeCheck();
    updateData.choosingPlayer = check.kennedy > check.nixon ? KENNEDY : NIXON;
    updateData.lastBagOut = {
        kennedy: check.kennedy,
        nixon: check.nixon,
        name: "Initiative"
    };

    updateData.phase = PHASE.CHOOSE_FIRST;
    updateData.turn = 0;
    updateData.round = gameData.round + 1;

    updateDoc(doc(db, "elec_games", gameId), updateData);
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

    const playerCandidate = getPlayerCandidate(gameData);
    showEndorsements(gameData);
    showMedia(gameData);
    showMedia(gameData);
    moveIcons(gameData);
    showRound(gameData, playerCandidate);
    infoDiv.innerText = "";
    showBagRoll(gameData);
    addCSSClass(choosePopup, "hidden");

    gameAction()
        .catch(error => {
            if (error.message !== CLEARED_MESSAGE) throw error;
        });
}

async function gameAction() {
    const playerCandidate = getPlayerCandidate(gameData);

    if (gameData.currentPlayer === playerCandidate && gameData.phase === PHASE.PLAY_CARDS) {
        const hand = await getHand(gameData, user.email);
        const cardItems = displayHand(
            hand, 
            gameData[playerCandidate].exhausted, 
            playerCandidate
        );
        return selectCard(cardItems);
    } else if (gameData[playerCandidate].hand.length > 0) {
        displayHand(
            gameData[playerCandidate].hand, 
            gameData[playerCandidate].exhausted, 
            playerCandidate
        );
    } 

    if (gameData.phase === PHASE.CHOOSE_FIRST && gameData.choosingPlayer === playerCandidate) {
        const [first, second] = showPopup("Would you like to go first or second?", "First", "Second");
        const selection = await popupSelector().build();
        
        if (selection === first) {
            return {
                currentPlayer: playerCandidate,
                phase: PHASE.PLAY_CARDS,
                choosingPlayer: null
            };
        } else if (selection === second) {
            return {
                currentPlayer: (playerCandidate === KENNEDY ? NIXON : KENNEDY),
                phase: PHASE.PLAY_CARDS,
                choosingPlayer: null
            };
        }
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === PHASE.ISSUE_SWAP) {
        return issueSwap();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === PHASE.MOMENTUM) {
        return momentumAwards();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === PHASE.ISSUE_REWARD_CHOICE) {
        return chooseIssueReward();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === PHASE.ISSUE1_ENDORSE_REWARD) {
        const issue1Score = getIssue1Score();
        if (issue1Score === 0) {
            return firstStrategy();
        } else {
            const endorsements = await useEndorsementCard(drawEndorsementCard());
            const updateData = await firstStrategy();
            updateData.endorsements = endorsements;
            return updateData;
        }
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === PHASE.STRATEGY) {
        return secondStrategy();
    }
}