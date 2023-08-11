import { 
    getPlayerCandidate, candidateDp,
    addCSSClass,
    playerIsKennedy,
    getOtherCandidate,
    moveCost,
    movementRegion
} from './util.js';
import { 
    awaitClick,
    awaitClickAndReturn,
    Deferred
} from "./deferred.js";
import { 
    showPointsOnCard, moveIconTo, 
    showCubes, showMedia, showIssues,
    showShouldSwap,
    showChooseEndorseRegion,
    showShouldDiscard,
    displayHand
} from "./view.js";
import { showCardPopup, showPopup, popupSelector } from "./popup.js";
import * as UI from "./dom.js";
import * as CONSTANTS from "./constants.js";
import { ENDORSE_REGIONS } from './cards.js';

class GameLogic {
    constructor(gameData, cancelSignal) {
        this.data = gameData;
        this.cancelSignal = cancelSignal;
    }

    grabBagIsKennedy(count) {
        let kenCount = 0;
    
        for (let i = 0; i < count; i++) {
            if (this.data.kennedy.bag == 0) {
                this.data.kennedy.bag = 12;
            }
            if (this.data.nixon.bag == 0) {
                this.data.nixon.bag = 12;
            }
    
            const bagItem = Math.floor(Math.random() * (this.data.kennedy.bag + this.data.nixon.bag));
            const isKennedy = bagItem < this.data.kennedy.bag;
            if (isKennedy) {
                this.data.kennedy.bag--;
                kenCount++;
            } else {
                this.data.nixon.bag--;
            }
        }
    
        return kenCount;
    }

