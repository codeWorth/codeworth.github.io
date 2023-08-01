import { 
    removeAllChildren, 
    addCSSClass,
    removeCSSClass 
} from "./util.js";
import { chooseButtonsContainer, chooseTitle, choosePopup } from "./dom.js";
import { Deferred } from "./deferred.js";

let buttons = [];

export function showPopup(title, ...buttonNames) {
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

export function showCardPopup(cardName, disableEvent) {
    const [event, campaign, issues, media] = showPopup(
        `What would you like to use '${cardName}' for?`, 
        "Event", "Campaign", "Issues", "Media"
    );
    event.disabled = disableEvent;
    return {eventButton: event, cpButton: campaign, issueButton: issues, mediaButton: media};
}