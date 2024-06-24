import { EVENT_TYPE, FLAGS, KENNEDY, NIXON, REGION, STATE_REGION, ISSUE, STATE_CODES, REGION_NAME, CP_MOD_TYPE, CANDIDATE } from "./constants.js";
import GameData from "./gameData.js";
import { candidateDp, candidateForDp, moveUp, oppositeCandidate, sum } from "./util.js";

export const ALL_REGIONS = Object.values(REGION);

/**
 * @param {EVENT_TYPE} type 
 * @param {CANDIDATE} target 
 */
function event(type, target) {
    return {
        type: type,
        target: target
    };
}

/**
 * @param {EVENT_TYPE} type 
 * @param {CANDIDATE} target 
 * @param {number} count
 * @param {number} per
 * @param {boolean} forced
 * @param {REGION[]} regions
 */
function changePer(type, target, count, per, forced, regions) {
    return {
        ...event(type, target),
        count: count, per: per, forced: forced,
        regions: regions
    };
}

/**
 * @param {EVENT_TYPE} type 
 * @param {CANDIDATE} target 
 * @param {number} count
 * @param {number} per
 * @param {REGION[]} regions
 */
export function addPer(type, target, count, per, regions) {
    return changePer(type, target, count, per, false, regions);
}

/**
 * @param {EVENT_TYPE} type 
 * @param {CANDIDATE} target 
 * @param {number} count
 * @param {number} per
 * @param {boolean} forced
 * @param {REGION[]} regions
 */
function removePer(type, target, count, per, forced, regions) {
    return changePer(type, target, -count, per, forced, regions);
}

/**
 * @callback Event
 * @param {GameData} gameData 
 * @param {CANDIDATE} player
 * @returns {void}
 */

/** @type {Event} */
export function hellHarry(gameData, player) {
    const kdp = candidateDp(KENNEDY);
    const winningIssues = Object.values(gameData.issueScores)
        .filter(s => Math.sign(s) === kdp);
    if (winningIssues.length > 1) {
        gameData.kennedy.momentum--;
        gameData.event = {
            ...event(EVENT_TYPE.LOSE_ISSUE, oppositeCandidate(player)),
            count: 2,
        }
    }
}

/** @type {Event} */
export function fatigueIn(gameData, player) {
    gameData[oppositeCandidate(player)].exhausted = true;
}

/** @type {Event} */
export function mmtmEast(gameData, player) {
    mmtmRegion(gameData, player, REGION.NORTHEAST);
}

/** @type {Event} */
export function mmtmWest(gameData, player) {
    mmtmRegion(gameData, player, REGION.WEST);
}

/** @type {Event} */
export function mmtmSouth(gameData, player) {
    mmtmRegion(gameData, player, REGION.SOUTH);
}

/** @type {Event} */
export function mmtmMidwest(gameData, player) {
    mmtmRegion(gameData, player, REGION.MIDWEST);
}

function mmtmRegion(gameData, player, region) {
    const leadingCount = Object.keys(STATE_REGION)
        .filter(state => STATE_REGION[state] === region)
        .map(state => Math.sign(gameData.cubes[state]))
        .reduce(sum, 0); // sum total

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
        gameData.cubes[state] += dp;
    }
}

/** @type {Event} */
export function dwight(gameData, player) {
    gameData.flags[FLAGS.STOP_SILENCE] = true;
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, NIXON, 
        7, 1, ALL_REGIONS
    );
}

/** @return {Event} */
export function putFlag(flag) {
    return (gameData, player) => {
        gameData.flags[flag] = true;
    }
}

/** @return {Event} */
export function roundFlag(flag) {
    return (gameData, player) => {
        gameData.flags[flag] = gameData.round;
    }
}

/** @type {Event} */
export function heartland(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.HEARTLAND, NIXON, 
        7, 1, [REGION.WEST, REGION.MIDWEST]
    );
}

