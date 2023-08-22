import { addCSSClass, removeCSSClass } from "./util.js";

export const loginPage = document.getElementById("loginPage");
export const loginButton = document.getElementById("login");

export const joinPage = document.getElementById("joinPage");
export const logoutButton = document.getElementById("logout");
export const userNameField = document.getElementById("name");
export const createGameButton = document.getElementById("createGame");
export const gameCodeField = document.getElementById("gameCode");
export const joinGameButton = document.getElementById("joinGame");
export const deleteGameButton = document.getElementById("deleteGame");
export const ownedGameIdsField = document.getElementById("ownedGameIds");
export const joinedGameIdsField = document.getElementById("joinedGameIds");

export const choosePage = document.getElementById("choosePage");
export const kennedyButton = document.getElementById("kennedy");
export const nixonButton = document.getElementById("nixon");
export const nixonMomentum = document.getElementById("nixonCount");
export const kennedyMomentum = document.getElementById("kennedyCount");
export const nixonRestCount = document.getElementById("nixonRestCount");
export const kennedyRestCount = document.getElementById("kennedyRestCount");

export const gamePage = document.getElementById("gamePage");
export const stateButtons = Object.fromEntries([...document.getElementsByClassName("sb")].map(sb => [
    sb.id, {
        button: sb, 
        setText: s => sb.children[0].innerText = s,
        setCount: n => {
            sb.children[0].innerText = n === 0 ? "" : Math.abs(n);
            removeCSSClass(sb, "red");
            removeCSSClass(sb, "blue");
            if (n > 0) {
                addCSSClass(sb, "red");
            } else if (n < 0) {
                addCSSClass(sb, "blue");
            }
        },
        showElectors: s => {
            sb.children[1].innerText = s;
            removeCSSClass(sb.children[1], "hidden")
        },
        hideElectors: () => addCSSClass(sb.children[1], "hidden")
    }
]));
export const showElectorsButton = document.getElementById("showElectors");
export const turnIndicator = document.getElementById("turnIndicator");
export const handDiv = document.getElementById("hand");
export const campaignDiv = document.getElementById("campaign");
export const handModeButton = document.getElementById("handMode");

export const choosePopup = document.getElementById("choosePopup");
export const chooseWindow = document.getElementById("chooseWindow");
export const chooseTitle = chooseWindow.getElementsByClassName("header")[0];
export const chooseButtonsContainer = document.getElementById("buttonContainer");

export const nixonIcon = document.getElementById("nixonIcon");
export const kennedyIcon = document.getElementById("kennedyIcon");

export const endorseButtons = Object.fromEntries([...document.getElementsByClassName("endorse")].map(sb => [
    sb.id, {
        button: sb,
        dataKey: sb.dataset.key,
        setText: s => sb.children[0].innerText = s,
        setCount: n => {
            sb.children[0].innerText = n === 0 ? "" : Math.abs(n);
            removeCSSClass(sb, "red");
            removeCSSClass(sb, "blue");
            if (n > 0) {
                addCSSClass(sb, "red");
            } else if (n < 0) {
                addCSSClass(sb, "blue");
            }
        }
    }
]));
export const mediaButtons = Object.fromEntries([...document.getElementsByClassName("media")].map(sb => [
    sb.id, {
        button: sb,
        dataKey: sb.dataset.key,
        setText: s => sb.children[0].innerText = s,
        setCount: n => {
            sb.children[0].innerText = n === 0 ? "" : Math.abs(n);
            removeCSSClass(sb, "red");
            removeCSSClass(sb, "blue");
            if (n > 0) {
                addCSSClass(sb, "red");
            } else if (n < 0) {
                addCSSClass(sb, "blue");
            }
        }
    }
]));
export const issueButtons = Object.fromEntries([...document.getElementsByClassName("issue-select")].map(sb => [
    parseInt(sb.dataset.index), {
        button: sb,
        dataIndex: sb.dataset.index,
        setText: s => sb.children[0].innerText = s,
        setCount: n => {
            sb.children[0].innerText = n === 0 ? "" : Math.abs(n);
            removeCSSClass(sb, "red");
            removeCSSClass(sb, "blue");
            if (n > 0) {
                addCSSClass(sb, "red");
            } else if (n < 0) {
                addCSSClass(sb, "blue");
            }
        }
    }
]));

export const infoDiv = document.getElementById("info");
export const eventCounter = document.getElementById("eventCounter");

const popupCardDiv = document.getElementById("popupCard");
export const popupCard = {
    card: popupCardDiv, 
    header: popupCardDiv.getElementsByClassName("header")[0], 
    body: popupCardDiv.getElementsByClassName("body")[0], 
    candidateImg: popupCardDiv.getElementsByClassName("candidate")[0], 
    issueImg: popupCardDiv.getElementsByClassName("issue")[0], 
    cp: popupCardDiv.getElementsByClassName("cp")[0], 
    state: popupCardDiv.getElementsByClassName("state")[0], 
    rest: popupCardDiv.getElementsByClassName("rest")[0]
};