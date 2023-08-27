import { 
    getPlayerCandidate, candidateDp,
    addCSSClass,
    playerIsKennedy,
    getOtherCandidate,
    moveCost,
    movementRegion,
    oppositeCandidate,
    flagActive,
    chooseFromBags,
    candidateForDp,
    sum
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
    displayCampaignDeck,
    showInfo
} from "./view.js";
import { showCardPopup, showPopup, popupSelector, showPopupWithCard } from "./popup.js";
import * as UI from "./dom.js";
import { CANDIDATE_CARD, CANDIDATE_CARD_NAME, CARDS, ENDORSE_REGIONS, ISSUE_NAME, PARTY } from './cards.js';
import EventHandler from './event_handler.js';
import { DEBATE_FLAGS, DEBATE_ROUND, ELECTION_FLAGS, ELECTORS, END_GAME_ROUND, EVENT_TYPE, FLAGS, KENNEDY, NIXON, PHASE, REGION_NAME, RESET_SIGNAL, STATE_REGION, TURNS_PER_ROUND, STATE_CODES, stateLeanNixon, stateNames } from './constants.js';
import GameData from './gameData.js';
import { ALL_REGIONS, addPer } from './events.js';

class GameLogic {
    constructor(gameData, cancelSignal) {
        this.data = new GameData(gameData);
        this.cancelSignal = cancelSignal;
    }

    getData() {
        return this.data.toDict();
    }

    grabBagIsKennedy(count) {
        const counts = chooseFromBags(this.data.kennedy, this.data.nixon, count, 12);
        this.data.lastBagOut = {
            kennedy: counts.count1,
            nixon: counts.count2,
            name: "Support Check"
        };
        return counts.count1;
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
        if (oldSouth && oldSouth.player === NIXON && oldSouth.round === this.data.round) return false;

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
        const player = getPlayerCandidate(this.data);
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
        if (usedCampaign && !isCandidate && (hasMomentum || !this.preemptNeedsMmtm(playerCandidate))) {
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
                .withAwaitClickAndReturn(...Object.values(UI.issueButtons))
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
        const player = getPlayerCandidate(this.data);
        if (flagActive(this.data, FLAGS.NIXONS_KNEE)) {
            if (this.data[player].momentum === 0) throw RESET_SIGNAL;
            this.data[player].momentum--;
        }
    
        let exited = false;
        while (points > 0) {
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...Object.values(UI.mediaButtons))
                .withAwaitClick(doneButton)
                .build();
    
            if (buttonClicked === doneButton) {
                exited = true;
                break;
            }

            if (player === NIXON && !this.nixonCanCampaign(null)) continue;
            if (player === KENNEDY && !this.kennedyCanCampaign(null)) continue;

            this.data.media[buttonClicked.dataKey] += candidateDp(player);
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
        const cardName = this.data.chosenCard;

        if (this.data[player].momentum === 0) return this.showChosenCard();
        if (this.data[player].canMomentum()) return this.showChosenCard();

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
            this.data.phase = PHASE.NEXT_TURN;
        } else if (selection === continueButton) {
            this.data.chosenCard = null;
            this.data.choosingPlayer = null;
            this.data.phase = PHASE.PLAY_CARDS;
            this.nextTurn(cardName);
        }
    }
    
