import { EVENT_TYPE, FLAGS, KENNEDY, NIXON, REGION, STATE_REGION, ISSUE } from "./constants.js";
import { candidateDp, moveUp, oppositeCandidate } from "./util.js";

function event(type, target) {
    return {
        type: type,
        target: target
    };
}

function changePer(type, target, count, per, regions) {
    return {
        ...event(type, target),
        count: count, per: per, regions: regions
    };
}

export function hellHarry(gameData, player) {
    const kdp = candidateDp(KENNEDY);
    const winningIssues = Object.values(gameData.issueScores)
        .filter(s => Math.sign(s) === kdp)
        .length;
    if (winningIssues > 1) {
        gameData.kennedy.momentum = Math.max(0, gameData.kennedy.momentum - 1);
        gameData.event = {
            ...event(EVENT_TYPE.LOSE_ISSUE, oppositeCandidate(player)),
            count: 2,
        }
    }
}

export function fatigueIn(gameData, player) {
    gameData[oppositeCandidate(player)].exhausted = true;
}

export function mmtmEast(gameData, player) {
    mmtmRegion(gameData, player, REGION.NORTHEAST);
}

function mmtmRegion(gameData, player, region) {
    const leadingCount = Object.keys(STATE_REGION)
        .filter(state => STATE_REGION[state] === region)
        .map(state => Math.sign(gameData.cubes[state]))
        .reduce((a,b)=>a+b, 0); // sum total

    if (leadingCount === 0) return;

    let dp = 0;
    if (candidateDp(NIXON) === Math.sign(leadingCount)) {
        gameData.nixon.momentum++;
        dp = candidateDp(NIXON);
    } else if (candidateDp(KENNEDY) === Math.sign(leadingCount)) {
        gameData.kennedy.momentum++;
        dp = candidateDp(KENNEDY);
    }

    for (const state in gameData.cubes) {
        if (STATE_REGION[state] !== region) continue;
        if (gameData.cubes[state] !== 0) continue;
        gameData.cubes[state] = dp;
    }
}

export function dwight(gameData, player) {
    gameData.flags[FLAGS.STOP_SILENCE] = true;
    gameData.event = changePer(
        EVENT_TYPE.ADD_PER, NIXON, 
        7, 1, Object.values(REGION)
    );
}

export function putFlag(flag) {
    return (gameData, player) => {
        gameData.flags[flag] = true;
    }
}

export function heartland(gameData, player) {
    gameData.event = changePer(
        EVENT_TYPE.HEARTLAND, NIXON, 
        7, 1, [REGION.WEST, REGION.MIDWEST]
    );
}

export function donna(gameData, player) {
    gameData[player].state = "florida";
    gameData[player].momentum++;
    gameData.cubes.florida += candidateDp(player);
}

export function cassius(gameData, player) {
    const defenseLeader = Math.sign(gameData.issueScores[ISSUE.DEFENSE]);
    const economyLeader = Math.sign(gameData.issueScores[ISSUE.ECONOMY]);

    if (defenseLeader === economyLeader && defenseLeader !== 0) {
        const player = candidateDp(NIXON) === defenseLeader ? NIXON : KENNEDY;
        gameData[player].momentum = Math.max(0, gameData[player].momentum - 1);
    }

    gameData.issueScores[ISSUE.DEFENSE] -= defenseLeader;
    gameData.issueScores[ISSUE.ECONOMY] -= economyLeader;
}

export function oldNixon(gameData, player) {
    gameData.nixon.momentum = Math.max(0, gameData.nixon.momentum - 1);
    gameData.kennedy.momentum = Math.max(0, gameData.kennedy.momentum - 3);
}

export function peaceSurrender(gameData, player) {
    moveUp(gameData.issues, ISSUE.DEFENSE);
    gameData.issueScores[ISSUE.DEFENSE] += candidateDp(NIXON);
}

export function nixonEgged(gameData, player) {
    const dp = candidateDp(NIXON);

    gameData.nixon.state = "michigan";
    if (Math.sign(gameData.cubes.michigan) === dp) {
        gameData.cubes.michigan -= dp;
    }
    gameData.flags[FLAGS.NIXON_EGGED] = gameData.round;
}

export function giveWeek(gameData, player) {
    gameData.nixon.momentum = Math.max(0, gameData.nixon.momentum - 2);

    const dp = candidateDp(NIXON);
    for (const issue in Object.values(ISSUE)) {
        if (Math.sign(gameData.issueScores[issue]) === dp) {
            gameData.issueScores[issue] -= dp;
        }
    }
}

export function joeKennedy(gameData, player) {
    gameData.flags[FLAGS.JOE_KENNEDY] = gameData.round;
}

export function gaffe(gameData, player) {
    const opponent = oppositeCandidate(player);
    const dp = candidateDp(opponent);
    const state = gameData[opponent].state;

    gameData[opponent] = Math.max(0, gameData[opponent] - 1);
    const score = Math.abs(gameData.cubes[state]);
    if (Math.sign(gameData.cubes[state]) === dp) {
        gameData.cubes[state] -= Math.min(score, 3) * dp;
    }
}

export function loyalists(gameData, player) {
    gameData.flags[FLAGS.LOYALISTS] = gameData.round;
}

export function houstonAssoc(gameData, player) {
    gameData.kennedy.state = "texas";
    gameData.kennedy.momentum++;
    gameData.flags[FLAGS.HOUSTON_ASSOC] = true;
    gameData.event = changePer(
        EVENT_TYPE.ADD_PER, KENNEDY, 
        5, 1, Object.values(REGION)
    );
}

export function quemoy(gameData, player) {
    const leader = gameData.issueScore[ISSUE.DEFENSE] === candidateDp(NIXON)
        ? NIXON
        : KENNEDY;
    gameData[leader].momentum++;
    gameData.event = changePer(
        EVENT_TYPE.ADD_PER, leader, 
        3, 1, Object.values(REGION)
    );
}

export function normamVincent(gameData, player) {
    gameData.event = changePer(
        EVENT_TYPE.SUB_PER, NIXON,
        5, 1, Object.values(REGION)
    );
}

export function herblock(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.SUB_MEDIA, KENNEDY),
        count: 2
    };
}

export function tricky(gameData, player) {
    gameData.nixon.momentum = Math.max(0, gameData.nixon.momentum - 1);
    gameData.event = event(EVENT_TYPE.EVENT_FROM_DISCARD, NIXON);
}

export function newFrontier(gameData, player) {
    gameData.event = event(EVENT_TYPE.DISCARD, KENNEDY);
}

export function voterDrive(gameData, player) {
    gameData.event = changePer(
        EVENT_TYPE.EMPTY_PER, player,
        3, 1, Object.values(REGION)
    );
}

export function kingArrested(gameData, player) {
    moveUp(gameData.issues, ISSUE.CIVIL_RIGHTS);
    gameData.issueScores[ISSUE.CIVIL_RIGHTS] += candidateDp(player) * 3;
}

export function industrialMidwest(gameData, player) {
    gameData.event = {...changePer(
        EVENT_TYPE.ADD_STATES, NIXON,
        5, 2, [REGION.MIDWEST]),
        states: ["illinois", "indiana", "michigan", "minnesota", "ohio", "wisconsin"]
    };
}