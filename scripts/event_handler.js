import { ELECTORS, RESET_SIGNAL, STATE_REGION } from "./constants.js";
import { Deferred, awaitClick, awaitClickAndReturn } from "./deferred.js";
import * as UI from "./dom.js";
import { popupSelector, showPopup, showPopupWithCard } from "./popup.js";
import { addCSSClass, candidateDp, getPlayerCandidate, removeCSSClass } from "./util.js";
import {
    displayHand,
    hideEventCount,
    showEventCount,
    showInfo, showIssues
} from "./view.js";

class EventHandler {
    constructor(gameData, cancelSignal) {
        this.data = gameData;
        this.cancelSignal = cancelSignal;
    }

    async handleEvent() {
        const type = this.data.event.type;
        if (this[type] === undefined) {
            console.error(`Unknown event '${type}'`);
            throw CONSTANTS.RESET_SIGNAL;
        }

        await this[type]();
        if (type !== "eventFromDiscard") {  // let this event handle its own cleanup, since it might cause another event
            this.data.event = null;
            hideEventCount();
        }
    }

    async loseIssue() {
        let count = this.data.event.count;
        const player = getPlayerCandidate(this.data);
        const dp = candidateDp(player);
        const issueItems = Object.keys(UI.issueButtons).map(index => ({
            name: this.data.issues[index],
            button: UI.issueButtons[index].button
        }));

        showInfo(`Subtract ${count} issue support.`);

        while (count > 0) {
            const buttonClicked = await Deferred(this.cancelSignal)
                .withAwaitClickAndReturn(...issueItems)
                .build();

            const issueClicked = buttonClicked.name;
            if (Math.sign(this.data.issueScores[issueClicked]) !== dp) continue;

            this.data.issueScores[issueClicked] -= dp;
            showIssues(this.data);
            count--;
        }
        
        const confirmed = await this.confirmChoice("Finalize these choices?");
        if (!confirmed) throw RESET_SIGNAL;
    }

    async _changePer(isAdd, condition) {
        let count = this.data.event.count;
        const per = this.data.event.per;
        const regions = this.data.event.regions;
        const stateItems = CONSTANTS.stateNames.map(name => ({
            name: name,
            button: UI.stateButtons[name].button
        }));

        const name = isAdd ? "Add" : "Remove";
        if (regions.length === 1) {
            showInfo(`${name} ${count} state support in the ${regions[0].toLowerCase()}, max ${per} per state.`);
        } else if (regions.length === 2) {
            showInfo(`${name} ${count} state support in the ${regions[0].toLowerCase()} or ${regions[1].toLowerCase()}, max ${per} per state.`);
        } else if (regions.length === 3) {
            showInfo(`${name} ${count} state support in the ${regions[0].toLowerCase()}, ${regions[1].toLowerCase()} or ${regions[2].toLowerCase()}, max ${per} per state.`);
        } else {
            showInfo(`${name} ${count} state support, max ${per} per state.`);
        } 

        const additions = {};
        const dp = candidateDp(this.data.event.target);
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

            this.data.cubes[state] += isAdd ? dp : -dp;
            if (additions[state] === undefined) additions[state] = 0;
            additions[state]++;
            count--;
        }

        if (!exited) await awaitClick(this.cancelSignal, UI.eventCounter);
        const confirmed = await this.confirmChoice("Finalize these choices?");
        if (!confirmed) throw RESET_SIGNAL;
    }

    async addPer() {
        await this._changePer(true, state => true);
    }

    async heartland() {
        await this._changePer(true, state => ELECTORS[state] <= 10);
    }

    async confirmChoice(message) {
        const [finalizeButton, resetButton] = showPopup(message, "Finalize", "Reset");
        const popupButton = await popupSelector(this.cancelSignal).build();
        
        return popupButton === finalizeButton;
    }

    async subPer() {
        await this._changePer(false, state => true);
    }

    async subMedia() {
        let count = this.data.event.count;
        const oppDp = -candidateDp(this.data.event.target);

        showInfo(`Remove ${count} media support from your opponent.`);
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
            if (Math.sign(this.data.media[region]) !== oppDp) continue;
            this.data.media[region] -= oppDp;
            count--;
        }

        if (!exited) await awaitClick(this.cancelSignal, UI.eventCounter);
        const confirmed = await this.confirmChoice("Finalize these choices?");
        if (!confirmed) throw RESET_SIGNAL;
    }

    async eventFromDiscard() {
        showInfo(`Choose a card to play its event.`);

        if (this.data.discard.length === 0) {
            await awaitClick(UI.eventCounter);
            return;
        }

        const cardItems = displayHand(this.data.discard, true, player);
        const cardItem = awaitClickAndReturn(this.cancelSignal, ...cardItems);
        const [yesButton, noButton] = showPopupWithCard(
            "Play this card's event?", cardItem.name, cardItem.card, 
            "Yes", "No"
        );
        const selection = await popupSelector(this.cancelSignal).build();

        if (selection === noButton) throw RESET_SIGNAL;
        const player = this.data.event.target;
        this.data.event = null;
        cardItem.card.event(this.data, player);
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
        const deck = this.data.deck;
        for (let i = 0; i < removed.length; i++) {
            this.data[player].hand.push(
                deck.splice(Math.floor(Math.random() * deck.length), 1)[0]
            );
        }
    }

    async emptyPer() {
        await this._changePer(true, state => this.data.cubes[state] === 0);
    }
}

export default EventHandler;