/** @type {Event} */
export function donna(gameData, player) {
    gameData[player].state = "florida";
    gameData[player].momentum++;
    gameData.cubes[STATE_CODES.fl] += candidateDp(player);
}

/** @type {Event} */
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

/** @type {Event} */
export function oldNixon(gameData, player) {
    gameData.nixon.momentum--;
    gameData.kennedy.momentum -= 3;
}

/** @type {Event} */
export function peaceSurrender(gameData, player) {
    moveUp(gameData.issues, ISSUE.DEFENSE);
    gameData.issueScores[ISSUE.DEFENSE] += candidateDp(NIXON);
}

/** @type {Event} */
export function nixonEgged(gameData, player) {
    const dp = candidateDp(NIXON);

    gameData.nixon.state = STATE_CODES.mi;
    if (Math.sign(gameData.cubes[STATE_CODES.mi]) === dp) {
        gameData.cubes[STATE_CODES.mi] -= dp;
    }
    gameData.flags[FLAGS.NIXON_EGGED] = gameData.round;
}

/** @type {Event} */
export function giveWeek(gameData, player) {
    gameData.nixon.momentum -= 2;

    const dp = candidateDp(NIXON);
    for (const issue in Object.values(ISSUE)) {
        if (Math.sign(gameData.issueScores[issue]) === dp) {
            gameData.issueScores[issue] -= dp;
        }
    }
}

/** @type {Event} */
export function gaffe(gameData, player) {
    const opponent = oppositeCandidate(player);
    const dp = candidateDp(opponent);
    const state = gameData[opponent].state;

    gameData[opponent].momentum = Math.max(0, gameData[opponent].momentum - 1);
    const score = Math.abs(gameData.cubes[state]);
    if (Math.sign(gameData.cubes[state]) === dp) {
        gameData.cubes[state] -= Math.min(score, 3) * dp;
    }
}

/** @type {Event} */
export function houstonAssoc(gameData, player) {
    gameData.kennedy.state = STATE_CODES.tx;
    gameData.kennedy.momentum++;
    gameData.flags[FLAGS.HOUSTON_ASSOC] = true;
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, KENNEDY, 
        5, 1, ALL_REGIONS
    );
}

/** @type {Event} */
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

/** @type {Event} */
export function normamVincent(gameData, player) {
    gameData.event = removePer(
        EVENT_TYPE.CHANGE_PER, NIXON,
        5, 1, false, ALL_REGIONS
    );
}

/** @type {Event} */
export function herblock(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.CHANGE_MEDIA, KENNEDY),
        count: -2
    };
}

/** @type {Event} */
export function tricky(gameData, player) {
    gameData.nixon.momentum--;
    gameData.event = event(EVENT_TYPE.EVENT_FROM_DISCARD, NIXON);
}

/** @type {Event} */
export function newFrontier(gameData, player) {
    gameData.event = event(EVENT_TYPE.DISCARD, KENNEDY);
}

/** @type {Event} */
export function voterDrive(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.EMPTY_PER, player,
        3, 1, ALL_REGIONS
    );
}

/** @type {Event} */
export function kingArrested(gameData, player) {
    moveUp(gameData.issues, ISSUE.CIVIL_RIGHTS);
    gameData.issueScores[ISSUE.CIVIL_RIGHTS] += candidateDp(player) * 3;
}

/** @type {Event} */
export function industrialMidwest(gameData, player) {
    gameData.event = {...addPer(
        EVENT_TYPE.CHANGE_STATES, NIXON,
        5, 2, [REGION.MIDWEST]),
        states: [STATE_CODES.il, STATE_CODES.in, STATE_CODES.mi, STATE_CODES.mn, STATE_CODES.oh, STATE_CODES.wi]
    };
}

