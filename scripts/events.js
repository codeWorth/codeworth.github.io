import { EVENT_TYPE, FLAGS, KENNEDY, NIXON, REGION, STATE_REGION, ISSUE, stateCodes } from "./constants.js";
import { candidateDp, candidateForDp, moveUp, oppositeCandidate } from "./util.js";

export const ALL_REGIONS = Object.values(REGION);

function event(type, target) {
    return {
        type: type,
        target: target
    };
}

function changePer(type, target, count, per, forced, regions) {
    return {
        ...event(type, target),
        count: count, per: per, forced: forced,
        regions: regions
    };
}

function addPer(type, target, count, per, regions) {
    return changePer(type, target, count, per, false, regions);
}

function removePer(type, target, count, per, forced, regions) {
    return changePer(type, target, -count, per, forced, regions);
}

export function hellHarry(gameData, player) {
    const kdp = candidateDp(KENNEDY);
    const winningIssues = Object.values(gameData.issueScores)
        .filter(s => Math.sign(s) === kdp)
        .length;
    if (winningIssues > 1) {
        gameData.kennedy.momentum--;
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

export function mmtmWest(gameData, player) {
    mmtmRegion(gameData, player, REGION.WEST);
}

export function mmtmSouth(gameData, player) {
    mmtmRegion(gameData, player, REGION.SOUTH);
}

export function mmtmMidwest(gameData, player) {
    mmtmRegion(gameData, player, REGION.MIDWEST);
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
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, NIXON, 
        7, 1, false, ALL_REGIONS
    );
}

export function putFlag(flag) {
    return (gameData, player) => {
        gameData.flags[flag] = true;
    }
}

export function roundFlag(flag) {
    return (gameData, player) => {
        gameData.flag[flag] = gameData.round;
    }
}

export function heartland(gameData, player) {
    gameData.event = addPer(
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
        gameData[player].momentum--;
    }

    gameData.issueScores[ISSUE.DEFENSE] -= defenseLeader;
    gameData.issueScores[ISSUE.ECONOMY] -= economyLeader;
}

export function oldNixon(gameData, player) {
    gameData.nixon.momentum--;
    gameData.kennedy.momentum -= 3;
}

export function peaceSurrender(gameData, player) {
    moveUp(gameData.issues, ISSUE.DEFENSE);
    gameData.issueScores[ISSUE.DEFENSE] += candidateDp(NIXON);
}

export function nixonEgged(gameData, player) {
    const dp = candidateDp(NIXON);

    gameData.nixon.state = stateCodes.mi;
    if (Math.sign(gameData.cubes.michigan) === dp) {
        gameData.cubes.michigan -= dp;
    }
    gameData.flags[FLAGS.NIXON_EGGED] = gameData.round;
}

export function giveWeek(gameData, player) {
    gameData.nixon.momentum -= 2;

    const dp = candidateDp(NIXON);
    for (const issue in Object.values(ISSUE)) {
        if (Math.sign(gameData.issueScores[issue]) === dp) {
            gameData.issueScores[issue] -= dp;
        }
    }
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

export function houstonAssoc(gameData, player) {
    gameData.kennedy.state = stateCodes.tx;
    gameData.kennedy.momentum++;
    gameData.flags[FLAGS.HOUSTON_ASSOC] = true;
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, KENNEDY, 
        5, 1, ALL_REGIONS
    );
}

export function quemoy(gameData, player) {
    const defenseScore = Math.sign(gameData.issueScores[ISSUE.DEFENSE]);
    if (defenseScore === 0) return;

    const leader = candidateForDp(defenseScore);
    gameData[leader].momentum++;
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, leader, 
        3, 1, ALL_REGIONS
    );
}

export function normamVincent(gameData, player) {
    gameData.event = removePer(
        EVENT_TYPE.CHANGE_PER, NIXON,
        5, 1, false, ALL_REGIONS
    );
}

export function herblock(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.CHANGE_MEDIA, KENNEDY),
        count: -2
    };
}

export function tricky(gameData, player) {
    gameData.nixon.momentum--;
    gameData.event = event(EVENT_TYPE.EVENT_FROM_DISCARD, NIXON);
}

export function newFrontier(gameData, player) {
    gameData.event = event(EVENT_TYPE.DISCARD, KENNEDY);
}

export function voterDrive(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.EMPTY_PER, player,
        3, 1, ALL_REGIONS
    );
}

export function kingArrested(gameData, player) {
    moveUp(gameData.issues, ISSUE.CIVIL_RIGHTS);
    gameData.issueScores[ISSUE.CIVIL_RIGHTS] += candidateDp(player) * 3;
}

