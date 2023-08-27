export const TURNS_PER_ROUND = 10;
export const DEBATE_ROUND = 6;
export const END_GAME_ROUND = 9;
export const NIXON = "nixon";
export const KENNEDY = "kennedy";
export const RESET_SIGNAL = new Object();

/**
 * @enum {string}
 */
export const CANDIDATE = {
    nixon: NIXON,
    kennedy: KENNEDY
};

/**
 * @enum {string}
 */
export const CP_MOD_TYPE = {
    ALL: "all",
    POSITIONING: "pos",
    CAMPAIGNING: "cam"
}

/**
 * @enum {string}
 */
export const PHASE = {
    CHOOSE_FIRST: "choose_first",
    PLAY_CARDS: "play_cards",
    TRIGGER_EVENT: "trigger_event",
    DISCARD_CHOICE: "discard_choice",
    ISSUE_SWAP: "issue_swap",
    ISSUE_REWARD_CHOICE: "issue_choice",
    ISSUE1_ENDORSE_REWARD: "endorse_reward",
    STRATEGY: "strategy",
    DEBATE: "debate",
    DEBATE_INITIATIVE: "debateInitiative",
    DEBATE_PARTY: "debateParty",
    DEBATE_RESOLVE: "debateResolve",
    CHOOSE_FIRST_END: "chooseFirstEnd",
    ELECTION_DAY_EVENTS: "electionDay",
    RESOLVE_GAME: "resolveGame"
}

/**
 * @enum {string}
 */
export const DEBATE_FLAGS = {
    BRAIN_TRUST: "brainTrust",
    LAZY_SHAVE: "lazyShave"
}

/**
 * @enum {string}
 */
export const ELECTION_FLAGS = {
    UNPLEDGED: "unpledged",
    COOK_COUNTY: "cookCountry",
    EARLY_RETURNS: "earlyReturns",
    RECOUNT: "recount"
}

/**
 * @enum {string}
 */
export const FLAGS = {
    STOP_SILENCE: "stopSilence",
    HOUSTON_ASSOC: "houstonAssoc",
    NIXON_EGGED: "nixonEgged",
    SILENCE: "silence",
    JOE_KENNEDY: "joeKennedy",
    KEN_AIR: "kenAir",
    KEN_NO_CP: "kenNoCp",
    JACKIE_KENNEDY: "jackieKennedy",
    NIXONS_KNEE: "nixonsKnee",
    PUERTO_RICAN: "puertoRicanBishops",
    KENNEDY_CORPS: "kennedyCorps",
    ADVANCE_MEN: "advanceMen",
    OLD_SOUTH: "oldSouth",
    PROFILES_COURAGE: "profilesCourage",
    HOSTILE_PRESS: "hostilePress"
};

/**
 * @enum {string}
 */
export const EVENT_TYPE = {
    LOSE_ISSUE: "loseIssue",
    CHANGE_PER: "changePer",
    CHANGE_STATES: "changeStates",
    CHANGE_MEDIA: "changeMedia",
    RETRIEVE: "retrieve",
    DISCARD: "discard",
    EVENT_FROM_DISCARD: "eventFromDiscard",
    EMPTY_PER: "emptyPer",
    HEARTLAND: "heartland",
    LBJ: "lbj",
    MAY_UNEXHAUST: "unexhaust",
    BYRD: "byrd",
    HIGH_HOPES: "highHopes",
    DRAW_CARDS: "drawCards",
    ADD_ISSUE: "addIssue",
    PTTV: "pttv",
    SUBURBAN: "suburban",
    SET_ISSUE_ORDER: "setIssueOrder",
    CHOOSE_CP_USE: "chooseCpUse",
    MOVE: "move",
    OPPOSITION: "opposition",
    HENRY_LUCE: "henryLuce",
    SWING_STATE: "swingState"
};

/**
 * @enum {string}
 */
export const ISSUE = {
    DEFENSE: "DEFENSE",
    CIVIL_RIGHTS: "CIVIL_RIGHTS",
    ECONOMY: "ECONOMY"
};

/**
 * @enum {string}
 */