/** @type {Event} */
export function johnsonJeered(gameData, player) {
    const kenDp = candidateDp(KENNEDY);
    if (Math.sign(gameData.cubes[STATE_CODES.tx]) === kenDp) gameData.cubes[STATE_CODES.tx] -= kenDp;
    
    if (gameData.flags[FLAGS.KEN_NO_CP] === undefined) {
        gameData.flags[FLAGS.KEN_NO_CP] = [];
    }
    gameData.flags[FLAGS.KEN_NO_CP].push(
        {round: gameData.round, region: REGION.SOUTH},
    );
}

/** @type {Event} */
export function loyalists(gameData, player) {
    if (gameData.flags[FLAGS.KEN_NO_CP] === undefined) {
        gameData.flags[FLAGS.KEN_NO_CP] = [];
    }

    gameData.flags[FLAGS.KEN_NO_CP].push(
        {round: gameData.round, region: REGION.WEST},
        {round: gameData.round, region: REGION.MIDWEST}
    );
}

/** @type {Event} */
export function lyndonJohnson(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.LBJ, KENNEDY,
        3, 2, [REGION.SOUTH]
    );
}

/** @type {Event} */
export function civilRightsAct(gameData, player) {
    moveUp(gameData.issues, ISSUE.CIVIL_RIGHTS);
    gameData.issueScores[ISSUE.CIVIL_RIGHTS] += candidateDp(NIXON);
}

/** @type {Event} */
export function stockMarket(gameData, player) {
    moveUp(gameData.issues, ISSUE.ECONOMY);
    moveUp(gameData.issues, ISSUE.ECONOMY);

    const leader = Math.sign(gameData.issueScores[ISSUE.ECONOMY]);
    gameData.cubes[STATE_CODES.ny] += leader * 2;
}

/** @type {Event} */
export function adlai(gameData, player) {
    gameData.cubes[STATE_CODES.il] += candidateDp(KENNEDY);
    gameData.event = event(EVENT_TYPE.RETRIEVE, KENNEDY);
}

/** @type {Event} */
export function worldSeries(gameData, player) {
    const eastMedia = Math.sign(gameData.media.east);
    if (eastMedia === 0) return;
    const winner = candidateForDp(eastMedia);
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, winner,
        5, 2, [REGION.NORTHEAST]
    );
}

/** @type {Event} */
export function baptist(gameData, player) {
    gameData.event = removePer(
        EVENT_TYPE.CHANGE_PER, NIXON,
        5, 2, false, 
        [REGION.SOUTH, REGION.MIDWEST]
    );
}

/** @type {Event} */
export function risingFood(gameData, player) {
    moveUp(gameData.issues, ISSUE.ECONOMY);
    gameData.issueScores[ISSUE.ECONOMY] += candidateDp(NIXON) * 2;
}

/** @type {Event} */
export function greatnessTime(gameData, player) {
    gameData.issues
        .filter(issue => Math.sign(gameData.issueScores[issue]) === candidateDp(NIXON))
        .forEach(issue => gameData.issueScores[issue] -= candidateDp(NIXON));
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, KENNEDY,
        3, 1, ALL_REGIONS
    )
}

/** @type {Event} */
export function henryCabot(gameData, player) {
    gameData.cubes[STATE_CODES.ma] += candidateDp(NIXON) * 2;
    gameData.issueScores[ISSUE.DEFENSE] += candidateDp(NIXON) * 2;
    gameData.event = event(EVENT_TYPE.MAY_UNEXHAUST, NIXON);
}

/** @type {Event} */
export function sealBug(gameData, player) {
    gameData.issueScores[ISSUE.DEFENSE] += candidateDp(NIXON);
    if (gameData.discard.find(c => c.name === "Henry Cabot Lodge")) {
        gameData.event = {
            ...event(EVENT_TYPE.RETRIEVE, NIXON),
            card: "Henry Cabot Lodge"
        };
    }
}

/**
 * @param {GameData} gameData 
 * @param {string} player 
 * @param {number} diff 
 * @param {number} limit 
 * @param {CP_MOD_TYPE} [type] 
 */