export function industrialMidwest(gameData, player) {
    gameData.event = {...addPer(
        EVENT_TYPE.ADD_STATES, NIXON,
        5, 2, [REGION.MIDWEST]),
        states: [stateCodes.il, stateCodes.in, stateCodes.mi, stateCodes.mn, stateCodes.oh, stateCodes.wi]
    };
}

export function johnsonJeered(gameData, player) {
    const kenDp = candidateDp(KENNEDY);
    if (Math.sign(gameData.cubes.texas) === kenDp) gameData.cubes.texas -= kenDp;
    
    if (gameData.flags[FLAGS.KEN_NO_CP] === undefined) {
        gameData.flags[FLAGS.KEN_NO_CP] = [];
    }
    gameData.flags[FLAGS.KEN_NO_CP].push(
        {round: gameData.round, region: REGION.SOUTH},
    );
}

export function loyalists(gameData, player) {
    if (gameData.flags[FLAGS.KEN_NO_CP] === undefined) {
        gameData.flags[FLAGS.KEN_NO_CP] = [];
    }

    gameData.flags[FLAGS.KEN_NO_CP].push(
        {round: gameData.round, region: REGION.WEST},
        {round: gameData.round, region: REGION.MIDWEST}
    );
}

export function lyndonJohnson(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.LBJ, KENNEDY,
        3, 2, [REGION.SOUTH]
    );
}

export function civilRightsAct(gameData, player) {
    moveUp(gameData.issues, ISSUE.CIVIL_RIGHTS);
    gameData.issueScores[ISSUE.CIVIL_RIGHTS] += candidateDp(NIXON);
}

export function stockMarket(gameData, player) {
    moveUp(gameData.issues, ISSUE.ECONOMY);
    moveUp(gameData.issues, ISSUE.ECONOMY);

    const leader = Math.sign(gameData.issueScores[ISSUE.ECONOMY]);
    gameData.cubes[stateCodes.ny] += leader * 2;
}

export function adlai(gameData, player) {
    gameData.cubes[stateCodes.il] += candidateDp(KENNEDY);
    gameData.event = event(EVENT_TYPE.RETRIEVE, KENNEDY);
}

export function worldSeries(gameData, player) {
    const eastMedia = Math.sign(gameData.media.east);
    if (eastMedia === 0) return;
    const winner = candidateForDp(eastMedia);
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, winner,
        5, 2, [REGION.NORTHEAST]
    );
}

export function baptist(gameData, player) {
    gameData.event = removePer(
        EVENT_TYPE.CHANGE_PER, NIXON,
        5, 2, false, 
        [REGION.SOUTH, REGION.MIDWEST]
    );
}

export function risingFood(gameData, player) {
    moveUp(gameData.issues, ISSUE.ECONOMY);
    gameData.issueScores[ISSUE.ECONOMY] += candidateDp(NIXON) * 2;
}

export function greatnessTime(gameData, player) {
    gameData.issues
        .filter(issue => Math.sign(gameData.issueScores[issue]) === candidateDp(NIXON))
        .forEach(issue => gameData.issueScores[issue] -= candidateDp(NIXON));
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, KENNEDY,
        3, 1, ALL_REGIONS
    )
}

export function henryCabot(gameData, player) {
    gameData.cubes[stateCodes.ma] += candidateDp(NIXON) * 2;
    gameData.issueScores[ISSUE.DEFENSE] += candidateDp(NIXON) * 2;
    gameData.event = event(EVENT_TYPE.MAY_UNEXHAUST, NIXON);
}

export function sealBug(gameData, player) {
    gameData.issueScores[ISSUE.DEFENSE] += candidateDp(NIXON);
    if (gameData.discard.includes("Henry Cabot Lodge")) {
        gameData.event = {
            ...event(EVENT_TYPE.RETRIEVE, NIXON),
            card: "Henry Cabot Lodge"
        };
    }
}

function cardCpMod(gameData, flag, diff, limit) {
    if (!gameData.flags[flag] 
        || gameData.flags[flag].round !== gameData.round) {
        gameData.flags[flag] = {
            round: gameData.round,
            boost: 0
        };
    }

    gameData.flags[flag].diff += diff;
    if (diff < 0) {
        gameData.flags[flag].min = limit;
    } else {
        gameData.flags[flag].max = limit;
    }
}

export function kenAir(gameData, player) {
    roundFlag(FLAGS.KEN_AIR)(gameData, player);
    cardCpMod(gameData, FLAGS.CPD_KENNEDY, 1, 5);
}

export function bobKen(gameData, player) {
    cardCpMod(gameData, FLAGS.CPD_KENNEDY, 1, 5);
}

export function citizensNixon(gameData, player) {
    cardCpMod(gameData, FLAGS.CPD_NIXON, 1, 5);
}