export const ISSUE_URLS = {
    [ISSUE.DEFENSE]: "../images/defense_gray.png",
    [ISSUE.CIVIL_RIGHTS]: "../images/civilrights_gray.png",
    [ISSUE.ECONOMY]: "../images/economy_gray.png"
};

/**
 * @enum {string}
 */
export const STATE_CODES = {
    al: "alabama",
    ak: "alaska",
    az: "arizona",
    ar: "arkansas",
    ca: "california",
    co: "colorado",
    ct: "connecticut",
    de: "delaware",
    fl: "florida",
    ga: "georgia",
    hi: "hawaii",
    id: "idaho",
    il: "illinois",
    in: "indiana",
    ia: "iowa",
    ks: "kansas",
    ky: "kentucky",
    la: "louisiana",
    me: "maine",
    md: "maryland",
    ma: "massachusetts",
    mi: "michigan",
    mn: "minnesota",
    ms: "mississippi",
    mo: "missouri",
    mt: "montana",
    ne: "nebraska",
    nv: "nevada",
    nh: "newhampshire",
    nj: "newjersey",
    nm: "newmexico",
    ny: "newyork",
    nc: "northcarolina",
    nd: "northdakota",
    oh: "ohio",
    ok: "oklahoma",
    or: "oregon",
    pa: "pennsylvania",
    ri: "rhodeisland",
    sc: "southcarolina",
    sd: "southdakota",
    tn: "tennessee",
    tx: "texas",
    ut: "utah",
    vt: "vermont",
    va: "virginia",
    wa: "washington",
    wv: "westvirginia",
    wi: "wisconsin",
    wy: "wyoming"
}

export const DEFAULT_COUNTS = {
    [STATE_CODES.wa]: 0,
    [STATE_CODES.or]: 0,
    [STATE_CODES.ca]: 0,
    [STATE_CODES.ak]: 0,
    [STATE_CODES.id]: 0,
    [STATE_CODES.nv]: 0,
    [STATE_CODES.mt]: 0,
    [STATE_CODES.wy]: 1,
    [STATE_CODES.ut]: 1,
    [STATE_CODES.az]: 1,
    [STATE_CODES.co]: 1,
    [STATE_CODES.nm]: 0,
    [STATE_CODES.nd]: 1,
    [STATE_CODES.sd]: 1,
    [STATE_CODES.ne]: 2,
    [STATE_CODES.ks]: 2,
    [STATE_CODES.ok]: 1,
    [STATE_CODES.tx]: 0,
    [STATE_CODES.mn]: 0,
    [STATE_CODES.ia]: 1,
    [STATE_CODES.mo]: -1,
    [STATE_CODES.ar]: -1,
    [STATE_CODES.la]: -2,
    [STATE_CODES.wi]: 0,
    [STATE_CODES.il]: 0,
    [STATE_CODES.ky]: 0,
    [STATE_CODES.tn]: 0,
    [STATE_CODES.ms]: -2,
    [STATE_CODES.mi]: 0,
    [STATE_CODES.in]: 1,
    [STATE_CODES.al]: -1,
    [STATE_CODES.oh]: 1,
    [STATE_CODES.ga]: -2,
    [STATE_CODES.fl]: 0,
    [STATE_CODES.ny]: 0,
    [STATE_CODES.pa]: 0,
    [STATE_CODES.wv]: 0,
    [STATE_CODES.va]: 0,
    [STATE_CODES.nc]: -1,
    [STATE_CODES.sc]: -1,
    [STATE_CODES.me]: 1,
    [STATE_CODES.nh]: 0,
    [STATE_CODES.vt]: 1,
    [STATE_CODES.ma]: -2,
    [STATE_CODES.ct]: 0,
    [STATE_CODES.ri]: -2,
    [STATE_CODES.nj]: 0,
    [STATE_CODES.de]: 0,
    [STATE_CODES.md]: 0,
    [STATE_CODES.hi]: 0,
};
export const stateNames = Object.keys(DEFAULT_COUNTS);