    async doNextTurn() {
        const cardName = this.data.chosenCard;
            this.data.chosenCard = null;
            this.data.choosingPlayer = null;
            this.data.phase = PHASE.PLAY_CARDS;
        this.nextTurn(cardName);
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
            .reduce(sum, 0);
        
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
        const issueClicked = await awaitClickAndReturn(this.cancelSignal, ...Object.values(UI.issueButtons));    
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
            const clickedEndorsement = await awaitClickAndReturn(this.cancelSignal, ...Object.values(UI.endorseButtons));
            this.data.endorsements[clickedEndorsement.dataKey] += candidateDp(playerCandidate);
        } else {
            this.data.endorsements[endorseCard] += candidateDp(playerCandidate);
        }    
    }
    
    async discardToCampaign() {
        const playerCandidate = getPlayerCandidate(this.data);
        const count = this.data.round < DEBATE_ROUND ? 1 : 2;
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

        if (this.data.round === DEBATE_ROUND) {
            this.data.debate = {
                hands: Object.fromEntries(this.data.issues.map(issue => [
                    issue,
                    {nixon: [], kennedy: []}
                ])),
                cards: {
                    nixon: null,
                    kennedy: null
                },
                initiative: check.kennedy > check.nixon ? KENNEDY : NIXON,
                issues: [...this.data.issues],
                resolveIndex: this.data.issues.length - 1
            };
            this.data.issues = this.data.issues.map(s => null);
            this.data.choosingPlayer = this.data.flags[DEBATE_FLAGS.LAZY_SHAVE]
                ? NIXON
                : getPlayerCandidate(this.data);
            this.data.phase = PHASE.DEBATE;
        } else if (this.data.round === END_GAME_ROUND) {
            this.endGame();
        } else {
            this.data.choosingPlayer = check.kennedy > check.nixon ? KENNEDY : NIXON;
            this.data.phase = PHASE.CHOOSE_FIRST;
        }
    }

    async handleEvent() {
        const handler = new EventHandler(this.data, this.cancelSignal, this);
        await handler.handleEvent();
    }

    placeDebateCard(card, cardName, _party) {
        const issue = ISSUE_NAME[card.issue];
        if (!this.data.debate.hands[issue]) {
            this.data.discard.push(cardName);
            return;
        }

        const party = _party || card.party;
        const candidate = party === PARTY.REPUBLICAN ? NIXON : KENNEDY;
        this.data.debate.hands[issue][candidate].push(cardName);
    }

    async debate() {
        const player = getPlayerCandidate(this.data);
        const cardItems = displayCampaignDeck(this.data[player].campaignDeck);
        showInfo("Select a card to play in the debates.");

        const selected = await awaitClickAndReturn(this.cancelSignal, ...cardItems);
        const [yesButton, noButton] = showPopupWithCard(
            "Play this card in the debates?", 
            selected.name, selected.card, 
            "Yes", "No"
        );
        const popupButton = await popupSelector(this.cancelSignal).build();
        if (popupButton === noButton) throw RESET_SIGNAL;

        const myCardName = selected.name;
        const myCard = selected.card;
        this.data.debate.cards[player] = myCardName;
        this.data[player].campaignDeck = this.data[player].campaignDeck
                .filter(name => name !== myCardName);


        if (this.data.flags[DEBATE_FLAGS.LAZY_SHAVE] && player === NIXON) {
            if (myCard.party === PARTY.BOTH) {
                await this.debateChooseParty();
                this.data.phase = PHASE.DEBATE;
            } else {
                this.placeDebateCard(myCard, myCardName);
            }
            this.data.choosingPlayer = getOtherCandidate(this.data);
            return;
        }

        if (this.data.flags[DEBATE_FLAGS.LAZY_SHAVE] && player === KENNEDY) {
            if (myCard.party === PARTY.BOTH) {
                await this.debateChooseParty();
            } else {
                this.placeDebateCard(myCard, myCardName);
            }
            this.data.phase = PHASE.DEBATE_RESOLVE;
            return;
        }

        if (this.data.debate.cards.nixon === null || this.data.debate.cards.kennedy === null) {
            this.data.choosingPlayer = getOtherCandidate(this.data);
            return;
        }

        const oppCardName = this.data.debate.cards[getOtherCandidate(this.data)];
        const oppCard = CARDS[oppCardName];

        if (myCard.party !== PARTY.BOTH) this.placeDebateCard(myCard, myCardName);
        if (oppCard.party !== PARTY.BOTH) this.placeDebateCard(oppCard, oppCardName);

        if (oppCard.party === PARTY.BOTH && myCard.party === PARTY.BOTH) {
            this.data.choosingPlayer = this.data.debate.initiative;
            this.data.phase = PHASE.DEBATE_INITIATIVE;
        } else if (myCard.party === PARTY.BOTH) {
            this.data.choosingPlayer = player;
            this.data.phase = PHASE.DEBATE_PARTY;
        } else if (oppCard.party === PARTY.BOTH) {
            this.data.choosingPlayer = getOtherCandidate(this.data);
            this.data.phase = PHASE.DEBATE_PARTY;
        } else {
            this.data.phase = PHASE.DEBATE_RESOLVE;
        }
    }

    async debateChooseFirst() {
        const player = getPlayerCandidate(this.data);
        const [firstButton, secondButton] = showPopup(
            "Both players played a card that can be played for either candidate. Would you like to choose your card's candidate first or second?", 
            "First", "Second"
        );
        const popupButton = await popupSelector(this.cancelSignal).build();
        
        if (popupButton === firstButton) {
            await this.debateChooseParty();
        } else {
            this.data.debate.needParty = player;
        }

        this.data.choosingPlayer = getOtherCandidate(this.data);
        this.data.phase = PHASE.DEBATE_PARTY;
    }

    async debateChooseParty() {
        const player = getPlayerCandidate(this.data);
        const cardName = this.data.debate.cards[player];
        const card = CARDS[cardName];
        const [nixonButton, kennedyButton] = showPopupWithCard(
            "Play this card in the debates for Nixon or Kennedy?", cardName, card,
            "Nixon", "Kennedy"
        );
        const popupButton = await popupSelector(this.cancelSignal).build();

        const choice = popupButton === nixonButton ? PARTY.REPUBLICAN : PARTY.DEMOCRAT;
        this.placeDebateCard(card, cardName, choice);

        if (this.data.debate.needParty) {
            this.data.choosingPlayer = this.data.debate.needParty;
            this.data.debate.needParty = null;
            this.data.phase = PHASE.DEBATE_PARTY;
        } else {
            this.data.phase = PHASE.DEBATE_RESOLVE;
        }
    }

    getIssuesWon() {
        const hands = this.data.debate.hands;
        return this.data.debate.issues
            .filter(issue => !hands[issue])
            .length;
    }

    async debateResolve() {
        if (this.data.debate.resolveIndex === -1) {
            if (this.getIssuesWon() === this.data.debate.issues.length) {
                this.endDebates();
                return;
            } 
            if (this.data.nixon.campaignDeck.length === 0 
                || this.data.kennedy.campaignDeck.length === 0
            ) {
                this.data.debate.cleanUp = true;
                this.data.phase = PHASE.DEBATE_RESOLVE;
            } else {
                this.data.phase = PHASE.DEBATE;
            }

            this.data.debate.resolveIndex = this.data.debate.issues.length - 1;
            return;
        }

        this.data.debate.cards = {nixon: null, kennedy: null};
        const hands = this.data.debate.hands;
        const issue = this.data.debate.issues[this.data.debate.resolveIndex];
        this.data.debate.resolveIndex--;

        if (!hands[issue]) return;
        if (!this.data.debate.cleanUp 
            && hands[issue].nixon.length < 2 
            && hands[issue].kennedy.length < 2) return;

        this.resolveDebateIssue(hands, issue);
    }

    resolveDebateIssue(hands, issue) {
        const nixonTotal = hands[issue].nixon
            .map(name => CARDS[name].points)
            .reduce(sum, 0);
        let kennedyTotal = hands[issue].kennedy
            .map(name => CARDS[name].points)
            .reduce(sum, 0);
        if (this.data.flags[DEBATE_FLAGS.BRAIN_TRUST]) kennedyTotal++;

        let winner = null;
        if (nixonTotal === kennedyTotal) {
            winner = this.data.debate.initiative;
        } else if (nixonTotal > kennedyTotal) {
            winner = NIXON;
        } else {
            winner = KENNEDY;
        }

        const lowestPos = this.data.issues.lastIndexOf(null);
        this.data.issues[lowestPos] = issue;
        this.data.discard.push(...hands[issue].nixon, ...hands[issue].kennedy);
        this.data.debate.hands[issue] = null;

        const issuesWon = this.getIssuesWon();
        const rewardCount = issuesWon + 1;

        this.data.event = addPer(
            EVENT_TYPE.CHANGE_PER, winner,
            rewardCount, rewardCount, ALL_REGIONS
        );
    }

    endDebates() {
        this.data.discard.push(...this.data.nixon.campaignDeck);
        this.data.discard.push(...this.data.kennedy.campaignDeck);
        this.data.nixon.campaignDeck = [];
        this.data.kennedy.campaignDeck = [];

        this.data.round++;
        const check = this.initiativeCheck();
        this.data.lastBagOut = {
            kennedy: check.kennedy,
            nixon: check.nixon,
            name: "Initiative"
        };
        this.data.choosingPlayer = check.kennedy > check.nixon ? KENNEDY : NIXON;
        this.data.phase = PHASE.CHOOSE_FIRST;
    }

    endGame() {
        const nixMedia = Object.values(this.data.media)
            .filter(score => Math.sign(score) === candidateDp(NIXON))
            .reduce(sum, 0);
        const kenMedia = Object.values(this.data.media)
            .filter(score => Math.sign(score) === candidateDp(KENNEDY))
            .reduce(sum, 0);
        const nixIssue = Object.values(this.data.issueScores)
            .filter(score => Math.sign(score) === candidateDp(NIXON))
            .reduce(sum, 0);
        const kenIssue = Object.values(this.data.issueScores)
            .filter(score => Math.sign(score) === candidateDp(KENNEDY))
            .reduce(sum, 0);

        this.data.nixon.bag += nixMedia*2 + nixIssue;
        this.data.kennedy.bag += kenMedia*2 + kenIssue;
        this.data.media = {
            [ENDORSE_REGIONS.WEST]: 0,
            [ENDORSE_REGIONS.EAST]: 0,
            [ENDORSE_REGIONS.MID]: 0,
            [ENDORSE_REGIONS.SOUTH]: 0
        };
        this.data.issueScores = {
            [Object.keys(ISSUE_URLS)[0]]: 0,
            [Object.keys(ISSUE_URLS)[1]]: 0,
            [Object.keys(ISSUE_URLS)[2]]: 0
        };

        this.data.nixon.bag += this.data.nixon.momentum*2;
        this.data.nixon.momentum = 0;
        this.data.kennedy.bag += this.data.kennedy.momentum*2;
        this.data.kennedy.momentum = 0;

        const check = this.initiativeCheck();
        let resolve = check.kennedy > check.nixon ? KENNEDY : NIXON;
        let sup = {
            nixon: 0,
            kennedy: 0
        };

        for (let c = 0; c < 2; c++) {
            this.data[resolve].campaignDeck.forEach(cardName => {
                const state = STATE_CODES[CARDS[cardName].state];
                const supCheck = chooseFromBags(this.data[resolve], this.data[oppositeCandidate(resolve)], 3, 0).count1;
                this.data.cubes[state] += candidateDp(resolve) * supCheck;
                sup[resolve] += supCheck;
            });
            resolve = oppositeCandidate(resolve);
        }

        this.data.lastBagOut = {
            kennedy: sup.kennedy,
            nixon: sup.nixon,
            name: "Support Checks"
        };

        this.data.choosingPlayer = check.kennedy > check.nixon ? KENNEDY : NIXON;
        this.data.phase = PHASE.CHOOSE_FIRST_END;
    }

    async chooseFirstEnd() {
        const [first, second] = showPopup("Would you like to resolve your election day events first or second?", "First", "Second");
        const selection = await popupSelector(this.cancelSignal).build();

        if (selection === first) {
            this.data.choosingPlayer = getPlayerCandidate(this.data);
        } else {
            this.data.choosingPlayer = getOtherCandidate(this.data);
        }
        this.data.phase = PHASE.ELECTION_DAY_EVENTS;
    }

    async electionDayEvents() {
        if (this.data.flags[ELECTION_FLAGS.COOK_COUNTY]) {
            const supCheck = chooseFromBags(this.data.kennedy, this.data.nixon, 5, 0).count1;
            this.data.cubes[STATE_CODES.il] += candidateDp(KENNEDY) * supCheck;
        }
        const ctScore = Math.sign(this.data.cubes[STATE_CODES.ct]);
        if (this.data.flags[ELECTION_FLAGS.EARLY_RETURNS] && ctScore !== 0) {
            const winner = candidateForDp(ctScore);
            const supCheck = chooseFromBags(this.data[winner], this.data[oppositeCandidate(winner)], 5, 0).count1;
            this.data.cubes[STATE_CODES.ct] += ctScore * supCheck;
        }

        if (this.data.flag[ELECTION_FLAGS.RECOUNT]) {
            this.data.event = {
                type: EVENT_TYPE.SWING_STATE,
                target: NIXON,
                count: 3
            };
        }
        this.data.phase = PHASE.RESOLVE_GAME;
    }

    async resolveGame() {
        // cubes for endorsements
        stateNames.filter(name => this.data.cubes[name] === 0)
            .forEach(name => {
                const region = ENDORSE_NAME[STATE_REGION[name]];
                this.data.cubes[name] = Math.sign(this.data.endorsements[region]);
            });
        // cubes for default win
        stateNames.filter(name => this.data.cubes[name] === 0)
            .forEach(name => {
                const leanNixon = stateLeanNixon[name];
                this.data.cubes[name] = leanNixon ? candidateDp(NIXON) : candidateDp(KENNEDY);
            });

        const kennedyElectors = stateNames
            .map(name => this.getElectors(name, KENNEDY))
            .reduce(sum, 0);
        const nixonElectors = stateNames
            .map(name => this.getElectors(name, NIXON))
            .reduce(sum, 0);

        this.data.finalScore = {
            nixon: nixonElectors,
            kennedy: kennedyElectors
        };

        this.data.finalScore.winner = this.getWinner();
    }

    getWinner() {
        const nixonElectors = this.data.finalScore.nixon;
        const kennedyElectors = this.data.finalScore.kennedy;

        if (nixonElectors > kennedyElectors) {
            return NIXON;
        } else if (kennedyElectors > nixonElectors) {
            return KENNEDY;
        }

        const nixStatesWon = stateNames
            .map(name => Math.sign(this.data.cubes[name]) === candidateDp(NIXON))
            .length;
        const kenStatesWon = stateNames
            .map(name => Math.sign(this.data.cubes[name]) === candidateDp(KENNEDY))
            .length;

        if (nixStatesWon > kenStatesWon) {
            return NIXON;
        } else if (kenStatesWon > nixStatesWon) {
            return KENNEDY;
        }

        const statesTotal = stateNames
            .map(name => this.data.cubes[name])
            .reduce(sum, 0);
        if (Math.sign(statesTotal) === candidateDp(NIXON)) {
            return NIXON;
        } else {
            return KENNEDY; // if this is a tie too, just return kennedy lol
        }
    }

    getElectors(stateName, candidate) {
        const dp = candidateDp(candidate);
        const unpledgedStates = ["alabama", "louisiana", "mississippi"];
        const shouldUnpledge = this.data.flags[ELECTION_FLAGS.UNPLEDGED]
            && unpledgedStates.map(name => this.data.cubes[name])
                .filter(s => Math.sign(s) === candidateDp(KENNEDY))
                .filter(s => Math.abs(s) < 4)
                .reduce((a,b) => a||b, false);

        if (shouldUnpledge && unpledgedStates.includes(stateName)) return 0;
        if (Math.sign(this.data.cubes[stateName]) === dp) {
            return ELECTORS[stateName];
        } else {
            return 0;
        }
    }

    async showWinner() {
        const winnerScore = this.data.finalScore[this.data.finalScore.winner];
        const loserScore = this.data.finalScore[oppositeCandidate(this.data.finalScore.winner)];
        const winner = this.data.finalScore.winner[0].toUpperCase() + this.data.finalScore.winner.substring(1);
        showPopup(`${winner} won the game, with ${winnerScore} electors to ${loserScore} electors.`, "Okay");
        await popupSelector(this.cancelSignal).build();
    }
}

export default GameLogic;