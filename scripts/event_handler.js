import { CARDS, LIFETIME, PARTY } from "./cards.js";
import { ELECTORS, EVENT_TYPE, KENNEDY, PRETTY_STATES, REGION_NAME, RESET_SIGNAL, STATE_REGION, stateNames, STATE_CODES, FLAGS, NIXON } from "./constants.js";
import { Deferred, awaitClick, awaitClickAndReturn } from "./deferred.js";
import * as UI from "./dom.js";
import { ALL_REGIONS, addPer } from "./events.js";
import GameData from "./gameData.js";
import GameLogic from "./game_logic.js";
import { popupSelector, showPopup, showPopupWithCard } from "./popup.js";
import { addCSSClass, candidateDp, chooseFromBags, flagActive, getPlayerCandidate, listAndCapitalize, playerIsKennedy, popRandom, removeCSSClass } from "./util.js";
import {
    displayDiscard,
    displayHand,
    hideEventCount,
    showCubes,
    showDiscard,
    showEventCount,
    showInfo, showIssues, showMedia
} from "./view.js";

class EventHandler {
    /**
     * @param {GameData} gameData 
     * @param {AbortSignal} cancelSignal 
     * @param {GameLogic} gameLogic
     */
    constructor(gameData, cancelSignal, gameLogic) {
        this.data = gameData;
        this.cancelSignal = cancelSignal;
        this.gameLogic = gameLogic;
    }

    async handleEvent() {
        const type = this.data.event.type;
        if (this[type] === undefined) {
            console.error(`Unknown event '${type}'`);
            throw RESET_SIGNAL;
        }

        await this[type]();
        hideEventCount();
        this.data.eventFinished();
    }

    /**
     * @param {string} message 
     * @returns {Promise<boolean>}
     */
    async confirmChoice(message) {
        const [finalizeButton, resetButton] = showPopup(message, "Finalize", "Reset");
        const popupButton = await popupSelector(this.cancelSignal).build();
        
        return popupButton === finalizeButton;
    }

    async chooseCardFromDiscard() {
        const cardItems = displayDiscard(this.data.discard, true);
        showDiscard();
        return await Deferred(this.cancelSignal)
            .withAwaitClickAndReturn(...cardItems)
            .withAwaitClick(UI.eventCounter)
            .build();
    }

    supportCheck(count) {
        const counts = chooseFromBags(this.data.kennedy, this.data.nixon, count, 12);
        this.data.lastBagOut = {
            kennedy: counts.count1,
            nixon: counts.count2,
            name: "Support Check"
        };
        return counts.count1;
    }

    async loseIssue() {
        let count = this.data.event.count;
        const player = getPlayerCandidate(this.data);
        const dp = candidateDp(player);

        showInfo(`Subtract ${count} issue support.`);

        while (count > 0) {
            showEventCount(count);
            const buttonClicked = await awaitClickAndReturn(this.cancelSignal, ...Object.values(UI.issueButtons));
            const issueClicked = this.data.issues[buttonClicked.dataIndex];

            if (Math.sign(this.data.issueScores[issueClicked]) !== dp) continue;

            this.data.issueScores[issueClicked] -= dp;
            showIssues(this.data);
            count--;
        }
        showEventCount(count);
        
        const confirmed = await this.confirmChoice("Finalize these choices?");
        if (!confirmed) throw RESET_SIGNAL;
    }

    async _changePer(isAdd, condition) {
        let count = Math.abs(this.data.event.count);
        const per = this.data.event.per;
        const regions = this.data.event.regions;
        const forced = this.data.event.forced;
        const stateItems = stateNames.map(name => ({
            name: name,
            button: UI.stateButtons[name].button
        }));

        const name = isAdd ? "Add" : "Remove";
        const targetOpp = (!isAdd && !forced) ? " from your opponent" : "";
        const maxClause = per >= count ? "" : `, max ${per} per state`;
        if (this.data.event.states) {
            const prettyStates = this.data.event.states.map(r => PRETTY_STATES[r]);
            showInfo(`${name} ${count} state support${targetOpp} in ${listAndCapitalize(prettyStates, "or")}${maxClause}.`);
        } else if (regions.length === ALL_REGIONS.length) {
            showInfo(`${name} ${count} state support${targetOpp}${maxClause}.`);
        } else {
            showInfo(`${name} ${count} state support${targetOpp} in the ${listAndCapitalize(regions.map(r => REGION_NAME[r]), "or")}${maxClause}.`);
        } 

        // adding to myself or removing from my opponent are my dp
        // only if I'm removing from myself should I invert my dp
        const dp = (isAdd || !forced) 
            ? candidateDp(this.data.event.target)
            : -candidateDp(this.data.event.target);

        const additions = {};
        let exited = false;
        while (count > 0) {
            showEventCount(count);
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...stateItems)
                .withAwaitClick(UI.eventCounter)
                .build();

            if (buttonClicked === UI.eventCounter) {
                exited = true;
                break;
            }

            const state = buttonClicked.name;
            if (additions[state] !== undefined && additions[state] >= per) continue;
            if (!regions.includes(STATE_REGION[state])) continue;
            if (!isAdd && Math.sign(this.data.cubes[state]) !== -dp) continue;
            if (!condition(state)) continue;

            this.data.cubes[state] += dp;
            showCubes(this.data);
            if (additions[state] === undefined) additions[state] = 0;
            additions[state]++;
            count--;
        }
        showEventCount(count);

