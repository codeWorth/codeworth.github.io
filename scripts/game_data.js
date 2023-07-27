function playerIsKennedy(gameData) {
    return gameData.kennedy.email === user.email;
}

function getPlayerCandidate(gameData) {
    return playerIsKennedy(gameData) ? KENNEDY : NIXON;
}

function getOtherCandidate(gameData) {
    return playerIsKennedy(gameData) ? NIXON : KENNEDY;
}