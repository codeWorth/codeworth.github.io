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
        const order = Object.keys(ISSUE_URLS);
        const issues = [];
        for (let i = 0; i < Object.keys(ISSUE_URLS).length; i++) {
            const index = Math.floor(Math.random() * order.length);
            issues[i] = order[index];
            order.splice(index, 1);
        }
    
        await this.fb.updateDoc(this.fb.doc(this.db, "elec_games", gameId), {
            cubes: defaultCounts,
            issues: issues,
            choosingPlayer: Math.random() < 0.5 ? "kennedy" : "nixon"
        });
        removeCSSClass(choosePage, "hidden");
        kennedyButton.onclick = () => this.choosePlayer(gameId, true, selfPlayer, otherPlayer);
        nixonButton.onclick = () => this.choosePlayer(gameId, false, selfPlayer, otherPlayer);
    }
    
    async choosePlayer(gameId, isKennedy, selfPlayer, otherPlayer) {
        await this.fb.updateDoc(this.fb.doc(this.db, "elec_games", gameId), {
            started: true,
            round: 1,
            currentPlayer: null,
            phase: PHASE.CHOOSE_FIRST,
            kennedy: {
                email: isKennedy ? selfPlayer : otherPlayer,
                bag: 0,
                hand: [],
                state: "massachusetts",
                rest: 0,
                exhausted: false
            },
            nixon: {
                email: isKennedy ? otherPlayer : selfPlayer,
                bag: 0,
                hand: [],
                state: "california",
                rest: 0,
                exhausted: false
            },
            deck: Object.keys(CARDS),
            discard: [],
            endorsements: {
                west: 0,
                east: 0,
                mid: 0,
                south: 0
            },
            media: {
                west: 0,
                east: 0,
                mid: 0,
                south: 0
            },
            issueScores: {
                [Object.keys(ISSUE_URLS)[0]]: 0,
                [Object.keys(ISSUE_URLS)[1]]: 0,
                [Object.keys(ISSUE_URLS)[2]]: 0
            }
        });
        addCSSClass(choosePage, "hidden");
        this.enterGame(gameId);
    }
}