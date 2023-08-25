import { 
    doc, getDoc, updateDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import GameLogic from "./game_logic.js";
import GameSetup from "./game_setup.js";
import * as VIEW from "./view.js";
import * as CONSTANTS from "./constants.js";
import { addCSSClass, getPlayerCandidate, removeCSSClass } from "./util.js";
import { AbortError } from "./deferred.js";
import { infoDiv, userNameField } from "./dom.js";
import { setUser } from './user.js';

var db = undefined;
var gameId = undefined;

let cancelUI = new AbortController();

export async function setup(user_, db_) {
    setUser(user_);
    db = db_;

    const url = new URL(window.location.href);
    const gameId = url.searchParams.get("id");
    const gameSetup = new GameSetup(user_, db, gameUpdate, enterGame);
    const userGames = await gameSetup.getGames();

    userNameField.innerText = `Logged in as ${user_.displayName} (${user_.email})`;
    if (gameId === null || !userGames.includes(gameId)) {
        gameSetup.showGames();
    } else {
        gameSetup.joinGame(gameId);
    }
}

async function enterGame(gameId_) {
    gameId = gameId_;
    removeCSSClass(gamePage, "hidden");
    const gameData = (await getDoc(doc(db, "elec_games", gameId))).data();
    VIEW.showCubes(gameData);
    gameUpdate(gameData);
}

async function refreshData() {
    const rec = await getDoc(doc(db, "elec_games", gameId));
    return rec.data();
}

export function gameUpdate(gameData) {
    if (!gameData.started) return;
    VIEW.updateCubes(gameData);

    const playerCandidate = getPlayerCandidate(gameData);
    VIEW.showEndorsements(gameData);
    VIEW.showMedia(gameData);
    VIEW.showIssues(gameData);
    VIEW.showMedia(gameData);
    VIEW.moveIcons(gameData);
    VIEW.showRound(gameData, playerCandidate);
    VIEW.showMomentum(gameData);
    VIEW.showRest(gameData);
    VIEW.highlightSelf(playerCandidate);
    infoDiv.innerText = "";
    VIEW.showBagRoll(gameData);
    VIEW.displayCampaignDeck(gameData[playerCandidate].campaignDeck);
    addCSSClass(choosePopup, "hidden");

    if ((gameData.phase === CONSTANTS.PHASE.DEBATE
        || gameData.phase === CONSTANTS.PHASE.DEBATE_INITIATIVE
        || gameData.phase === CONSTANTS.PHASE.DEBATE_PARTY
        || gameData.phase === CONSTANTS.PHASE.DEBATE_RESOLVE)
        && gameData.event === null
    ) {
        VIEW.showCampaignDeck();
        VIEW.showDebateWindow(gameData);
    } else {
        VIEW.hideDebateWindow();
    }

    if (gameData[playerCandidate].hand.length > 0) {
        VIEW.displayHand(
            gameData[playerCandidate].hand, 
            gameData[playerCandidate].exhausted, 
            playerCandidate
        );
    }

    gameAction(gameData)
        .then(data => {
            updateDoc(doc(db, "elec_games", gameId), data);
        })
        .catch(error => {
            if (error === CONSTANTS.RESET_SIGNAL) {
                refreshData().then(gameUpdate);
                return;
            }
            if (!(error instanceof AbortError)) throw error;
        });
}

async function gameAction(gameData) {
    if (!cancelUI.signal.aborted) cancelUI.abort();
    cancelUI = new AbortController();

    const logic = new GameLogic(gameData, cancelUI.signal);
    const playerCandidate = getPlayerCandidate(gameData);

    if (gameData.event !== null) {
        if (gameData.event.target === playerCandidate) {
            await logic.handleEvent();
            return logic.getData();
        } else {
            return {};  // pause until opponent handles event
        }
    }

    if (gameData.phase === CONSTANTS.PHASE.TRIGGER_EVENT && gameData.choosingPlayer === playerCandidate) {
        await logic.triggerEvent();
        return logic.getData();
    } else if (gameData.chosenCard !== null && gameData.currentPlayer !== playerCandidate) {
        await logic.showChosenCard();
        return logic.getData();
    }

    if (gameData.currentPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.PLAY_CARDS) {
        if (gameData[playerCandidate].hand.length === 0) {
            await logic.getHand();
            VIEW.showHand();
        } else {
            await logic.playHand();
        }
        return logic.getData();
    }

    if (gameData.phase === CONSTANTS.PHASE.CHOOSE_FIRST && gameData.choosingPlayer === playerCandidate) {
        await logic.chooseFirst();
        return logic.getData();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.ISSUE_SWAP) {
        await logic.issueSwap();
        return logic.getData();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.ISSUE_REWARD_CHOICE) {
        await logic.chooseIssueReward();
        return logic.getData();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.ISSUE1_ENDORSE_REWARD) {
        await logic.firstStrategy();
        return logic.getData();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.STRATEGY) {
        await logic.secondStrategy();
        return logic.getData();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.DEBATE) {
        await logic.debate();
        return logic.getData();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.DEBATE_INITIATIVE) {
        await logic.debateChooseFirst();
        return logic.getData();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.DEBATE_PARTY) {
        await logic.debateChooseParty();
        return logic.getData();
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.DEBATE_RESOLVE) {
        await logic.debateResolve();
        return logic.getData();
    }
    
    return {};
}