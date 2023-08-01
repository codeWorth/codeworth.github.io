let popupAborter = new AbortController();
let buttons = [];

function showPopup(title, ...buttonNames) {
    popupAborter.abort();
    popupAborter = new AbortController();

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

function popupSelector() {
    return Deferred(popupAborter)
        .withAwaitClick(...buttons)
        .withOnFinish(() => addCSSClass(choosePopup, "hidden"));
}

function showCardPopup(cardName, disableEvent) {
    const [event, campaign, issues, media] = showPopup(
        `What would you like to use '${cardName}' for?`, 
        "Event", "Campaign", "Issues", "Media"
    );
    event.disabled = disableEvent;
    return {eventButton: event, cpButton: campaign, issueButton: issues, mediaButton: media};
}