function cardCpMod(gameData, player, diff, limit, type) {
    gameData.cpMods.push({
        player: player, 
        round: gameData.round,
        boost: diff, 
        [diff < 0 ? 'min' : 'max']: limit,
        type: type || CP_MOD_TYPE.ALL
    });
}

/** @type {Event} */
export function kenAir(gameData, player) {
    roundFlag(FLAGS.KEN_AIR)(gameData, player);
    cardCpMod(gameData, KENNEDY, 1, 5, CP_MOD_TYPE.CAMPAIGNING);
}

/** @type {Event} */
export function bobKen(gameData, player) {
    cardCpMod(gameData, KENNEDY, 1, 5);
}

/** @type {Event} */
export function citizensNixon(gameData, player) {
    cardCpMod(gameData, NIXON, 1, 5);
}

/** @type {Event} */
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

/** @type {Event} */
export function structureGap(gameData, player) {
    cardCpMod(gameData, KENNEDY, -2, 1, CP_MOD_TYPE.POSITIONING);
}

/** @type {Event} */
export function nixonKnee(gameData, player) {
    gameData.nixon.state = STATE_CODES.md;
    roundFlag(FLAGS.NIXONS_KNEE)(gameData, player);
}

/** @type {Event} */
export function fiftyStars(gameData, player) {
    const support = Math.sign(Math.sign(gameData.cubes[STATE_CODES.hi]) + Math.sign(gameData.cubes[STATE_CODES.ak]));
    if (support === 0) return;
    const winner = candidateForDp(support);
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, winner,
        5, 1, ALL_REGIONS
    );
}

/** @type {Event} */
export function fidel(gameData, player) {
    const defense = Math.sign(gameData.issueScores[ISSUE.DEFENSE]);
    if (defense === 0) return;
    const winner = candidateForDp(defense);
    gameData[winner].momentum++;
    gameData.cubes[STATE_CODES.fl] += defense;
}

/** @type {Event} */
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

/** @type {Event} */
export function harryByrd(gameData, player) {
    gameData.event = {...removePer(
        EVENT_TYPE.CHANGE_STATES, NIXON,
        3, 3, false, [REGION.SOUTH]),
        states: [STATE_CODES.ok, STATE_CODES.ms, STATE_CODES.al]
    };
}

/** @type {Event} */
export function newNixon(gameData, player) {
    gameData.nixon.momentum++;
}

/** @type {Event} */
export function highHopes(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.HIGH_HOPES, KENNEDY),
        sourcePlayer: player,
        count: 2
    };
}

/** @type {Event} */
export function experience(gameData, player) {
    const kenDp = candidateDp(KENNEDY);
    Object.values(ISSUE)
        .filter(issue => Math.sign(gameData.issueScores[issue]) === kenDp)
        .forEach(issue => gameData.issueScores[issue] -= kenDp);
    gameData.nixon.momentum++;
}

/** @type {Event} */
export function repubTv(gameData, player) {
    gameData.nixon.state = STATE_CODES.ny;
    gameData.event = {
        ...event(EVENT_TYPE.CHANGE_MEDIA, NIXON),
        count: 3
    };
}

/** @type {Event} */
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

/** @type {Event} */
export function southern(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, NIXON,
        5, 2, [REGION.SOUTH]
    );
    gameData.issueScores[ISSUE.CIVIL_RIGHTS] += candidateDp(KENNEDY);
}

/** @type {Event} */
export function polCapital(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.DRAW_CARDS, NIXON),
        count: 2
    };
}

/** @type {Event} */
export function newEngland(gameData, player) {
    gameData.event = {
        ...addPer(EVENT_TYPE.CHANGE_STATES, KENNEDY,
            5, 2, [REGION.NORTHEAST]),
        states: [STATE_CODES.ct, STATE_CODES.ma, STATE_CODES.me, STATE_CODES.ny, STATE_CODES.ri, STATE_CODES.vt]
    };
}

