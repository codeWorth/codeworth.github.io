import { 
    doc, getDoc, updateDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import GameLogic from "./game_logic.js";
import GameSetup from "./game_setup.js";
import * as VIEW from "./view.js";
import * as CONSTANTS from "./constants.js";
import { addCSSClass, getPlayerCandidate, removeCSSClass } from "./util.js";
import { AbortError } from "./deferred.js";
import { gameIdsField, infoDiv, userNameField } from "./dom.js";
import { setUser } from './user.js';

var db = undefined;
var gameId = undefined;

let cancelUI = new AbortController();

export async function setup(user_, db_) {
    setUser(user_);
    db = db_;

    const gameSetup = new GameSetup(user_, db, gameUpdate, enterGame);
    gameIdsField.innerText = (await gameSetup.getGames()).join("\n");
    userNameField.innerText = `Logged in as ${user_.displayName} (${user_.email})`;
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
    infoDiv.innerText = "";
    VIEW.showBagRoll(gameData);
    addCSSClass(choosePopup, "hidden");

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

    if (gameData.currentPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.PLAY_CARDS) {
        await logic.playHand();
        return logic.data;
    } else if (gameData[playerCandidate].hand.length > 0) {
        VIEW.displayHand(
            gameData[playerCandidate].hand, 
            gameData[playerCandidate].exhausted, 
            playerCandidate
        );
    } 

    if (gameData.phase === CONSTANTS.PHASE.CHOOSE_FIRST && gameData.choosingPlayer === playerCandidate) {
        await logic.chooseFirst();
        return logic.data;
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.ISSUE_SWAP) {
        await logic.issueSwap();
        return logic.data;
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.ISSUE_REWARD_CHOICE) {
        await logic.chooseIssueReward();
        return logic.data;
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.ISSUE1_ENDORSE_REWARD) {
        await logic.firstStrategy();
        return logic.data;
    }

    if (gameData.choosingPlayer === playerCandidate && gameData.phase === CONSTANTS.PHASE.STRATEGY) {
        await logic.secondStrategy();
        return logic.data;
    }

    return {};
}