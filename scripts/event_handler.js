import { CARDS, PARTY } from "./cards.js";
import { ELECTORS, PRETTY_STATES, REGION_NAME, RESET_SIGNAL, STATE_REGION, stateNames } from "./constants.js";
import { Deferred, awaitClick, awaitClickAndReturn } from "./deferred.js";
import * as UI from "./dom.js";
import { ALL_REGIONS } from "./events.js";
import GameData from "./gameData.js";
import { popupSelector, showPopup, showPopupWithCard } from "./popup.js";
import { addCSSClass, candidateDp, getPlayerCandidate, listAndCapitalize, popRandom, removeCSSClass } from "./util.js";
import {
    displayHand,
    hideEventCount,
    showCubes,
    showEventCount,
    showInfo, showIssues, showMedia
} from "./view.js";

class EventHandler {
    /**
     * @param {GameData} gameData 
     * @param {AbortSignal} cancelSignal 
     */
    constructor(gameData, cancelSignal) {
        this.data = gameData;
        this.cancelSignal = cancelSignal;
    }

    async handleEvent() {
        const type = this.data.event.type;
        if (this[type] === undefined) {
            console.error(`Unknown event '${type}'`);
            throw RESET_SIGNAL;
        }

        const preserveEvent = await this[type]();
        hideEventCount();
        if (!preserveEvent) {   // if the above event is done
            this.data.eventFinished();
        }
    }

    async confirmChoice(message) {
        const [finalizeButton, resetButton] = showPopup(message, "Finalize", "Reset");
        const popupButton = await popupSelector(this.cancelSignal).build();
        
        return popupButton === finalizeButton;
    }

    async chooseCardFromDiscard() {
        const cardItems = displayHand(this.data.discard, true, player);
        return await Deferred(this.cancelSignal)
            .withAwaitClickAndReturn(...cardItems)
            .withAwaitClick(UI.eventCounter)
            .build();
    }

    async loseIssue() {
        let count = this.data.event.count;
        const player = getPlayerCandidate(this.data);
        const dp = candidateDp(player);

        showInfo(`Subtract ${count} issue support.`);

        while (count > 0) {
            showEventCount(count);
            const buttonClicked = await awaitClickAndReturn(...UI.issueButtons);
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
        const targetOpp = (!isAdd && !forced) ? " from your opponent" : ""
        if (this.data.event.states) {
            const prettyStates = this.data.event.states.map(r => PRETTY_STATES[r]);
            showInfo(`${name} ${count} state support${targetOpp} in ${listAndCapitalize(prettyStates, "or")}, max ${per} per state.`);
        } else if (regions.length === ALL_REGIONS.length) {
            showInfo(`${name} ${count} state support${targetOpp}, max ${per} per state.`);
        } else {
            showInfo(`${name} ${count} state support${targetOpp} in the ${listAndCapitalize(regions.map(r => REGION_NAME[r]), "or")}, max ${per} per state.`);
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

    async addStates() {
        const states = this.data.event.states;
        await this._changePer(true, state => states.includes(state));
    }

    async heartland() {
        await this._changePer(true, state => ELECTORS[state] <= 10);
    }

    async addMedia() {
        this._changeMedia(candidateDp(this.data.event.target), true);
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
                .withAwaitClickAndReturn(...UI.mediaButtons)
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
        showEventCount("✓");

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
        showEventCount("✓");

        const cardItem = await this.chooseCardFromDiscard();
        if (cardItem === UI.eventCounter) return false;

        const [yesButton, noButton] = showPopupWithCard(
            "Play this card's event?", cardItem.name, cardItem.card, 
            "Yes", "No"
        );
        const selection = await popupSelector(this.cancelSignal).build();

        if (selection === noButton) throw RESET_SIGNAL;
        const player = this.data.event.target;
        cardItem.card.event(this.data, player);
        return true;
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
        showEventCount("✓");

        const player = this.data.event.target;
        if (this.data[player].hand.length === 0) {
            await awaitClick(UI.eventCounter);
            return;
        }
        const cardItems = displayHand(
            this.data[player].hand, 
            this.data[player].exhausted, 
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
        this.data.discard.push(...removed);

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
                .withAwaitClickAndReturn(UI.stateButtons.texas)
                .withAwaitClick(UI.eventCounter)
                .build();

            if (clicked === UI.eventCounter) {
                exited = true;
                break;
            }

            this.data.cubes.texas += dp;
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
        if (hhEvent.count === 0) return false;  // clear event if we're done
        hhEvent.count--;

        const campaignDeck = this.data[hhEvent.sourcePlayer].campaignDeck;
        const player = getPlayerCandidate(this.data);
        const cardName = campaignDeck.slice(-i - 1)[0];
        const card = CARDS[cardName];
        if (card.party === PARTY.DEMOCRAT) {
            const [okayButton] = showPopupWithCard(
                "This card's event will be played.", 
                cardName, card, "Okay"
            );
            await awaitClick(this.cancelSignal, okayButton);

            card.event(this.data, player);
            this.data.queueEvent(hhEvent);
        }

        return true;
    }

    async pierre() {
        showInfo("Chose an issue to at 3 support.");

        const buttonClicked = await awaitClickAndReturn(...UI.issueButtons);
        const issueClicked = this.data.issues[buttonClicked.dataIndex];
        this.data.issueScores[issueClicked] += candidateDp(this.event.data.target) * 3;  
    }
}

export default EventHandler;