/** @type {Event} */
export function pierre(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.ADD_ISSUE, KENNEDY),
        choseOne: true, count: 3
    };
}

/** @type {Event} */
export function nelsonRock(gameData, player) {
    gameData.cubes[STATE_CODES.ny] += candidateDp(NIXON);
    gameData.event = event(EVENT_TYPE.RETRIEVE, NIXON);
}

/** @type {Event} */
export function campaignHead(gameData, player) {
    gameData.event = event(EVENT_TYPE.DISCARD, player);
}

/** @type {Event} */
export function sovietGrowth(gameData, player) {
    moveUp(gameData.issues, ISSUE.ECONOMY);
    gameData.cubes[STATE_CODES.ny] += Math.sign(gameData.issueScores[ISSUE.ECONOMY]);
}

/** @type {Event} */
export function eleanorTour(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, KENNEDY,
        5, 2, [REGION.MIDWEST]
    );
}

/** @type {Event} */
export function advanceMen(gameData, player) {
    gameData.flags[FLAGS.ADVANCE_MEN] = {
        round: gameData.round,
        player: player
    };
}

/** @type {Event} */
export function herbKlein(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.ADD_ISSUE, NIXON),
        choseOne: false, count: 3
    };
}

/** @type {Event} */
export function ptTv(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.PTTV, player,
        5, 2, ALL_REGIONS
    );
}

/** @type {Event} */
export function eastHarlem(gameData, player) {
    const nixonDp = candidateDp(NIXON);
    if (Math.sign(gameData.issueScores[ISSUE.CIVIL_RIGHTS]) === nixonDp) {
        gameData.issueScores[ISSUE.CIVIL_RIGHTS] -= nixonDp;
    }

    gameData.event = removePer(
        EVENT_TYPE.CHANGE_PER, KENNEDY,
        5, 2, false, [REGION.SOUTH]
    );
}

/** @type {Event} */
export function garyPowers(gameData, player) {
    moveUp(gameData.issues, ISSUE.DEFENSE);
    moveUp(gameData.issues, ISSUE.DEFENSE);

    const defenseScore = Math.sign(gameData.issueScores[ISSUE.DEFENSE]);
    if (defenseScore === 0) return;
    gameData[candidateForDp(defenseScore)].momentum++;
}

/** @type {Event} */
export function suburban(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.SUBURBAN, KENNEDY,
        5, 2, ALL_REGIONS
    );
}

/** @type {Event} */
export function oldSouth(gameData, player) {
    const civilScore = Math.sign(gameData.issueScores[ISSUE.CIVIL_RIGHTS]);
    if (civilScore === 0) return;

    let curSouthScore = 0;
    for (const state in STATE_REGION) {
        if (STATE_REGION[state] !== REGION.SOUTH) continue;
        if (Math.sign(gameData.cubes[state]) !== civilScore) continue;

        curSouthScore += gameData.cubes[state];
    }

    const count = Math.min(5, curSouthScore);
    if (count > 0) {
        gameData.event = removePer(
            EVENT_TYPE.CHANGE_PER, candidateForDp(civilScore),
            count, count, true, [REGION.SOUTH]
        );
    }
    gameData.flags[FLAGS.OLD_SOUTH] = {
        player: candidateForDp(civilScore),
        round: gameData.round
    };
}

/** @type {Event} */
export function catholic(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, KENNEDY,
        7, 2, ALL_REGIONS
    );
}

/** @type {Event} */
export function volunteers(gameData, player) {
    gameData[player].momentum++;
}

/** @type {Event} */
export function sputnik(gameData, player) {
    moveUp(gameData.issues, ISSUE.DEFENSE);
    const defScore = Math.sign(gameData.issueScores[ISSUE.DEFENSE]);
    if (defScore === 0) return;

    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, candidateForDp(defScore),
        3, 1, ALL_REGIONS
    );
}