        if (!exited) await awaitClick(this.cancelSignal, UI.eventCounter);
        const confirmed = await this.confirmChoice("Finalize these choices?");
        if (!confirmed) throw RESET_SIGNAL;
    }

    async changePer() {
        await this._changePer(this.data.event.count > 0, state => true);
    }

    async changeStates() {
        const states = this.data.event.states;
        await this._changePer(this.data.event.count > 0, state => states.includes(state));
    }

    async heartland() {
        await this._changePer(true, state => ELECTORS[state] <= 10);
    }

    async changeMedia() {
        const isAdd = this.data.event.count > 0;
        const dp = candidateDp(this.data.event.target);
        let count = Math.abs(this.data.event.count);

        if (isAdd) {
            showInfo(`Add ${count} media support cubes.`);
        } else {
            showInfo(`Remove ${count} media support cubes from your opponent.`);
        }

        let exited = false;
        while (count > 0) {
            showEventCount(count);
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...Object.values(UI.mediaButtons))
                .withAwaitClick(UI.eventCounter)
                .build();

            if (buttonClicked === UI.eventCounter) {
                exited = true;
                break;
            }

            const region = buttonClicked.dataKey;
            if (!isAdd && Math.sign(this.data.media[region]) !== -dp) continue;
            this.data.media[region] += dp;
            showMedia(this.data);
            count--;
        }
        showEventCount(count);

        if (!exited) await awaitClick(this.cancelSignal, UI.eventCounter);
        const confirmed = await this.confirmChoice("Finalize these choices?");
        if (!confirmed) throw RESET_SIGNAL;
    }

    async retrieve() {
        showInfo("Choose a card to add to your hand.");
        showEventCount("&#10003;");

        const eventCard = this.data.event.card;
        const cardItem = eventCard
            ? {name: eventCard, card: CARDS[eventCard]}
            : (await this.chooseCardFromDiscard());

        if (cardItem === UI.eventCounter) return;

        const [yesButton, noButton] = showPopupWithCard(
            "Retrieve this card?", cardItem.name, cardItem.card, 
            "Yes", "No"
        );
        const selection = await popupSelector(this.cancelSignal).build();
        if (selection === noButton) throw RESET_SIGNAL;

        const player = this.data.event.target;
        this.data[player].hand.push(cardItem.name);
        this.data.discard = this.data.discard.filter(name => name !== cardItem.name);
    }

    async eventFromDiscard() {
        showInfo("Choose a card to play its event.");
        showEventCount("&#10003;");

        const cardItem = await this.chooseCardFromDiscard();
        if (cardItem === UI.eventCounter) return;

        const [yesButton, noButton] = showPopupWithCard(
            "Play this card's event?", cardItem.name, cardItem.card, 
            "Yes", "No"
        );
        const selection = await popupSelector(this.cancelSignal).build();


        if (selection === noButton) throw RESET_SIGNAL;
        const player = this.data.event.target;
        this.data.eventFinished(); // end the eventFromDiscard event
        cardItem.card.event(this.data, player);

        if (CARDS[cardItem.name].eventLifetime === LIFETIME.TURN) {
            const discardedCard = this.data.discard.find(_card => _card.name === cardItem.name);
            if (discardedCard) discardedCard.lifetime = this.data.round;
        }

        if (this.data.event) // if the card queued up an event
            this.data.delayEvent(); // delay event so that progressing events doesn't skip anything
    }

    async drawCards() {
        const cardCount = this.data.event.count;
        const player = this.data.event.target;
        const [yesButton, noButton] = showPopup(
            `Draw ${cardCount} cards from the Campaign Deck?`, 
            "Yes", "No"
        );
        const popupButton = await popupSelector(this.cancelSignal).build();
        
        if (popupButton === noButton) return;
        this.data[player].hand.push(...popRandom(this.data.deck, cardCount));
    }

    async discard() {
        showInfo(`Discard any number of cards to redraw replacements.`);
        showEventCount("&#10003;");

        const player = this.data.event.target;
        if (this.data[player].hand.length === 0) {
            await awaitClick(this.cancelSignal, UI.eventCounter);
            return;
        }
        const cardItems = displayHand(
            this.data[player].hand, 
            true, 
            player
        );

        const selected = {};
        while (true) {
            const cardItem = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...cardItems)
                .withAwaitClick(UI.eventCounter)
                .build();

            if (cardItem === UI.eventCounter) {
                break;
            }

            if (selected[cardItem.name]) {
                selected[cardItem.name] = false;
                addCSSClass(cardItem.cardSlot.pointsCover, "hidden");
            } else {
                selected[cardItem.name] = true;
                removeCSSClass(cardItem.cardSlot.pointsCover, "hidden");
            }
        }

        const confirmed = await this.confirmChoice("Finalize these discards?");
        if (!confirmed) throw RESET_SIGNAL;

        const removed = Object.keys(selected)
            .filter(name => selected[name]);
        this.data.discard.push(...removed.map(name => ({
            name: name,
            player: null,
            lifetime: LIFETIME.NONE
        })));

        this.data[player].hand = this.data[player].hand
            .filter(name => !selected[name]);
        this.data[player].hand.push(...popRandom(this.data.deck, removed.length));
    }

    async emptyPer() {
        await this._changePer(true, state => this.data.cubes[state] === 0);
    }

    async lbj() {
        await this.unexhaust();

        showInfo("Add up to 2 state support in texas.");
        const dp = candidateDp(this.data.event.target);
        let exited = false;
        let count = 2;
        while (count > 0) {
            showEventCount(count);
            const clicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(UI.stateButtons[STATE_CODES.tx])
                .withAwaitClick(UI.eventCounter)
                .build();

            if (clicked === UI.eventCounter) {
                exited = true;
                break;
            }

            this.data.cubes[STATE_CODES.tx] += dp;
            count--;
            showCubes(this.data);
        }
        showEventCount(count);
        if (!exited) await awaitClick(this.cancelSignal, UI.eventCounter);

        await this.changePer();
    }

    async unexhaust() {
        const player = this.data.event.target;
        if (this.data[player].exhausted) {
            const [yesButton, noButton] = showPopup(
                "Refresh your candidate card?",
                "Yes", "No"
            );
            const selection = await popupSelector(this.cancelSignal).build();
   
            if (selection === yesButton) this.data[player].exhausted = false;
        }
    }

    async byrd() {
        await this._changePer(true, state => ELECTORS[state] <= 10);
    }

    async highHopes() {
        const hhEvent = this.data.event;
        if (hhEvent.count === 0) return;

        const campaignDeck = this.data[hhEvent.sourcePlayer].campaignDeck;
        const player = getPlayerCandidate(this.data);
        const cardName = campaignDeck[campaignDeck.length - hhEvent.count];
        const card = CARDS[cardName];
        if (card.party === PARTY.REPUBLICAN) {
            const [okayButton] = showPopupWithCard(
                "This card's event will not be played, it isn't Kennedy's.", 
                cardName, card, "Okay"
            );
            await awaitClick(this.cancelSignal, okayButton);
        } else if (!card.event) {
            const [okayButton] = showPopupWithCard(
                "This card does not have an event.", 
                cardName, card, "Okay"
            );
            await awaitClick(this.cancelSignal, okayButton);
        } else {
            const [okayButton] = showPopupWithCard(
                "This card's event will be played.", 
                cardName, card, "Okay"
            );
            await awaitClick(this.cancelSignal, okayButton);

            card.event(this.data, player);
        }

        hhEvent.count--;
        this.data.queueEvent(hhEvent);
    }

    async addIssue() {
        let count = this.data.event.count;
        const choseOne = this.data.event.choseOne;
        const dp = candidateDp(this.data.event.target);

        if (choseOne) {
            showInfo(`Chose an issue to add ${count} support.`);
        } else {
            showInfo(`Add up to issue ${count} support.`);
        }

        let exited = false;
        while (count > 0) {
            showEventCount(count);
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...Object.values(UI.issueButtons))
                .withAwaitClick(UI.eventCounter)
                .build();

            if (buttonClicked === UI.eventCounter) {
                exited = true;
                break;
            }

            const issueClicked = this.data.issues[buttonClicked.dataIndex];
            this.data.issueScores[issueClicked] += choseOne ? (dp * count) : dp;
            showIssues(this.data);
            count = choseOne ? 0 : (count - 1);
        }
        showEventCount(count);

        if (!exited && !choseOne) await awaitClick(this.cancelSignal, UI.eventCounter);
        const confirmed = await this.confirmChoice("Finalize these choices?");
        if (!confirmed) throw RESET_SIGNAL;
    }

    async pttv() {
        const dp = candidateDp(this.data.event.target);
        await this._changePer(true, state => Math.sign(this.data.media[REGION_NAME[STATE_REGION[state]]]) === dp);
    }

    async suburban() {
        await this._changePer(true, state => ELECTORS[state] >= 20);
    }

    async setIssueOrder() {
        showInfo("Select an issue to swap it left. You may do this as many times as you like.");
        showEventCount("&#10003;");

        while (true) {
            const issueClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...Object.values(UI.issueButtons))
                .withAwaitClick(UI.eventCounter)
                .build();
                
            if (issueClicked === UI.eventCounter) break;
                
            const i = issueClicked.dataIndex;
            if (i === 0) continue;
            
            const issue = this.data.issues[i];
            const swapIssue = this.data.issues[i - 1];
            this.data.issues[i] = swapIssue;
            this.data.issues[i - 1] = issue;
            showIssues(this.data);
        }

        const confirmed = await this.confirmChoice("Finalize this order?");
        if (!confirmed) throw RESET_SIGNAL;
    }

    async chooseCpUse() {
        if (this.data.event.lastRoll) {
            const count = this.data.event.lastRoll;
            showInfo(`Spend up to ${count} points on media support.`);
            showEventCount(count);

            await this.gameLogic.useMediaPoints(count, UI.eventCounter, p => showEventCount(p));
            const confirmed = await this.confirmChoice("Finalize these choices?");
            if (!confirmed) throw RESET_SIGNAL;

            return;
        }

        const count = this.data.event.count;
        const [cpButton, issueButton, mediaButton] = showPopup(
            `How would you like to spend ${count} CP?`,
            "Campaign", "Issues", "Media"
        );
        const selectedButton = await popupSelector(this.cancelSignal).build();
    
        if (selectedButton === cpButton) {
            await this.changePer();
            return;
        }
        
        if (selectedButton === issueButton) {
            showInfo(`Spend up to ${count} points on issues.`);
            showEventCount(count);
            await this.gameLogic.useIssuePoints(count, UI.eventCounter, p => showEventCount(p));
            const confirmed = await this.confirmChoice("Finalize these choices?");
            if (!confirmed) throw RESET_SIGNAL;
            return;
        }
        
        if (selectedButton === mediaButton) {
            const player = this.data.event.player;
            let points = 0;

            if (player === KENNEDY && flagActive(this.data, FLAGS.PROFILES_COURAGE)) {
                for (let c = 0; c < count; c++) {
                    let won = this.supportCheck(1) === 1;
                    if (!won) {
                        const [yesButton, noButton] = showPopup("You lost this support check. Redraw it?", "Yes", "No");
                        const popupButton = await popupSelector(this.cancelSignal).build();
                        if (popupButton === yesButton) {
                            won = this.supportCheck(1) === 1;
                        }
                    }
                    points += won ? 1 : 0;
                }
            } else {
                points = this.supportCheck(count);
            }

            if (!playerIsKennedy(this.data)) {
                points = count - points;
            }
            this.data.event.lastRoll = points;
        }
    }

    async opposition() {
        showInfo("Click the check when you're done looking at your opponent's hand.")
        showEventCount("&#10003;");
        displayHand(this.data.kennedy.hand, this.data.kennedy.exhausted, KENNEDY);
        await awaitClick(this.cancelSignal, UI.eventCounter);

        this.data.event = addPer(
            EVENT_TYPE.CHOOSE_CP_USE, NIXON,
            3, 3, ALL_REGIONS
        );
        this.chooseCpUse();
    }

    async henryLuce() {
        showInfo("Add 1 endorsement marker in any region.");

        const selected = await awaitClickAndReturn(this.cancelSignal, ...Object.values(UI.endorseButtons));
        const region = selected.dataKey;
        this.data.endorsements[region] += candidateDp(this.data.event.target);

        const confirmed = await this.confirmChoice("Finalize this choice?");
        if (!confirmed) throw RESET_SIGNAL;
    }

    async swingState() {
        const count = this.data.event.count;
        showInfo(`Choose a state to add ${count} state support.`);
        const dp = candidateDp(this.data.event.target);

        const stateItems = stateNames.map(name => ({
            name: name,
            button: UI.stateButtons[name].button
        }));

        while (true) {
            const selected = await awaitClickAndReturn(this.cancelSignal, ...stateItems);
            const score = this.data.cubes[selected.name];
            if (Math.sign(score) === -dp && Math.abs(score) < 4) {
                this.data.cubes[selected.name] += dp * 5;
                this.data[this.data.event.target].state = selected.name;
                return;
            }
        }
    }
}

export default EventHandler;