export const ELECTORS = {
    [STATE_CODES.wa]: 9,
    [STATE_CODES.or]: 6,
    [STATE_CODES.ca]: 32,
    [STATE_CODES.ak]: 3,
    [STATE_CODES.id]: 4,
    [STATE_CODES.nv]: 3,
    [STATE_CODES.mt]: 4,
    [STATE_CODES.wy]: 3,
    [STATE_CODES.ut]: 4,
    [STATE_CODES.az]: 4,
    [STATE_CODES.co]: 6,
    [STATE_CODES.nm]: 4,
    [STATE_CODES.nd]: 4,
    [STATE_CODES.sd]: 4,
    [STATE_CODES.ne]: 6,
    [STATE_CODES.ks]: 8,
    [STATE_CODES.ok]: 8,
    [STATE_CODES.tx]: 24,
    [STATE_CODES.mn]: 11,
    [STATE_CODES.ia]: 10,
    [STATE_CODES.mo]: 13,
    [STATE_CODES.ar]: 8,
    [STATE_CODES.la]: 10,
    [STATE_CODES.wi]: 12,
    [STATE_CODES.il]: 27,
    [STATE_CODES.ky]: 10,
    [STATE_CODES.tn]: 11,
    [STATE_CODES.ms]: 8,
    [STATE_CODES.mi]: 20,
    [STATE_CODES.in]: 13,
    [STATE_CODES.al]: 11,
    [STATE_CODES.oh]: 25,
    [STATE_CODES.ga]: 12,
    [STATE_CODES.fl]: 10,
    [STATE_CODES.ny]: 45,
    [STATE_CODES.pa]: 32,
    [STATE_CODES.wv]: 8,
    [STATE_CODES.va]: 12,
    [STATE_CODES.nc]: 14,
    [STATE_CODES.sc]: 8,
    [STATE_CODES.me]: 5,
    [STATE_CODES.nh]: 4,
    [STATE_CODES.vt]: 5,
    [STATE_CODES.ma]: 16,
    [STATE_CODES.ct]: 8,
    [STATE_CODES.ri]: 4,
    [STATE_CODES.nj]: 16,
    [STATE_CODES.de]: 3,
    [STATE_CODES.md]: 9,
    [STATE_CODES.hi]: 3,
};

export const stateLeanNixon = {
    [STATE_CODES.wa]: true,
    [STATE_CODES.or]: true,
    [STATE_CODES.ca]: true,
    [STATE_CODES.ak]: true,
    [STATE_CODES.id]: true,
    [STATE_CODES.nv]: false,
    [STATE_CODES.mt]: true,
    [STATE_CODES.wy]: true,
    [STATE_CODES.ut]: true,
    [STATE_CODES.az]: true,
    [STATE_CODES.co]: true,
    [STATE_CODES.nm]: false,
    [STATE_CODES.nd]: true,
    [STATE_CODES.sd]: true,
    [STATE_CODES.ne]: true,
    [STATE_CODES.ks]: true,
    [STATE_CODES.ok]: true,
    [STATE_CODES.tx]: false,
    [STATE_CODES.mn]: false,
    [STATE_CODES.ia]: true,
    [STATE_CODES.mo]: false,
    [STATE_CODES.ar]: false,
    [STATE_CODES.la]: false,
    [STATE_CODES.wi]: true,
    [STATE_CODES.il]: false,
    [STATE_CODES.ky]: true,
    [STATE_CODES.tn]: true,
    [STATE_CODES.ms]: false,
    [STATE_CODES.mi]: false,
    [STATE_CODES.in]: true,
    [STATE_CODES.al]: false,
    [STATE_CODES.oh]: true,
    [STATE_CODES.ga]: false,
    [STATE_CODES.fl]: true,
    [STATE_CODES.ny]: false,
    [STATE_CODES.pa]: false,
    [STATE_CODES.wv]: false,
    [STATE_CODES.va]: true,
    [STATE_CODES.nc]: false,
    [STATE_CODES.sc]: false,
    [STATE_CODES.me]: true,
    [STATE_CODES.nh]: true,
    [STATE_CODES.vt]: true,
    [STATE_CODES.ma]: false,
    [STATE_CODES.ct]: false,
    [STATE_CODES.ri]: false,
    [STATE_CODES.nj]: false,
    [STATE_CODES.de]: false,
    [STATE_CODES.md]: false,
    [STATE_CODES.hi]: false,
};