/** @type {Event} */
export function fifthAvenue(gameData, player) {
    gameData.nixon.state = STATE_CODES.ny;
    const nixonDp = candidateDp(NIXON);
    gameData.issueScores[ISSUE.CIVIL_RIGHTS] += nixonDp;
    gameData.cubes[STATE_CODES.ny] += nixonDp * 2;
    gameData.media[REGION_NAME[REGION.NORTHEAST]] += nixonDp;
}

/** @type {Event} */
export function gallup(gameData, player) {
    gameData.event = event(EVENT_TYPE.SET_ISSUE_ORDER, player);
}

/** @type {Event} */
export function whistlestop(gameData, player) {
    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, player,
        7, 1, ALL_REGIONS
    );
}

/** @type {Event} */
export function coldWar(gameData, player) {
    const defScore = Math.sign(gameData.issueScores[ISSUE.DEFENSE]);
    if (defScore === 0) return;

    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, candidateForDp(defScore),
        5, 1, ALL_REGIONS
    );
}

/** @type {Event} */
export function northBlacks(gameData, player) {
    const civilScore = Math.sign(gameData.issueScores[ISSUE.CIVIL_RIGHTS]);
    if (civilScore === 0) return;

    gameData.event = {...addPer(
        EVENT_TYPE.CHANGE_STATES, candidateForDp(civilScore),
        5, 2, ALL_REGIONS),
        states: [STATE_CODES.il, STATE_CODES.mi, STATE_CODES.ny]
    };
}

/** @type {Event} */
export function lowBlow(gameData, player) {
    const nixonDp = candidateDp(NIXON);
    const nixonWinningCount = Object.values(ISSUE)
        .map(issue => gameData.issueScores[issue])
        .map(Math.sign)
        .filter(score => score === nixonDp)
        .length;
    if (nixonWinningCount < 2) return;

    gameData.kennedy.momentum++;
    gameData.event = event(EVENT_TYPE.DISCARD, KENNEDY);
}

/** @type {Event} */
export function southernRevolt(gameData, player) {
    const civilScore = Math.sign(gameData.issueScores[ISSUE.CIVIL_RIGHTS]);
    if (civilScore !== candidateDp(KENNEDY)) return;

    gameData.event = addPer(
        EVENT_TYPE.CHANGE_PER, NIXON,
        5, 2, [REGION.SOUTH]
    );
}

/** @type {Event} */
export function summerSession(gameData, player) {
    cardCpMod(gameData, KENNEDY, -2, 1);
    gameData.event = {
        ...event(EVENT_TYPE.MOVE, KENNEDY),
        states: [STATE_CODES.md, STATE_CODES.va]
    };
}

/** @type {Event} */
export function opposition(gameData, player) {
    gameData.event = event(EVENT_TYPE.OPPOSITION, NIXON);
}

/** @type {Event} */
export function midAtlantic(gameData, player) {
    gameData.event = {
        ...addPer(
            EVENT_TYPE.CHANGE_STATES, KENNEDY,
            5, 2, ALL_REGIONS
        ),
        states: [STATE_CODES.de, STATE_CODES.md, STATE_CODES.nj, STATE_CODES.ny, STATE_CODES.pa]
    };
}

/** @type {Event} */
export function missileGap(gameData, player) {
    gameData.issueScores[ISSUE.DEFENSE] += candidateDp(KENNEDY) * 3;
}

/** @type {Event} */
export function stumpSpeech(gameData, player) {
    const maxMmtm = Math.max(gameData.kennedy.momentum, gameData.nixon.momentum);
    gameData.kennedy.momentum = maxMmtm;
    gameData.nixon.momentum = maxMmtm;
}

/** @type {Event} */
export function henryLuce(gameData, player) {
    gameData.event = event(EVENT_TYPE.HENRY_LUCE, KENNEDY);
}

/** @type {Event} */
export function swingState(gameData, player) {
    gameData.event = {
        ...event(EVENT_TYPE.SWING_STATE, player),
        count: 3
    };
}