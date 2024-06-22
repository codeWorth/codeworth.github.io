import { 
    onSnapshot, runTransaction,
    doc, collection, query, where,
    getDoc, setDoc, getDocs, deleteDoc, updateDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { addCSSClass, removeCSSClass } from "./util.js";
import {
    NIXON, KENNEDY,
    PHASE, DEFAULT_COUNTS,
    ISSUE_URLS
} from "./constants.js";
import { CARDS, ENDORSEMENT_CARDS, ENDORSE_REGIONS } from './cards.js';
import * as UI from "./dom.js";

class GameSetup {
    constructor(user, db, gameUpdate, enterGame) {
        this.user = user;
        this.db = db;
        this.gameUpdate = gameUpdate;
        this.enterGame = enterGame;

        UI.createGameButton.onclick = () => this.makeGame();
        UI.joinGameButton.onclick = () => this.joinGame(UI.gameCodeField.value);
        UI.deleteGameButton.onclick = () => this.deleteGame(UI.gameCodeField.value);
    }

    async getGamePlayers(gameId) {
        const gamePlayers = await getDocs(query(collection(this.db, "elec_games", gameId, "players")));
        return gamePlayers.docs.map(doc => doc.id);
    }

    async showGames() {
        const ownedGames = await getDocs(query(
            collection(this.db, "elec_games"), 
            where("owner", "==", this.user.uid)
        ));
        const ownedIds = ownedGames.docs.map(game => game.id);
        
        const allGameIds = await this.getGames();
        const joinedIds = allGameIds.filter(id => !ownedIds.includes(id));

        UI.ownedGameIdsField.innerText = ownedIds.join("\n");
        UI.joinedGameIdsField.innerText = joinedIds.join("\n");
    }
    
    async getGames() {
        const userGames = await getDocs(query(collection(this.db, "users", this.user.uid, "elec_games")));
        return userGames.docs.map(doc => doc.id);
    }
    
    async makeGame() {
        const newGameRef = doc(collection(this.db, "users", this.user.uid, "elec_games"));
        const gameId = newGameRef.id;

        await setDoc(newGameRef, {});
        await setDoc(doc(this.db, "elec_games", gameId), {
            started: false,
            owner: this.user.uid
        });
    
        await this.joinGame(gameId);
        this.showGames();
    }
    
    async joinGame(gameId) {
        const url = new URL(window.location.href);
        url.searchParams.set("id", gameId);
        window.history.pushState({}, "", url.href);

        const userInRef = doc(this.db, "users", this.user.uid, "elec_games", gameId);
        await setDoc(userInRef, {});

        const gameRef = doc(this.db, "elec_games", gameId);
        const gameEntry = await getDoc(gameRef);
        if (!gameEntry.exists()) {
            deleteDoc(userInRef);
            console.error("Failed to join game, doesn't exist");
            return;
        }
    
        onSnapshot(gameRef, game => this.gameUpdate(game.data()));
    
        if (gameEntry.data().started) {
            addCSSClass(UI.joinPage, "hidden");
            this.enterGame(gameId);
            return;
        }
    
        await setDoc(doc(this.db, "elec_games", gameId, "players", this.user.uid), {});
        const gamePlayerUids = await this.getGamePlayers(gameId);
        const otherPlayerUid = gamePlayerUids.filter(uid => uid != this.user.uid)[0];
        if (gamePlayerUids.length >= 2) {
            addCSSClass(UI.joinPage, "hidden");
            this.startGame(gameId, this.user.uid, otherPlayerUid);
        }
    }
    
    async deleteGame(gameId) {
        const gameEntry = await getDoc(doc(this.db, "elec_games", gameId));
        if (gameEntry.data().owner !== this.user.uid) {
            console.error("Non-owner attempted to delete game.");
            return;
        }

        await runTransaction(this.db, async (transaction) => {
            const gamePlayerUids = await this.getGamePlayers(gameId);
            gamePlayerUids.forEach(uid =>
                transaction.delete(doc(this.db, "elec_games", gameId, "players", uid))
            );
            gamePlayerUids.forEach(uid => 
                transaction.delete(doc(this.db, "users", uid, "elec_games", gameId))
            );
            transaction.delete(doc(this.db, "elec_games", gameId));
        });        
        
        this.showGames();
        UI.gameCodeField.value = "";
    }
    
    async startGame(gameId, selfPlayer, otherPlayer) {
        removeCSSClass(UI.choosePage, "hidden");
        UI.kennedyButton.onclick = () => this.choosePlayer(gameId, true, selfPlayer, otherPlayer);
        UI.nixonButton.onclick = () => this.choosePlayer(gameId, false, selfPlayer, otherPlayer);
    }
    
    async choosePlayer(gameId, isKennedy, selfPlayer, otherPlayer) {
        const order = Object.keys(ISSUE_URLS);
        const issues = [];
        for (let i = 0; i < Object.keys(ISSUE_URLS).length; i++) {
            const index = Math.floor(Math.random() * order.length);
            issues[i] = order[index];
            order.splice(index, 1);
        }

        let kenCount = 12;
        let nixCount = 12;

        while (kenCount > 10 && nixCount > 10) {
            const bagItem = Math.floor(Math.random() * (kenCount + nixCount));
            const isKennedy = bagItem < kenCount;
            if (isKennedy) {
                kenCount--;
            } else {
                nixCount--;
            }
        }
        const kenWon = kenCount < nixCount;

        await updateDoc(doc(this.db, "elec_games", gameId), {
            started: true,
            choosingPlayer: kenWon ? KENNEDY : NIXON,
            currentPlayer: null,
            phase: PHASE.CHOOSE_FIRST,
            preempted: false,
            chosenCard: null,
            cubes: DEFAULT_COUNTS,
            issues: issues,
            deck: Object.keys(CARDS),
            endorsementsDeck: ENDORSEMENT_CARDS,
            discard: [],
            debate: null,
            finalScore: null,
            turn: 0,
            round: 1,
            lastBagOut: {
                kennedy: 12 - kenCount,
                nixon: 12 - nixCount,
                name: "Initiative"
            },
            lastRoll: null,
            endorsements: {
                [ENDORSE_REGIONS.WEST]: 0,
                [ENDORSE_REGIONS.EAST]: 0,
                [ENDORSE_REGIONS.MID]: 0,
                [ENDORSE_REGIONS.SOUTH]: 0
            },
            media: {
                [ENDORSE_REGIONS.WEST]: 0,
                [ENDORSE_REGIONS.EAST]: 0,
                [ENDORSE_REGIONS.MID]: 0,
                [ENDORSE_REGIONS.SOUTH]: 0
            },
            issueScores: {
                [Object.keys(ISSUE_URLS)[0]]: 0,
                [Object.keys(ISSUE_URLS)[1]]: 0,
                [Object.keys(ISSUE_URLS)[2]]: 0
            },
            kennedy: {
                uid: isKennedy ? selfPlayer : otherPlayer,
                bag: 0,
                hand: [],
                state: "massachusetts",
                rest: 0,
                exhausted: false,
                momentum: 2,
                campaignDeck: [],
                needDiscard: 0
            },
            nixon: {
                uid: isKennedy ? otherPlayer : selfPlayer,
                bag: 0,
                hand: [],
                state: "california",
                rest: 0,
                exhausted: false,
                momentum: 2,
                campaignDeck: [],
                needDiscard: 0
            },
            cpMods: [],
            event: null,
            flags: {},
            prev: null,
            cardMode: null
        });
        addCSSClass(choosePage, "hidden");
        this.enterGame(gameId);
    }
}

export default GameSetup;