export const REGION = {
    WEST: 0,
    MIDWEST: 1,
    NORTHEAST: 2,
    SOUTH: 3
};
export const REGION_NAME = {
    [REGION.WEST]: "west",
    [REGION.MIDWEST]: "midwest",
    [REGION.SOUTH]: "south",
    [REGION.NORTHEAST]: "east"
};
export const STATE_REGION = {
    [STATE_CODES.wa]: REGION.WEST,
    [STATE_CODES.or]: REGION.WEST,
    [STATE_CODES.ca]: REGION.WEST,
    [STATE_CODES.ak]: REGION.WEST,
    [STATE_CODES.id]: REGION.WEST,
    [STATE_CODES.nv]: REGION.WEST,
    [STATE_CODES.mt]: REGION.WEST,
    [STATE_CODES.wy]: REGION.WEST,
    [STATE_CODES.ut]: REGION.WEST,
    [STATE_CODES.az]: REGION.WEST,
    [STATE_CODES.co]: REGION.WEST,
    [STATE_CODES.nm]: REGION.WEST,
    [STATE_CODES.nd]: REGION.WEST,
    [STATE_CODES.sd]: REGION.WEST,
    [STATE_CODES.ne]: REGION.WEST,
    [STATE_CODES.ks]: REGION.WEST,
    [STATE_CODES.ok]: REGION.WEST,
    [STATE_CODES.tx]: REGION.SOUTH,
    [STATE_CODES.mn]: REGION.MIDWEST,
    [STATE_CODES.ia]: REGION.MIDWEST,
    [STATE_CODES.mo]: REGION.MIDWEST,
    [STATE_CODES.ar]: REGION.SOUTH,
    [STATE_CODES.la]: REGION.SOUTH,
    [STATE_CODES.wi]: REGION.MIDWEST,
    [STATE_CODES.il]: REGION.MIDWEST,
    [STATE_CODES.ky]: REGION.MIDWEST,
    [STATE_CODES.tn]: REGION.SOUTH,
    [STATE_CODES.ms]: REGION.SOUTH,
    [STATE_CODES.mi]: REGION.MIDWEST,
    [STATE_CODES.in]: REGION.MIDWEST,
    [STATE_CODES.al]: REGION.SOUTH,
    [STATE_CODES.oh]: REGION.MIDWEST,
    [STATE_CODES.ga]: REGION.SOUTH,
    [STATE_CODES.fl]: REGION.SOUTH,
    [STATE_CODES.ny]: REGION.NORTHEAST,
    [STATE_CODES.pa]: REGION.NORTHEAST,
    [STATE_CODES.wv]: REGION.NORTHEAST,
    [STATE_CODES.va]: REGION.SOUTH,
    [STATE_CODES.nc]: REGION.SOUTH,
    [STATE_CODES.sc]: REGION.SOUTH,
    [STATE_CODES.me]: REGION.NORTHEAST,
    [STATE_CODES.nh]: REGION.NORTHEAST,
    [STATE_CODES.vt]: REGION.NORTHEAST,
    [STATE_CODES.ma]: REGION.NORTHEAST,
    [STATE_CODES.ct]: REGION.NORTHEAST,
    [STATE_CODES.ri]: REGION.NORTHEAST,
    [STATE_CODES.nj]: REGION.NORTHEAST,
    [STATE_CODES.de]: REGION.NORTHEAST,
    [STATE_CODES.md]: REGION.NORTHEAST,
    [STATE_CODES.hi]: REGION.WEST,
};