export function lunchCounter(gameData, player) {
    moveUp(gameData.issues, ISSUE.CIVIL_RIGHTS);
    const civilScore = Math.sign(gameData.issueScores[ISSUE.CIVIL_RIGHTS]);
    if (civilScore === 0) return;
    
    const leader = candidateForDp(civilScore);
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, leader,
        3, 1, ALL_REGIONS
    );
}

export function structureGap(gameData, player) {
    cardCpMod(gameData, FLAGS.CPD_KENNEDY, -2, 1);
}

export function nixonKnee(gameData, player) {
    gameData.nixon.state = stateCodes.md;
    roundFlag(FLAGS.NIXONS_KNEE)(gameData, player);
}

export function fiftyStars(gameData, player) {
    const support = Math.sign(gameData.cubes.hawaii + gameData.cubes.alaska);
    if (support === 0) return;
    const winner = support === candidateForDp(support);
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, winner,
        5, 1, ALL_REGIONS
    );
}

export function fidel(gameData, player) {
    const defense = Math.sign(gameData.issueScores[ISSUE.DEFENSE]);
    if (defense === 0) return;
    const winner = support === candidateForDp(defense);
    gameData[winner].momentum++;
    gameData.cubes.florida += defense;
}

export function medal(gameData, player) {
    const civil = Math.sign(gameData.issueScores[ISSUE.CIVIL_RIGHTS]);
    const economy = Math.sign(gameData.issueScores[ISSUE.ECONOMY]);
    
    gameData.issueScores[ISSUE.CIVIL_RIGHTS] -= civil;
    gameData.issueScores[ISSUE.ECONOMY] -= economy;
    if (civil === economy && civil !== 0) {
        const winner = candidateForDp(civil);
        gameData[winner].momentum--;
    }
}

export function harryByrd(gameData, player) {
    gameData.event = {...removePer(
        EVENT_TYPE.ADD_STATES, NIXON,
        5, 2, false, [REGION.SOUTH]),
        states: [stateCodes.ok, stateCodes.ms, stateCodes.al]
    };
}

export function newNixon(gameData, player) {
    gameData.nixon.momentum++;
}

export function highHopes(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.HIGH_HOPES, KENNEDY),
        sourcePlayer: player,
        count: 2
    };
}

export function experience(gameData, player) {
    const kenDp = candidateDp(KENNEDY);
    Object.values(ISSUE)
        .filter(issue => Math.sign(gameData.issueScores[issue]) === kenDp)
        .forEach(issue => gameData.issueScores[issue] -= kenDp);
    gameData.nixon.momentum++;
}

export function repubTv(gameData, player) {
    gameData.nixon.state = stateCodes.ny;
    gameData.event = {
        ...event(EVENT_TYPE.CHANGE_MEDIA, KENNEDY),
        count: 3
    };
}

export function kruschev(gameData, player) {
    const defense = Math.sign(gameData.issueScores[ISSUE.DEFENSE]);
    if (defense === 0) return;

    const defenseLeader = candidateForDp(defense);
    gameData[defenseLeader].momentum++;
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, defenseLeader,
        3, 1, ALL_REGIONS
    );
}

export function southern(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, NIXON,
        5, 2, [REGION.SOUTH]
    );
    gameData.issueScores[ISSUE.CIVIL_RIGHTS] += candidateDp(KENNEDY);
}

export function polCapital(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.DRAW_CARDS, NIXON),
        count: 2
    };
}

export function newEngland(gameData, player) {
    gameData.event = {
        ...addPer(EVENT_TYPE.ADD_STATES, KENNEDY,
            5, 2, [REGION.NORTHEAST]),
        states: [stateCodes.ct, stateCodes.ma, stateCodes.me, stateCodes.ny, stateCodes.ri, stateCodes.vt]
    };
}

export function pierre(gameData, player) {
    gameData.event = event(EVENT_TYPE.PIERRE, KENNEDY);
}

export function nelsonRock(gameData, player) {
    gameData.cubes.newyork += candidateDp(NIXON);
    gameData.event = event(EVENT_TYPE.RETRIEVE, NIXON);
}

export function campaignHead(gameData, player) {
    gameData.event = event(EVENT_TYPE.DISCARD, player);
}

export function sovietGrowth(gameData, player) {
    moveUp(gameData.issues, ISSUE.ECONOMY);
    gameData.cubes.newyork += Math.sign(gameData.issueScores[ISSUE.ECONOMY]);
}

export function eleanorTour(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, KENNEDY,
        5, 2, [REGION.MIDWEST]
    );
}

export function advanceMen(gameData, player) {
    gameData.flags[FLAGS.ADVANCE_MEN] = {
        round: gameData.round,
        player: player
    };
}