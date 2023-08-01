class GameSetup {
    constructor(fbMethods, user, db, gameUpdate, enterGame) {
        this.fb = fbMethods;
        this.user = user;
        this.db = db;
        this.gameUpdate = gameUpdate;
        this.enterGame = enterGame;

        createGameButton.onclick = () => this.makeGame();
        joinGameButton.onclick = () => this.joinGame(gameCodeField.value);
        deleteGameButton.onclick = () => this.deleteGame(gameCodeField.value);
    }

    async getGamePlayers(gameId) {
        const gamePlayers = await this.fb.getDocs(this.fb.query(this.fb.collection(this.db, "elec_games", gameId, "players")));
        return gamePlayers.docs.map(doc => doc.id);
    }
    
    async getGames() {
        const userGames = await this.fb.getDocs(this.fb.query(this.fb.collection(this.db, "users", user.email, "elec_games")));
        return userGames.docs.map(doc => doc.id);
    }
    
    async makeGame() {
        const newGameRef = this.fb.doc(this.fb.collection(this.db, "users", user.email, "elec_games"));
        const gameId = newGameRef.id;

        await this.fb.setDoc(newGameRef, {});
        await this.fb.setDoc(this.fb.doc(this.db, "elec_games", gameId), {
            started: false,
            owner: user.email
        });
    
        await this.joinGame(gameId);
        gameIdsField.innerText = (await this.getGames()).join("\n");
    }
    
    async joinGame(gameId) {
        const gameRef = this.fb.doc(this.db, "elec_games", gameId);
        const gameEntry = await this.fb.getDoc(gameRef);
        if (!gameEntry.exists()) {
            console.error("Failed to join game, doesn't exist");
            return;
        }
    
        this.fb.onSnapshot(gameRef, game => this.gameUpdate(game.data()));
    
        if (gameEntry.data().started) {
            addCSSClass(joinPage, "hidden");
            this.enterGame(gameId);
            return;
        }
    
        await this.fb.setDoc(this.fb.doc(this.db, "users", user.email, "elec_games", gameId), {});
        await this.fb.setDoc(this.fb.doc(this.db, "elec_games", gameId, "players", user.email), {});
        const gamePlayerEmails = await this.getGamePlayers(gameId);
        const otherPlayerEmail = gamePlayerEmails.filter(email => email != user.email)[0];
        if (gamePlayerEmails.length >= 2) {
            addCSSClass(joinPage, "hidden");
            this.startGame(gameId, user.email, otherPlayerEmail);
        }
    }
    
    async deleteGame(gameId) {
        const gamePlayerEmails = await this.getGamePlayers(gameId);
        await Promise.all(gamePlayerEmails.map(email => 
            this.fb.deleteDoc(this.fb.doc(this.db, "users", email, "elec_games", gameId))
        ));
        await Promise.all(gamePlayerEmails.map(email =>
            this.fb.deleteDoc(this.fb.doc(this.db, "elec_games", gameId, "players", email))
        ));
        
        await this.fb.deleteDoc(this.fb.doc(this.db, "elec_games", gameId));
    }
    
    async startGame(gameId, selfPlayer, otherPlayer) {
        removeCSSClass(choosePage, "hidden");
        kennedyButton.onclick = () => this.choosePlayer(gameId, true, selfPlayer, otherPlayer);
        nixonButton.onclick = () => this.choosePlayer(gameId, false, selfPlayer, otherPlayer);
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

        await this.fb.updateDoc(this.fb.doc(this.db, "elec_games", gameId), {
            started: true,
            choosingPlayer: kenWon ? KENNEDY : NIXON,
            currentPlayer: null,
            phase: PHASE.CHOOSE_FIRST,
            cubes: defaultCounts,
            issues: issues,
            deck: Object.keys(CARDS),
            endorsementsDeck: ENDORSEMENT_CARDS,
            discard: [],
            turn: 0,
            round: 1,
            lastBagOut: {
                kennedy: 12 - kenCount,
                nixon: 12 - nixCount,
                name: "Initiative"
            },
            lastRoll: null,
            endorsements: {
                [REGIONS.WEST]: 0,
                [REGIONS.EAST]: 0,
                [REGIONS.MID]: 0,
                [REGIONS.SOUTH]: 0
            },
            media: {
                [REGIONS.WEST]: 0,
                [REGIONS.EAST]: 0,
                [REGIONS.MID]: 0,
                [REGIONS.SOUTH]: 0
            },
            issueScores: {
                [Object.keys(ISSUE_URLS)[0]]: 0,
                [Object.keys(ISSUE_URLS)[1]]: 0,
                [Object.keys(ISSUE_URLS)[2]]: 0
            },
            kennedy: {
                email: isKennedy ? selfPlayer : otherPlayer,
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
                email: isKennedy ? otherPlayer : selfPlayer,
                bag: 0,
                hand: [],
                state: "california",
                rest: 0,
                exhausted: false,
                momentum: 2,
                campaignDeck: [],
                needDiscard: 0
            }
        });
        addCSSClass(choosePage, "hidden");
        this.enterGame(gameId);
    }
}