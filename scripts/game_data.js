function playerIsKennedy(gameData) {
    return gameData.kennedy.email === user.email;
}

function getPlayerCandidate(gameData) {
    return playerIsKennedy(gameData) ? "kennedy" : "nixon";
}

function getOtherCandidate(gameData) {
    return playerIsKennedy(gameData) ? "nixon" : "kennedy";
}