    initiativeCheck() {
        let kenCount = this.grabBagIsKennedy(2);
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
    
        if (this.grabBagIsKennedy(1) === 1) {
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

    async chooseFirst() {
        const [first, second] = showPopup("Would you like to go first or second?", "First", "Second");
        const selection = await popupSelector(this.cancelSignal).build();
        
        this.data.phase = CONSTANTS.PHASE.PLAY_CARDS;
        this.data.choosingPlayer = null;
        if (selection === first) {
            this.data.currentPlayer = getPlayerCandidate(this.data);
        } else if (selection === second) {
            this.data.currentPlayer = getOtherCandidate(this.data);
        }
    }
    
    async getHand() {
        const handSize = 6;
    
        const availableCards = this.data.deck;
        const playerCandidate = getPlayerCandidate(this.data);
        const playerData = this.data[playerCandidate];
    
        if (playerData.hand.length > 0) {
            return playerData.hand;
        }
    
        const hand = [];
        for (let i = 0; i < handSize; i++) {
            hand.push(availableCards.splice(Math.floor(Math.random() * availableCards.length), 1)[0]);
        }
        playerData.hand = hand;
    
        return hand;
    }

    async playHand() {
        const hand = await this.getHand();

        const playerCandidate = getPlayerCandidate(this.data);
        const cardItems = displayHand(
            hand, 
            this.data[playerCandidate].exhausted, 
            playerCandidate
        );
        await this.selectCard(cardItems);
    }
    
    async selectCard(cardItems) {
        let selectedCard = null;
    
        if (this.data.lastRoll === null) {
            selectedCard = await awaitClickAndReturn(this.cancelSignal, ...cardItems);
            await this.cardChosen(
                selectedCard.name, 
                selectedCard.card, 
                selectedCard.cardSlot,
                selectedCard.isCandidate
            );
        } else {
            selectedCard = cardItems.find(item => item.name === this.data.lastRoll.cardName);
            await this.alreadyChoseMediaCard(
                selectedCard.name, 
                selectedCard.card, 
                selectedCard.cardSlot, 
                this.data.lastRoll.points
            );
            this.data.lastRoll = null;
        }
    
        if (this.data.lastRoll === null) {
            this.nextTurn(selectedCard.name);
        }
    }
    
    async alreadyChoseMediaCard(cardName, card, cardSlot, points) {
        showPointsOnCard(cardSlot.pointsCover, points);
    
        await this.useMediaPoints(points, cardSlot, cardSlot.card);
        addCSSClass(cardSlot.pointsCover, "hidden");
        const choseCard = await this.confirmCardChoices(cardName, card);
        if (!choseCard) throw CONSTANTS.RESET_SIGNAL;
    }
    
    async cardChosen(cardName, card, cardSlot, isCandidate) {
        const playerCandidate = getPlayerCandidate(this.data);
        if (this.data.currentPlayer !== playerCandidate) return false;
    
        const {eventButton, cpButton, issueButton, mediaButton} = showCardPopup(cardName, card, isCandidate);
        const selectedButton = await popupSelector(this.cancelSignal)
            .withAwaitClick(UI.choosePopup)
            .withAwaitKey(document, "Escape")
            .build();
    
        // if (selectedButton === eventButton) {}
        if (selectedButton === cpButton) {
            showPointsOnCard(cardSlot.pointsCover, card.points);
    
            await this.useCampaignPoints(card.points, cardSlot, cardSlot.card);
            addCSSClass(cardSlot.pointsCover, "hidden");
            const choseCard = await this.confirmCardChoices(cardName, card);
            if (!choseCard) throw CONSTANTS.RESET_SIGNAL;
        }
        else if (selectedButton === issueButton) {
            showPointsOnCard(cardSlot.pointsCover, card.points);
    
            await this.useIssuePoints(card.points, cardSlot, cardSlot.card);
            addCSSClass(cardSlot.pointsCover, "hidden");
            const choseCard = await this.confirmCardChoices(cardName, card);
            if (!choseCard) throw CONSTANTS.RESET_SIGNAL;
        }
        else if (selectedButton === mediaButton) {
            let points = this.grabBagIsKennedy(card.points);
            if (!playerIsKennedy(this.data)) {
                points = card.points - points;
            }
            this.data.lastRoll = {
                points: points,
                cardName: cardName
            };
        }
        else {
            throw CONSTANTS.RESET_SIGNAL;
        }
    }
    
    async useCampaignPoints(points, cardSlot, doneButton) {
        const stateItems = CONSTANTS.stateNames.map(name => ({
            name: name,
            button: UI.stateButtons[name].button
        }));
    
        let exited = false;
        while (points > 0) {
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...stateItems)
                .withAwaitClick(doneButton)
                .build();
    
            if (buttonClicked === doneButton) {
                exited = true;
                break;
            } else {
                points = this.spendState(buttonClicked.name, points);
                showPointsOnCard(cardSlot.pointsCover, points);
            }
        }
    
        if (!exited) await awaitClick(this.cancelSignal, doneButton);
    }
    spendState(stateName, points){
        const playerCandidate = getPlayerCandidate(this.data);
        const playerLocation = this.data[playerCandidate].state;
    
        const mc = moveCost(movementRegion(playerLocation), movementRegion(stateName));
        if (mc > points) return points;
    
        points -= mc;
        this.data[playerCandidate].state = stateName;
        moveIconTo(playerCandidate === CONSTANTS.NIXON ?  UI.nixonIcon : UI.kennedyIcon, stateName);
        if (points <= 0) return points;
    
        points--;
        this.data.cubes[stateName] += candidateDp(playerCandidate);
        showCubes(this.data);
        return points;
    }
    
    async useIssuePoints(points, cardSlot, doneButton) {
        const issuesBought = [];
        const issueItems = Object.keys(UI.issueButtons).map(index => ({
            name: this.data.issues[index],
            button: UI.issueButtons[index].button
        }));
    
        let exited = false;
        while (points > 0) {
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...issueItems)
                .withAwaitClick(doneButton)
                .build();
    
            if (buttonClicked === doneButton) {
                exited = true;
                break;
            } else {
                points = this.spendIssue(buttonClicked.name, points, issuesBought);
                showPointsOnCard(cardSlot.pointsCover, points);
            }
        }
    
        if (!exited) await awaitClick(this.cancelSignal, doneButton);
    }
    spendIssue(issueName, points, issuesBought) {
        const cost = issuesBought.includes(issueName) ? 2 : 1;
        if (points < cost) return points;
    
        const playerCandidate = getPlayerCandidate(this.data);
        this.data.issueScores[issueName] += candidateDp(playerCandidate);
        points -= cost;
        issuesBought.push(issueName);

        showIssues(this.data);
        return points;
    }

