import { 
    removeAllChildren, 
    addCSSClass,
    removeCSSClass 
} from "./util.js";
import { chooseButtonsContainer, chooseTitle, choosePopup, popupCard } from "./dom.js";
import { Deferred } from "./deferred.js";
import { ISSUE_URL, PARTY_URL } from "./cards.js";

let buttons = [];

export function showPopup(title, ...buttonNames) {
    addCSSClass(popupCard.card, "hidden");
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

export function popupSelector(cancelSignal) {
    return Deferred(cancelSignal)
        .withAwaitClick(...buttons)
        .withOnFinish(() => addCSSClass(choosePopup, "hidden"));
}

export function showCardPopup(cardName, card, disableEvent) {
    const [event, campaign, issues, media] = showPopup(
        `What would you like to use '${cardName}' for?`, 
        "Event", "Campaign", "Issues", "Media"
    );
    event.disabled = disableEvent;

    popupCard.header.innerText = cardName;
    popupCard.body.innerText = card.text;
    popupCard.cp.innerText = card.points + " CP";
    popupCard.rest.innerText = card.rest + " Rest";
    popupCard.state.innerText = card.state === null ? "" : card.state.toUpperCase();
    popupCard.candidateImg.src = PARTY_URL[card.party];
    popupCard.issueImg.src = card.issue === null ? "" : ISSUE_URL[card.issue];
    removeCSSClass(popupCard.card, "hidden");

    return {eventButton: event, cpButton: campaign, issueButton: issues, mediaButton: media};
}