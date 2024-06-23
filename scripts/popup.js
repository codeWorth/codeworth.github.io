import { 
    removeAllChildren, 
    addCSSClass,
    removeCSSClass 
} from "./util.js";
import { chooseButtonsContainer, chooseTitle, choosePopup, popupCard } from "./dom.js";
import { Deferred, DeferredBuilder } from "./deferred.js";
import { ISSUE_URL, PARTY_URL } from "./cards.js";

/** @type {HTMLButtonElement[]} */
let buttons = [];

/**
 * @param {string} title 
 * @param {string} cardName 
 * @param {import('./cards.js').Card} card 
 * @param  {...string} buttonNames 
 */
export function showPopupWithCard(title, cardName, card, ...buttonNames) {
    showCard(cardName, card);
    return _showPopup(title, ...buttonNames);
}

/**
 * @param {string} title 
 * @param  {...string} buttonNames 
 */
export function showPopup(title, ...buttonNames) {
    addCSSClass(popupCard.card, "hidden");
    return _showPopup(title, ...buttonNames);
}

/**
 * @param {string} title 
 * @param  {...string} buttonNames 
 */
function _showPopup(title, ...buttonNames) {
    removeAllChildren(chooseButtonsContainer);
    chooseTitle.innerText = title;

    buttons = buttonNames.map(name => {
        const button = document.createElement("button");
        button.innerText = name;
        return button;
    })
    buttons.forEach(button => chooseButtonsContainer.appendChild(button));

    removeCSSClass(choosePopup, "hidden");
    return buttons;
}

/** 
 * @param {AbortSignal} cancelSignal 
 * @returns {DeferredBuilder<HTMLElement>}
 */
export function popupSelector(cancelSignal) {
    const builder = /** @type {DeferredBuilder<HTMLElement>} */ (Deferred(cancelSignal));
    return builder
        .withAwaitClick(...buttons)
        .withOnFinish(() => addCSSClass(choosePopup, "hidden"));
}

/**
 * @param {string} cardName 
 * @param {import('./cards.js').Card} card 
 * @param {boolean} disableEvent 
 */
export function showCardPopup(cardName, card, disableEvent) {
    const [event, campaign, issues, media] = showPopup(
        `What would you like to use '${cardName}' for?`, 
        "Event", "Campaign", "Issues", "Media"
    );
    event.disabled = disableEvent;
    showCard(cardName, card);

    return {eventButton: event, cpButton: campaign, issueButton: issues, mediaButton: media};
}

/**
 * @param {string} cardName 
 * @param {import('./cards.js').Card} card 
 */
function showCard(cardName, card) {
    popupCard.header.innerText = cardName;
    popupCard.body.innerText = card.text;
    popupCard.cp.innerText = card.points + " CP";
    popupCard.rest.innerText = card.rest + " Rest";
    popupCard.state.innerText = card.state.toUpperCase();
    popupCard.candidateImg.src = PARTY_URL(card.party);
    popupCard.issueImg.src = card.issue === null ? "../images/blank_issue.png" : ISSUE_URL(card.issue);
    removeCSSClass(popupCard.card, "hidden");
}