    async useMediaPoints(points, cardSlot, doneButton) {
        const playerCandidate = getPlayerCandidate(this.data);
        const mediaItems = Object.values(UI.mediaButtons).map(bt => ({
            name: bt.dataKey,
            button: bt.button
        }));
    
        let exited = false;
        while (points > 0) {
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...mediaItems)
                .withAwaitClick(doneButton)
                .build();
    
            if (buttonClicked === doneButton) {
                exited = true;
                break;
            } else {
                this.data.media[buttonClicked.name] += candidateDp(playerCandidate);
                points--;
                showMedia(this.data);
                showPointsOnCard(cardSlot.pointsCover, points);
            }
        }
    
        if (!exited) await awaitClick(this.cancelSignal, doneButton);
    }
    
    async confirmCardChoices(cardName, card) {
        const [finalizeButton, resetButton] = showPopup("Finalize these moves?", "Finalize", "Reset");
        const popupButton = await popupSelector(this.cancelSignal).build();
        
        if (popupButton === finalizeButton) {
            this.usedCard(cardName, card);
            return true;
        } else if (popupButton === resetButton) {
            return false;
        }
    }
    
    usedCard(cardName, card) {
        const candidate = getPlayerCandidate(this.data);
    
        this.data[candidate].hand = this.data[candidate].hand.filter(name => name != cardName);
        if (card.isCandidate) this.data[candidate].exhausted = true;
        if (!card.isCandidate) this.data[candidate].rest += 4 - card.points;
    }
    
    nextTurn(cardName) {
        this.data.turn++;
        this.data.currentPlayer = getOtherCandidate(this.data);
        this.data.discard.push(cardName);
    
        if (this.data.turn === CONSTANTS.TURNS_PER_ROUND) {
            this.data.currentPlayer = null;
            this.endPlayPhase();
        }
    }
    
    endPlayPhase() {
        this.data.choosingPlayer = getPlayerCandidate(this.data);
        this.data.turns = 0;
        this.data.kennedy.momentum = Math.ceil(this.data.kennedy.momentum / 2);
        this.data.nixon.momentum = Math.ceil(this.data.nixon.momentum / 2);
    
        const media = Object.values(ENDORSE_REGIONS)
            .map(region => this.data.media[region] ? this.data.media[region] : 0)
            .reduce((a,b)=>a+b, 0);
        
        if (media > 0) {
            this.data.choosingPlayer = CONSTANTS.NIXON;
            this.data.phase = CONSTANTS.PHASE.ISSUE_SWAP;
        } else if (media < 0) {
            this.data.choosingPlayer = CONSTANTS.KENNEDY;
            this.data.phase = CONSTANTS.PHASE.ISSUE_SWAP;
        } else {
            this.momentumAwards();
        }
    }
    
    async issueSwap() {
        showShouldSwap();
        const issueItems = Object.keys(UI.issueButtons).map(index => ({
            index: index,
            button: UI.issueButtons[index].button
        }));
    
        const issueClicked = await awaitClickAndReturn(this.cancelSignal, ...issueItems);
    
        const i = issueClicked.index;
        if (i === 0) return;
    
        const issue = this.data.issues[i];
        const swapIssue = this.data.issues[i - 1];
        this.data.issues[i] = swapIssue;
        this.data.issues[i - 1] = issue;
        
        this.momentumAwards();
    }
    
    getIssueScore(i) {
        return this.data.issueScores[this.data.issues[i]];
    }
    momentumAwards() {
        const issue1Score = this.getIssueScore(0);
        const issue2Score = this.getIssueScore(1);
        const issue3Score = this.getIssueScore(2);
    
        if (issue3Score > 0) {
            this.data.nixon.momentum++;
        } else if (issue3Score < 0) {
            this.data.kennedy.momentum++;
        }
    
        this.data.phase = CONSTANTS.PHASE.ISSUE1_ENDORSE_REWARD;
        if (issue2Score > 0) {
            this.data.choosingPlayer = CONSTANTS.NIXON;
            this.data.phase = CONSTANTS.PHASE.ISSUE_REWARD_CHOICE;
        } else if (issue2Score < 0) {
            this.data.choosingPlayer = CONSTANTS.KENNEDY;
            this.data.phase = CONSTANTS.PHASE.ISSUE_REWARD_CHOICE;
        }
    
        if (issue1Score > 0) {
            this.data.nixon.momentum++;
        } else if (issue1Score < 0) {
            this.data.kennedy.momentum++;
        }    
    }
    
    async chooseIssueReward() {
        const [momentumButton, endorsementButton] = showPopup("Which issue reward do you want?", "Momentum", "Endorsement");
        const choiceButton = await popupSelector(this.cancelSignal).build();
    
        const issue1Score = this.getIssueScore(0);

        this.data.phase = CONSTANTS.PHASE.ISSUE1_ENDORSE_REWARD;
        this.data.choosingPlayer = issue1Score > 0 ? CONSTANTS.NIXON : CONSTANTS.KENNEDY;
    
        if (choiceButton === momentumButton) {
            const candidate = getPlayerCandidate(this.data);
            this.data[candidate].momentum++;
        } else if (choiceButton === endorsementButton) {
            const endorseCard = this.drawEndorsementCard();
            await this.useEndorsementCard(endorseCard);
        }    
    }
    
    drawEndorsementCard() {
        const cardIndex = Math.floor(Math.random() * this.data.endorsementsDeck.length);
        const card = this.data.endorsementsDeck[cardIndex];
        this.data.endorsementsDeck.splice(cardIndex, 1);
        return card;
    }
    async useEndorsementCard(endorseCard) {
        const playerCandidate = getPlayerCandidate(this.data);
    
        if (endorseCard === ENDORSE_REGIONS.ALL) {
            showChooseEndorseRegion();
            const endorseItems = Object.values(UI.endorseButtons).map(bt => ({
                name: bt.dataKey,
                button: bt.button
            }));
            const clickedEndorsement = await awaitClickAndReturn(this.cancelSignal, ...endorseItems);
            this.data.endorsements[clickedEndorsement.name] += candidateDp(playerCandidate);
        } else {
            this.data.endorsements[endorseCard] += candidateDp(playerCandidate);
        }    
    }
    
    async discardToCampaign() {
        const playerCandidate = getPlayerCandidate(this.data);
        const count = this.data.round <= 5 ? 1 : 2;
        const playerData = this.data[playerCandidate];
        showShouldDiscard(count);
    
        for (let i = 0; i < count; i++) {
            const cardItems = displayHand(playerData.hand, true, playerCandidate);
            const selectedCard = await awaitClickAndReturn(this.cancelSignal, ...cardItems);
    
            playerData.campaignDeck.push(selectedCard.name);
            playerData.hand = playerData.hand.filter(name => name !== selectedCard.name);
        }        
    }

    async tryGiveIssue1Reward() {
        const issue1Score = this.getIssueScore(0);
        if (issue1Score !== 0) {
            const card = this.drawEndorsementCard();
            await this.useEndorsementCard(card);
        }
    }

    async playerRoundEnd() {
        await this.discardToCampaign();

        const playerData = this.data[getPlayerCandidate(this.data)];
        playerData.bag += playerData.rest;
        playerData.rest = 0;
        this.data.discard = [...this.data.discard, ...playerData.hand];
        playerData.hand = [];
    }
    
    async firstStrategy() {
        await this.tryGiveIssue1Reward();

        Object.keys(this.data.issueScores).forEach(name => {
            const score = this.data.issueScores[name];
            this.data.issueScores[name] = score - Math.sign(score);
        })
    
        await this.playerRoundEnd();
        this.data.phase = CONSTANTS.PHASE.STRATEGY;
        this.data.choosingPlayer = getOtherCandidate(this.data);
    }
    
    async secondStrategy() {
        await this.playerRoundEnd();
    
        const check = this.initiativeCheck();
        this.data.choosingPlayer = check.kennedy > check.nixon ? CONSTANTS.KENNEDY : CONSTANTS.NIXON;
        this.data.lastBagOut = {
            kennedy: check.kennedy,
            nixon: check.nixon,
            name: "Initiative"
        };
    
        this.data.phase = CONSTANTS.PHASE.CHOOSE_FIRST;
        this.data.turn = 0;
        this.data.round = this.data.round + 1;    
    }
}

export default GameLogic;