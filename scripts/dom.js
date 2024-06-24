import { ENDORSE_REGIONS } from "./cards.js";
import { addCSSClass, removeCSSClass, stateWinner } from "./util.js";

/**
 * @param {Element} e 
 * @returns {HTMLElement}
 */
// @ts-ignore
const html = e => e;

/**
 * @param {string} id 
 * @returns {HTMLElement}
 */
// @ts-ignore
const byId = (id) => document.getElementById(id);

/**
 * @param {string} className 
 * @returns {HTMLElement}
 */
// @ts-ignore
const byClass = (parent, className) => parent.getElementsByClassName(className)[0];

export const loginPage = byId("loginPage");
export const loginButton = byId("login");

export const joinPage = byId("joinPage");
export const logoutButton = byId("logout");
export const userNameField = byId("name");
export const createGameButton = byId("createGame");
export const gameCodeField = /** @type {HTMLInputElement} */ (byId("gameCode"));
export const joinGameButton = byId("joinGame");
export const deleteGameButton = byId("deleteGame");
export const ownedGameIdsField = byId("ownedGameIds");
export const joinedGameIdsField = byId("joinedGameIds");

export const choosePage = byId("choosePage");
export const kennedyButton = byId("kennedy");
export const nixonButton = byId("nixon");
export const nixonMomentum = byId("nixonCount");
export const kennedyMomentum = byId("kennedyCount");
export const nixonRestCount = byId("nixonRestCount");
export const kennedyRestCount = byId("kennedyRestCount");

export const gamePage = byId("gamePage");
export const stateButtons = Object.fromEntries([...document.getElementsByClassName("sb")].map(html).map(sb => [
    sb.id, {
        button: sb, 
        setText: s => html(sb.children[0]).innerText = s,
        setCount: (n, state, endorsements) => {
            html(sb.children[0]).innerText = n === 0 ? "" : Math.abs(n).toString();
            removeCSSClass(sb, "red");
            removeCSSClass(sb, "blue");
            const winner = stateWinner(state, n, endorsements);

            if (winner > 0) {
                addCSSClass(sb, "red");
            } else if (winner < 0) {
                addCSSClass(sb, "blue");
            }
        },
        showElectors: s => {
            html(sb.children[1]).innerText = s;
            removeCSSClass(sb.children[1], "hidden")
        },
        hideElectors: () => addCSSClass(sb.children[1], "hidden")
    }
]));

export const showElectorsButton = byId("showElectors");
export const hideSummaryButton = byId("hideSummary");
export const turnIndicator = byId("turnIndicator");
export const subTurnIndicator = byId("subTurnIndicator");
export const handDiv = byId("hand");
export const campaignDiv = byId("campaign");
export const effectsDiv = byId("effects");
export const handModeButton = byId("handMode");
export const handLabelDiv = byId("handLabel");

export const choosePopup = byId("choosePopup");
export const chooseWindow =  byId("chooseWindow");
export const chooseTitle = byClass(chooseWindow, "header");
export const chooseButtonsContainer = byId("buttonContainer");
export const showSummaryButton = byId("showSummary");

export const nixonIcon = byId("nixonIcon");
export const kennedyIcon = byId("kennedyIcon");

export const endorseButtons = Object.fromEntries([...document.getElementsByClassName("endorse")].map(html).map(sb => [
    sb.id, {
        button: sb,
        dataKey: /** @type {ENDORSE_REGIONS} */ (sb.dataset.key),
        setText: s => html(sb.children[0]).innerText = s,
        setCount: n => {
            html(sb.children[0]).innerText = n === 0 ? "" : Math.abs(n).toString();
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
export const mediaButtons = Object.fromEntries([...document.getElementsByClassName("media")].map(html).map(sb => [
    sb.id, {
        button: sb,
        dataKey: /** @type {ENDORSE_REGIONS} */ (sb.dataset.key),
        setText: s => html(sb.children[0]).innerText = s,
        setCount: n => {
            html(sb.children[0]).innerText = n === 0 ? "" : Math.abs(n).toString();
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
export const issueButtons = Object.fromEntries([...document.getElementsByClassName("issue-select")].map(html).map(sb => [
    parseInt(/** @type {string} */ (sb.dataset.index)), {
        button: sb,
        dataIndex: parseInt(/** @type {string} */ (sb.dataset.index)),
        setHighlight: on => {
            if (on) {
                addCSSClass(sb, "highlight");
            } else {
                removeCSSClass(sb, "highlight");
            }
        },
        setText: s => html(sb.children[0]).innerText = s,
        setCount: n => {
            html(sb.children[0]).innerText = n === 0 ? "" : Math.abs(n).toString();
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

export const infoDiv = byId("info");
export const tallyDiv = byId("tally");
export const eventCounter = byId("eventCounter");

const popupCardDiv = byId("popupCard");
/** @type {import('./view.js').CardDiv} */
export const popupCard = {
    card: /** @type {HTMLDivElement} */ (popupCardDiv), 
    header: /** @type {HTMLDivElement} */ (byClass(popupCardDiv, "header")), 
    body: /** @type {HTMLDivElement} */ (byClass(popupCardDiv, "body")), 
    candidateImg: /** @type {HTMLImageElement} */ (byClass(popupCardDiv, "candidate")), 
    issueImg: /** @type {HTMLImageElement} */ (byClass(popupCardDiv, "issue")), 
    cp: /** @type {HTMLDivElement} */ (byClass(popupCardDiv, "cp")), 
    state: /** @type {HTMLDivElement} */ (byClass(popupCardDiv, "state")), 
    rest: /** @type {HTMLDivElement} */ (byClass(popupCardDiv, "rest")),
    pointsCover: /** @type {HTMLDivElement} */ (byClass(popupCardDiv, "pointsCover"))
};

export const debateWindow = byId("debate");

/**
 * @typedef {Object} DebateRow
 * @property {number} index
 * @property {HTMLElement} issue
 * @property {HTMLElement} button
 * @property {HTMLElement} left
 * @property {HTMLElement} right
 */
/** @type {Object<number, DebateRow>} */
export const debateRows = Object.fromEntries([...document.getElementsByClassName("debate-row")]
    .map(html).map(row => [
        row.dataset.index,
        {
            index: row.dataset.index,
            issue: row.getElementsByClassName("issue-select-debate")[0],
            button: row.getElementsByClassName("issue-select-debate")[0],
            left: row.getElementsByClassName("handLeft")[0],
            right: row.getElementsByClassName("handRight")[0]
        }
    ]));