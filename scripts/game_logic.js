import { 
    getPlayerCandidate, candidateDp,
    addCSSClass,
    playerIsKennedy,
    getOtherCandidate,
    moveCost,
    movementRegion,
    oppositeCandidate,
    flagActive,
    chooseFromBags
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
    displayHand,
    showMomentum,
    showBagRoll
} from "./view.js";
import { showCardPopup, showPopup, popupSelector, showPopupWithCard } from "./popup.js";
import * as UI from "./dom.js";
import { CANDIDATE_CARD, CANDIDATE_CARD_NAME, CARDS, ENDORSE_REGIONS } from './cards.js';
import EventHandler from './event_handler.js';
import { FLAGS, KENNEDY, NIXON, PHASE, REGION_NAME, RESET_SIGNAL, STATE_REGION, TURNS_PER_ROUND, stateNames } from './constants.js';
import GameData from './gameData.js';

class GameLogic {
    constructor(gameData, cancelSignal) {
        this.data = new GameData(gameData);
        this.cancelSignal = cancelSignal;
    }

    getData() {
        return this.data.toDict();
    }

    grabBagIsKennedy(count) {
        return chooseFromBags(this.data.kennedy, this.data.nixon, count, 12);
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
        
        this.data.phase = PHASE.PLAY_CARDS;
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
                selectedCard.card, 
                selectedCard.cardSlot, 
                this.data.lastRoll.points
            );
            this.data.lastRoll = null;
        }
    
        const player = getPlayerCandidate(this.data);
        if (this.data.lastRoll === null) {
            this.data[player].hand = this.data[player].hand.filter(name => name != selectedCard.name);
            this.data.chosenCard = selectedCard.name;
            
            if (this.data.preempted) return;     
            this.data.phase = PHASE.TRIGGER_EVENT;    
            this.data.choosingPlayer = getOtherCandidate(this.data);
        }
    }
    
    async alreadyChoseMediaCard(card, cardSlot, points) {
        showPointsOnCard(cardSlot.pointsCover, points);
    
        await this.useMediaPoints(points, cardSlot.card, p => showPointsOnCard(cardSlot.pointsCover, p));
        addCSSClass(cardSlot.pointsCover, "hidden");
        const choseCard = await this.confirmCardChoices(card);
        if (!choseCard) throw RESET_SIGNAL;
    }

    preemptNeedsMmtm(player) {
        if (player === KENNEDY && this.data.flags[KENNEDY_CORPS] === this.data.round) return false;
        return true;
    }

    nixonCanCampaign(state) {
        if (flagActive(this.data, FLAGS.NIXON_EGGED)) return false;

        const oldSouth = this.data.flags[FLAGS.OLD_SOUTH];
        if (oldSouth.player === NIXON && oldSouth.round === this.data.round) return false;

        if (flagActive(this.data, FLAGS.SILENCE) && state !== null) {
            const kenDp = candidateDp(KENNEDY);
            return Math.sign(this.data.cubes[state]) !== kenDp;
        }

        return true;
    }

    kennedyCanCampaign(state) {
        if (this.data.flags[FLAGS.KEN_NO_CP] === undefined) return true;
        
        const oldSouth = this.data.flags[FLAGS.OLD_SOUTH];
        if (oldSouth.player === KENNEDY && oldSouth.round === this.data.round) return false;

        const region = state === null ? null : STATE_REGION[state];
        const matches = this.data.flags[FLAGS.KEN_NO_CP].filter(rule => 
            rule.region === region && rule.round === this.data.round
        );
        return matches.length === 0;
    }
    
    canCardEvent(cardName) {
        if (cardName === "Norman Vincent Peale" && this.data.flags[FLAGS.HOUSTON_ASSOC]) return false;
        if (cardName === "Eisenhower's Silence" && this.data.flags[FLAGS.SILENCE]) return false;
        if (cardName === "Baptist Ministers" && this.data.flags[FLAGS.HOUSTON_ASSOC]) return false;

        return true;
    }

    modCardPoints(points, player) {
        this.data.cpMods
            .filter(mod => mod.player === player)
            .filter(mod => mod.round === this.data.round)
            .forEach(mod => {
                points += mod.boost;
                if (mod.min) points = Math.max(mod.min, points);
                if (mod.max) points = Math.min(mod.max, points);
            });
        return points;
    }

    playerFreeMove() {
        if (player === KENNEDY && flagActive(this.data, FLAGS.KEN_AIR)) return true;
        if (this.data.flags[FLAGS.ADVANCE_MEN]) {
            const flag = this.data.flags[FLAGS.ADVANCE_MEN];
            if (flag.player === getPlayerCandidate(this.data) && flag.round === this.data.round) return true;
        }
        return false;
    }

    async cardChosen(cardName, card, cardSlot, isCandidate) {
        const playerCandidate = getPlayerCandidate(this.data);
        if (this.data.currentPlayer !== playerCandidate) return false;
    
        const disableEvent = isCandidate || !this.canCardEvent(cardName);
        const {eventButton, cpButton, issueButton, mediaButton} = showCardPopup(cardName, card, disableEvent);
        const selectedButton = await popupSelector(this.cancelSignal)
            .withAwaitClick(UI.choosePopup)
            .withAwaitKey(document, "Escape")
            .build();
        
        this.data.preempted = true;
        const usedCampaign = (selectedButton === cpButton
            || selectedButton === issueButton
            || selectedButton === mediaButton);
        const hasMomentum = this.data[playerCandidate].momentum >= 2 
            && this.data[playerCandidate].canMomentum();
        if (usedCampaign && (hasMomentum || !this.preemptNeedsMmtm(playerCandidate))) {
            const [yesButton, noButton] = showPopup("Preempt this card's event?", "Yes", "No");
            const popupButton = await popupSelector(this.cancelSignal).build();
            
            if (popupButton === yesButton) {
                this.data[playerCandidate].momentum -= 2;
                showMomentum(this.data);
            } else if (popupButton === noButton) {
                this.data.preempted = false;
            }
        }
    
        if (selectedButton === eventButton) {
            if (playerCandidate === NIXON && flagActive(this.data, FLAGS.NIXON_PLEDGE)) {
                this.data.kennedy.momentum++;
            }
            this.activateEvent(card, playerCandidate);
        } else if (selectedButton === cpButton) {
            const modPoints = this.modCardPoints(card.points, playerCandidate);
            showPointsOnCard(cardSlot.pointsCover, modPoints);
    
            await this.useCampaignPoints(modPoints, cardSlot, cardSlot.card);
            addCSSClass(cardSlot.pointsCover, "hidden");
            const choseCard = await this.confirmCardChoices(card);
            if (!choseCard) throw RESET_SIGNAL;
        }
        else if (selectedButton === issueButton) {
            showPointsOnCard(cardSlot.pointsCover, card.points);
    
            await this.useIssuePoints(card.points, cardSlot.card, p => showPointsOnCard(cardSlot.pointsCover, p));
            addCSSClass(cardSlot.pointsCover, "hidden");
            const choseCard = await this.confirmCardChoices(card);
            if (!choseCard) throw RESET_SIGNAL;
        }
        else if (selectedButton === mediaButton) {
            const modPoints = this.modCardPoints(card.points, playerCandidate);
            let points = 0;

            if (playerCandidate === KENNEDY && flagActive(this.data, FLAGS.PROFILES_COURAGE)) {
                for (let c = 0; c < modPoints; c++) {
                    let won = this.grabBagIsKennedy(1) === 1;
                    if (!won) {
                        const [yesButton, noButton] = showPopup("You lost this support check. Redraw it?", "Yes", "No");
                        const popupButton = await popupSelector(this.cancelSignal).build();
                        if (popupButton === yesButton) {
                            won = this.grabBagIsKennedy(1) === 1;
                        }
                    }
                    points += won ? 1 : 0;
                }
            } else {
                points = this.grabBagIsKennedy(modPoints);
            }

            if (!playerIsKennedy(this.data)) {
                points = modPoints - points;
            }
            this.data.lastRoll = {
                points: points,
                cardName: cardName
            };
        }
        else {
            throw RESET_SIGNAL;
        }
    }

    activateEvent(card, player) {
        if (flagActive(this.data, FLAGS.JACKIE_KENNEDY)) {
            if (this.data[player].momentum === 0) throw RESET_SIGNAL;
            this.data[player].momentum--;
        }

        card.event(this.data, player);
    }
    
    async useCampaignPoints(points, cardSlot, doneButton) {
        const player = getPlayerCandidate(this.data);
        if (flagActive(this.data, FLAGS.NIXONS_KNEE)) {
            if (this.data[player].momentum === 0) throw RESET_SIGNAL;
            this.data[player].momentum--;
        }

        const stateItems = stateNames.map(name => ({
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
            }

            const stateName = buttonClicked.name;
            if (player === NIXON && !this.nixonCanCampaign(stateName)) continue;
            if (player === KENNEDY && !this.kennedyCanCampaign(stateName)) continue;

            points = this.spendState(stateName, points);
            showPointsOnCard(cardSlot.pointsCover, points);
        }
    
        if (!exited) await awaitClick(this.cancelSignal, doneButton);
    }
    spendState(stateName, points){
        const playerCandidate = getPlayerCandidate(this.data);
        const playerLocation = this.data[playerCandidate].state;
    
        const mc = this.playerFreeMove()
            ? 0
            : moveCost(movementRegion(playerLocation), movementRegion(stateName));
        if (mc > points) return points;
    
        points -= mc;
        this.data[playerCandidate].state = stateName;
        moveIconTo(playerCandidate === NIXON ?  UI.nixonIcon : UI.kennedyIcon, stateName);
        if (points <= 0) return points;
    
        points--;
        this.data.cubes[stateName] += candidateDp(playerCandidate);
        showCubes(this.data);
        return points;
    }
    
    async useIssuePoints(points, doneButton, showPoints) {
        const player = getPlayerCandidate(this.data);
        if (flagActive(this.data, FLAGS.NIXONS_KNEE)) {
            if (this.data[player].momentum === 0) throw RESET_SIGNAL;
            this.data[player].momentum--;
        }

        const issuesBought = [];
        let exited = false;
        while (points > 0) {
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...UI.issueButtons)
                .withAwaitClick(doneButton)
                .build();
    
            if (buttonClicked === doneButton) {
                exited = true;
                break;
            }

            if (player === NIXON && !this.nixonCanCampaign(null)) continue;
            if (player === KENNEDY && !this.kennedyCanCampaign(null)) continue;

            const issueClicked = this.data.issues[buttonClicked.dataIndex];
            points = this.spendIssue(issueClicked, points, issuesBought);
            showPoints(points);
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

    async useMediaPoints(points, doneButton, showPoints) {
        const playerCandidate = getPlayerCandidate(this.data);
        if (flagActive(this.data, FLAGS.NIXONS_KNEE)) {
            if (this.data[playerCandidate].momentum === 0) throw RESET_SIGNAL;
            this.data[playerCandidate].momentum--;
        }
    
        let exited = false;
        while (points > 0) {
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...UI.mediaButtons)
                .withAwaitClick(doneButton)
                .build();
    
            if (buttonClicked === doneButton) {
                exited = true;
                break;
            }

            if (player === NIXON && !this.nixonCanCampaign(null)) continue;
            if (player === KENNEDY && !this.kennedyCanCampaign(null)) continue;

            this.data.media[buttonClicked.dataKey] += candidateDp(playerCandidate);
            points--;
            showMedia(this.data);
            showPoints(points);
        }
    
        if (!exited) await awaitClick(this.cancelSignal, doneButton);
    }
    
    async confirmCardChoices(card) {
        const [finalizeButton, resetButton] = showPopup("Finalize these moves?", "Finalize", "Reset");
        const popupButton = await popupSelector(this.cancelSignal).build();
        
        if (popupButton === finalizeButton) {
            this.usedCard(card);
            return true;
        } else if (popupButton === resetButton) {
            return false;
        }
    }
    
    usedCard(card) {
        const candidate = getPlayerCandidate(this.data);
        if (card.isCandidate) this.data[candidate].exhausted = true;
        if (!card.isCandidate) this.data[candidate].rest += card.rest;
    }

    async showChosenCard() {
        const cardName = this.data.chosenCard;
        this.data.chosenCard = null;

        const card = cardName === CANDIDATE_CARD_NAME 
            ? CANDIDATE_CARD(getOtherCandidate(this.data))
            : CARDS[cardName];
        showPopupWithCard(
            "Your opponent played this card.", 
            cardName, card,
            "Okay",
        );
        await popupSelector(this.cancelSignal).build();

        this.nextTurn(cardName);
    }

    async triggerEvent() {
        const player = getPlayerCandidate(this.data);
        if (this.data[player].momentum === 0) return this.showChosenCard();
        if (this.data[player].canMomentum()) return this.showChosenCard();

        const cardName = this.data.chosenCard;
        this.data.chosenCard = null;
        this.data.phase = PHASE.PLAY_CARDS;
        this.data.choosingPlayer = null;

        const card = cardName === CANDIDATE_CARD_NAME 
            ? CANDIDATE_CARD(getOtherCandidate(this.data))
            : CARDS[cardName];
        const [triggerButton, continueButton] = showPopupWithCard(
            "Your opponent played this card. Would you like to trigger its event?", 
            cardName, card,
            "Trigger", "Continue"
        );
        const selection = await popupSelector(this.cancelSignal).build();

        if (selection === triggerButton) {
            const card = CARDS[cardName];
            this.data[player].momentum--;
            this.activateEvent(card, player);
        } else if (selection === continueButton) {
            this.nextTurn(cardName);
        }
    }
    
    nextTurn(cardName) {
        this.data.turn++;
        this.data.preempted = false;
        this.data.currentPlayer = oppositeCandidate(this.data.currentPlayer);
        this.data.discard.push(cardName);
    
        if (this.data.turn === TURNS_PER_ROUND) {
            this.data.currentPlayer = null;
            this.endPlayPhase();
        }
    }
    
    endPlayPhase() {
        this.data.choosingPlayer = getPlayerCandidate(this.data);
        this.data.turns = 0;
        this.data.kennedy.momentumDecay();
        this.data.nixon.momentumDecay();
    
        const media = Object.values(ENDORSE_REGIONS)
            .map(region => this.data.media[region] ? this.data.media[region] : 0)
            .reduce((a,b)=>a+b, 0);
        
        if (media > 0) {
            this.data.choosingPlayer = NIXON;
            this.data.phase = PHASE.ISSUE_SWAP;
        } else if (media < 0) {
            this.data.choosingPlayer = KENNEDY;
            this.data.phase = PHASE.ISSUE_SWAP;
        } else {
            this.momentumAwards();
        }
    }
    
    async issueSwap() {
        showShouldSwap();
        const issueClicked = await awaitClickAndReturn(this.cancelSignal, ...UI.issueButtons);    
        const i = issueClicked.dataIndex;
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
    
        this.data.phase = PHASE.ISSUE1_ENDORSE_REWARD;
        if (issue2Score > 0) {
            this.data.choosingPlayer = NIXON;
            this.data.phase = PHASE.ISSUE_REWARD_CHOICE;
        } else if (issue2Score < 0) {
            this.data.choosingPlayer = KENNEDY;
            this.data.phase = PHASE.ISSUE_REWARD_CHOICE;
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

        this.data.phase = PHASE.ISSUE1_ENDORSE_REWARD;
        this.data.choosingPlayer = issue1Score > 0 ? NIXON : KENNEDY;
    
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
            const clickedEndorsement = await awaitClickAndReturn(this.cancelSignal, ...UI.endorseButtons);
            this.data.endorsements[clickedEndorsement.dataKey] += candidateDp(playerCandidate);
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
        this.data.phase = PHASE.STRATEGY;
        this.data.choosingPlayer = getOtherCandidate(this.data);
    }
    
    async secondStrategy() {
        await this.playerRoundEnd();
    
        this.data.turn = 0;
        this.data.round++;

        const check = this.initiativeCheck();
        this.data.lastBagOut = {
            kennedy: check.kennedy,
            nixon: check.nixon,
            name: "Initiative"
        };

        if (this.data.round === 6) {
            this.data.choosingPlayer = null;
            this.data.phase = PHASE.DEBATE;
        } else {
            this.data.choosingPlayer = check.kennedy > check.nixon ? KENNEDY : NIXON;
            this.data.phase = PHASE.CHOOSE_FIRST;
        }
    }

    async handleEvent() {
        const handler = new EventHandler(this.data, this.cancelSignal, this);
        await handler.handleEvent();
    }
}

export default GameLogic;