// to get from OUTER to INNER we need to go to VALUE
export const movePath = {
    [STATE_CODES.hi]: {
        [STATE_CODES.ak]: REGION.WEST,
        [REGION.WEST]: REGION.WEST,
        [REGION.MIDWEST]: REGION.WEST,
        [REGION.NORTHEAST]: REGION.WEST,
        [REGION.SOUTH]: REGION.WEST
    },
    [STATE_CODES.ak]: {
        [STATE_CODES.hi]: REGION.WEST,
        [REGION.WEST]: REGION.WEST,
        [REGION.MIDWEST]: REGION.WEST,
        [REGION.NORTHEAST]: REGION.WEST,
        [REGION.SOUTH]: REGION.WEST
    },
    [REGION.WEST]: {
        [STATE_CODES.hi]: "hawaii",
        [STATE_CODES.ak]: "alaska",
        [REGION.MIDWEST]: REGION.MIDWEST,
        [REGION.NORTHEAST]: REGION.SOUTH,
        [REGION.SOUTH]: REGION.SOUTH
    },
    [REGION.MIDWEST]: {
        [STATE_CODES.hi]: REGION.WEST,
        [STATE_CODES.ak]: REGION.WEST,
        [REGION.WEST]: REGION.WEST,
        [REGION.NORTHEAST]: REGION.NORTHEAST,
        [REGION.SOUTH]: REGION.SOUTH
    },
    [REGION.NORTHEAST]: {
        [STATE_CODES.hi]: REGION.MIDWEST,
        [STATE_CODES.ak]: REGION.MIDWEST,
        [REGION.WEST]: REGION.MIDWEST,
        [REGION.MIDWEST]: REGION.MIDWEST,
        [REGION.SOUTH]: REGION.SOUTH
    },
    [REGION.SOUTH]: {
        [STATE_CODES.hi]: REGION.WEST,
        [STATE_CODES.ak]: REGION.WEST,
        [REGION.WEST]: REGION.WEST,
        [REGION.MIDWEST]: REGION.MIDWEST,
        [REGION.NORTHEAST]: REGION.NORTHEAST
    },
};

export const PRETTY_STATES = {
    [STATE_CODES.al]: "Alabama",
    [STATE_CODES.ak]: "Alaska",
    [STATE_CODES.az]: "Arizona",
    [STATE_CODES.ar]: "Arkansas",
    [STATE_CODES.ca]: "California",
    [STATE_CODES.co]: "Colorado",
    [STATE_CODES.ct]: "Connecticut",
    [STATE_CODES.de]: "Delaware",
    [STATE_CODES.fl]: "Florida",
    [STATE_CODES.ga]: "Georgia",
    [STATE_CODES.hi]: "Hawaii",
    [STATE_CODES.id]: "Idaho",
    [STATE_CODES.il]: "Illinois",
    [STATE_CODES.in]: "Indiana",
    [STATE_CODES.ia]: "Iowa",
    [STATE_CODES.ks]: "Kansas",
    [STATE_CODES.ky]: "Kentucky",
    [STATE_CODES.la]: "Louisiana",
    [STATE_CODES.me]: "Maine",
    [STATE_CODES.md]: "Maryland",
    [STATE_CODES.ma]: "Massachusetts",
    [STATE_CODES.mi]: "Michigan",
    [STATE_CODES.mn]: "Minnesota",
    [STATE_CODES.ms]: "Mississippi",
    [STATE_CODES.mo]: "Missouri",
    [STATE_CODES.mt]: "Montana",
    [STATE_CODES.ne]: "Nebraska",
    [STATE_CODES.nv]: "Nevada",
    [STATE_CODES.nh]: "New Hampshire",
    [STATE_CODES.nj]: "New Jersey",
    [STATE_CODES.nm]: "New Mexico",
    [STATE_CODES.ny]: "New York",
    [STATE_CODES.nc]: "North Carolina",
    [STATE_CODES.nd]: "North Dakota",
    [STATE_CODES.oh]: "Ohio",
    [STATE_CODES.ok]: "Oklahoma",
    [STATE_CODES.or]: "Oregon",
    [STATE_CODES.pa]: "Pennsylvania",
    [STATE_CODES.ri]: "Rhode Island",
    [STATE_CODES.sc]: "South Carolina",
    [STATE_CODES.sd]: "South Dakota",
    [STATE_CODES.tn]: "Tennessee",
    [STATE_CODES.tx]: "Texas",
    [STATE_CODES.ut]: "Utah",
    [STATE_CODES.vt]: "Vermont",
    [STATE_CODES.va]: "Virginia",
    [STATE_CODES.wa]: "Washington",
    [STATE_CODES.wv]: "West Virginia",
    [STATE_CODES.wi]: "Wisconsin",
    [STATE_CODES.wy]: "Wyoming"
}