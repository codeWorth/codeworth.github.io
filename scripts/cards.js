import * as CONSTANTS from "./constants.js";
import * as EVENT from "./events.js";

export const PARTY = {
	REPUBLICAN: "r",
	DEMOCRAT: "d",
	BOTH: "b"
};

export const ISSUE = {
	ECONOMY: "e",
	CIVIL_RIGHTS: "c",
	DEFENSE: "d"
};
export const ISSUE_NAME = {
	[ISSUE.ECONOMY]: [CONSTANTS.ISSUE.ECONOMY],
	[ISSUE.DEFENSE]: [CONSTANTS.ISSUE.DEFENSE],
	[ISSUE.CIVIL_RIGHTS]: [CONSTANTS.ISSUE.CIVIL_RIGHTS],
}

export const LOCATION = {
	NONE: "n",
	DEBATE: "d",
	PREVENTION: "p",
	ELECTION_DAY: "e"
};

export const PARTY_URL = {
	[PARTY.DEMOCRAT]: "../images/kennedy.png",
	[PARTY.REPUBLICAN]: "../images/nixon.png",
	[PARTY.BOTH]: "../images/both.png"
};

export const ISSUE_URL = {
	[ISSUE.ECONOMY]: "../images/economy.png",
	[ISSUE.CIVIL_RIGHTS]: "../images/civilrights.png",
	[ISSUE.DEFENSE]: "../images/defense.png"
};

export const ENDORSE_REGIONS = {
	WEST: "west",
	EAST: "east",
	MID: "mid",
	SOUTH: "south",
	ALL: "all"
};
export const ENDORSEMENT_CARDS = [
	ENDORSE_REGIONS.WEST, ENDORSE_REGIONS.WEST, ENDORSE_REGIONS.WEST,
	ENDORSE_REGIONS.EAST, ENDORSE_REGIONS.EAST, ENDORSE_REGIONS.EAST,
	ENDORSE_REGIONS.MID, ENDORSE_REGIONS.MID, ENDORSE_REGIONS.MID,
	ENDORSE_REGIONS.SOUTH, ENDORSE_REGIONS.SOUTH, ENDORSE_REGIONS.SOUTH,
	ENDORSE_REGIONS.ALL, ENDORSE_REGIONS.ALL, ENDORSE_REGIONS.ALL, ENDORSE_REGIONS.ALL
];

export const CANDIDATE_CARD_NAME = "Candidate Card";
export const CANDIDATE_CARD = candidate => ({
	points: 5,
	rest: 0,
	text: "This card may only be played for campaign points. Once played, it is flipped to the exhausted side.",
	state: candidate === "kennedy" ? "ma" : "ca",
	party: candidate === "kennedy" ? PARTY.DEMOCRAT : PARTY.REPUBLICAN,
	issue: null,
	isCandidate: true
});

const _CARDS = {
	"Give 'Em Hell Harry": {
		text: "If Kennedy is leading in multiple issues, the Kennedy player loses 1 momentum marker and must subtract a total of 2 issue support",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "ny",
		location: LOCATION.NONE,
		event: EVENT.hellHarry
	},
    "Fatigue Sets In": {
		text: "If opponent's candidate card is currently available for play, flip it over to its Exhausted side",
		points: 4,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "oh",
		location: LOCATION.NONE,
		event: EVENT.fatigueIn
	},
    "Gathering Momentum in the East": {
		text: "Whichever player is leading more states in the East gains 1 momentum marker, plus 1 state support in each Eastern state currently having no support for either candidate.",
		points: 4,
		party: PARTY.BOTH,
		issue: null,
		state: null,
		location: LOCATION.NONE,
		event: EVENT.mmtmEast
	},
    "Unpledged Electors": {
		text: "On Election Day, if Kennedy wins Alabama, Louisiana, or Mississippi with less than 4 state support, the elctoral votes for these states are not awarded to either player.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "ca",
		location: LOCATION.ELECTION_DAY,
		event: EVENT.putFlag(CONSTANTS.ELECTION_FLAGS.UNPLEDGED)
	},
    "Dwight D. Eisenhower": {
		text: "The Nixon player may add a total of 7 state support anywhere, no more than 1 per state. This event prevents the Eisenhower's Silence event.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "pa",
		location: LOCATION.PREVENTION,
		event: EVENT.dwight
	},
    "Harvard Brain Trust": {
		text: "In the Debates, the Kennedy player gains +1 to their Campaign Point total for each issue. This event has no effect after the Debates.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "pa",
		location: LOCATION.DEBATE,
		event: EVENT.putFlag(CONSTANTS.DEBATE_FLAGS.BRAIN_TRUST)
	},
    "Heartland of America": {
		text: "The Nixon player may add a total of 7 state support in states in the West or Midwest having 10 or fewer electoral votes, no more than 1 per state.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "nj",
		location: LOCATION.NONE,
		event: EVENT.heartland
	},
    "Hurricane Donna": {
		text: "Move player's candidate token to Florida without paying the normal travel costs. Player gains 1 momentum marker and 1 state support in Florida.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "mt",
		location: LOCATION.NONE,
		event: EVENT.donna
	},
    "Cassius Clay Wins Gold": {
		text: "The leaders in Defense and Economy lose 1 issue support in those issues. If the same player leads both, they also lose 1 momentum marker.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "oh",
		location: LOCATION.NONE,
		event: EVENT.cassius
	},
    "The Old Nixon": {
		text: "The Nixon player loses 1 momentum marker. The Kennedy player loses 3 momentum markers.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "il",
		location: LOCATION.NONE,
		event: EVENT.oldNixon
	},
    "\"Peace Without Surrender\"": {
		text: "Defense moves up one space on the Issue Track and Nixon gains 1 issue support in Defense.",
		points: 2,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "co",
		location: LOCATION.NONE,
		event: EVENT.peaceSurrender
	},
    "Nixon Egged in Michigan": {
		text: "Move the Nixon candidate token to Michigan without paying the normal travel costs. The Nixon player must subtract 1 state support in Michigan and may not spend CP on Campaigning actions in the Midwest for the remainder of the turn.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.DEFENSE,
		state: "hi",
		location: LOCATION.NONE,
		event: EVENT.nixonEgged
	},
    "\"Give Me A Week\"": {
		text: "The Nixon player loses 2 momentum markers and must subtract 1 issue support in each issue.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "oh",
		location: LOCATION.NONE,
		event: EVENT.giveWeek
	},
    "Tricky Dick": {
		text: "The Nixon player loses 1 momentum marker and may immediately retrieve and play any card from the discard pile as an event. No rest cubes are gained for the retrieved card.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "il",
		location: LOCATION.NONE,
		event: EVENT.tricky
	},
    "\"A New Frontier\"": {
		text: "The Kennedy player may discard any number of cards from their hand and draw the same number of replacements from the Campaign Deck.",
		points: 2,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.DEFENSE,
		state: "ri",
		location: LOCATION.NONE,
		event: EVENT.newFrontier
	},
    "Joe Kennedy": {
		text: "The Nixon player may not expend momentum markers for the remainder of the turn.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.DEFENSE,
		state: "ga",
		location: LOCATION.NONE,
		event: EVENT.roundFlag(CONSTANTS.FLAGS.JOE_KENNEDY)
	},
    "Herblock": {
		text: "The Kennedy player may remove 2 Nixon media support cubes from the board.",
		points: 2,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "ms",
		location: LOCATION.NONE,
		event: EVENT.herblock
	},
    "Gaffe": {
		text: "Opponent loses 1 momentum marker and 3 state support in the state currently occupied by their candidate token.",
		points: 4,
		party: PARTY.BOTH,
		issue: ISSUE.ECONOMY,
		state: "tx",
		location: LOCATION.NONE,
		event: EVENT.gaffe
	},
    "Stevenson Loyalists": {
		text: "The Kennedy player may not spend CP on Campaigning action in the West or Midwest for the remainder fo the turn.",
		points: 2,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "sd",
		location: LOCATION.NONE,
		event: EVENT.loyalists
	},
    "Greater Houston Ministerial Association": {
		text: "Immediately move the Kennedy candidate token to Texas, without paying the normal travel costs. The Kennedy player gains 1 momentum marker and may add a total of 5 state support anywhere, no more than 1 per state. This event prevents the Baptist Ministers, Norman Vincent Peale, and Puerto Rican Bishops events.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.DEFENSE,
		state: "ny",
		location: LOCATION.PREVENTION,
		event: EVENT.houstonAssoc
	},
    "Quemoy and Matsu": {
		text: "The leader in Defense gains 1 momentum marker and may add a total of 3 state support anywhere, no more than 1 per state.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.ECONOMY,
		state: "nc",
		location: LOCATION.NONE,
		event: EVENT.quemoy
	},
    "Norman Vincent Peale": {
		text: "The Nixon player may subtract a total of 5 state support from Kennedy anywhere, no more than 1 per state. This event is prevented by the Greater Houston Ministerial Association event.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "va",
		location: LOCATION.NONE,
		event: EVENT.normamVincent
	},
    "Voter Registration Drive": {
		text: "Player may add a total of 3 state support in states which currently contain no support for either player, no more than 1 per state.",
		points: 4,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "wa",
		location: LOCATION.NONE,
		event: EVENT.voterDrive
	},
    "Martin Luther King Arrested": {
		text: "Civil Rights moves up one space on the Issue Track. Player gains 3 issue support in Civil Rights.",
		points: 4,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ca",
		location: LOCATION.NONE,
		event: EVENT.kingArrested
	},
    "Ken-Air": {
		text: "For the remainder of the turn, the Kennedy player is exempt from travel cost and gains +1 CP to all cards played as Campaigning actions, to a maximum value of 5 CP.",
		points: 2,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "md",
		location: LOCATION.NONE,
		event: EVENT.kenAir
	},
    "Johnson Jeered in Dallas": {
		text: "The Kennedy player loses 1 state support in Texas and may not spend CP on Campaigning actions in the South for the remainder of the turn.",
		points: 2,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "mo",
		location: LOCATION.NONE,
		event: EVENT.johnsonJeered
	},
    "Lyndon Johnson": {
		text: "The Kennedy player may add 2 state support in Texas and a total of 3 additional state support anywhere in the South, no more than 2 per state. If the Kennedy candidate card is currently flipped to its Exhausted side, the Kennedy player may reclaim it face-up.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ca",
		location: LOCATION.NONE,
		event: EVENT.lyndonJohnson
	},
    "Gathering Momentum in the West": {
		text: "Whichever player is leading more states in the West gains 1 momentum marker, plus 1 state support in each Western state currently having no support for either candidate.",
		points: 4,
		party: PARTY.BOTH,
		issue: null,
		state: null,
		location: LOCATION.NONE,
		event: EVENT.mmtmWest
	},
    "Gathering Momentum in the South": {
		text: "Whichever player is leading more states in the South gains 1 momentum marker, plus 1 state support in each Southern state currently having no support for either candidate.",
		points: 4,
		party: PARTY.BOTH,
		issue: null,
		state: null,
		location: LOCATION.NONE,
		event: EVENT.mmtmSouth
	},
    "Gathering Momentum in the Midwest": {
		text: "Whichever player is leading more states in the Midwest gains 1 momentum marker, plus 1 state support in each Midwestern state currently having no support for either candidate.",
		points: 4,
		party: PARTY.BOTH,
		issue: null,
		state: null,
		location: LOCATION.NONE,
		event: EVENT.mmtmMidwest
	},
    "Eisenhower's Silence": {
		text: "The Nixon player may not spend CP on Campaigning in any state led by Kennedy for the remainder of the turn. This event is prevented by the Dwight D. Eisenhower event.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "il",
		location: LOCATION.NONE,
		event: EVENT.roundFlag(CONSTANTS.FLAGS.SILENCE)
	},
    "1960 Civil Rights Act": {
		text: "Civil Rights moves up one space on the Issue Track and Nixon gains 1 issue support in Civil Rights.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "nd",
		location: LOCATION.NONE,
		event: EVENT.civilRightsAct
	},
    "Stock Market in Decline": {
		text: "Economy moves up two spaces on the Issue Track. The leader in Economy gains 2 state support in New York.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "tn",
		location: LOCATION.NONE,
		event: EVENT.stockMarket
	},
    "Adlai Stevenson": {
		text: "The Kennedy player gains 1 state support in Illinois and may retrieve any card from the discard pile.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ma",
		location: LOCATION.NONE,
		event: EVENT.adlai
	},
    "World Series Ends": {
		text: "The player with media support cubes in the East (if any) may add a total of 5 state support in the East, no more than 2 per state.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.ECONOMY,
		state: "ut",
		location: LOCATION.NONE,
		EVENT: EVENT.worldSeries
	},
    "Baptist Ministers": {
		text: "The Nixon player may subtract a total of 5 state support from Kennedy in the South or Midwest, no more than 2 per state. This event prevented by the Greater Houston Ministerial Association event.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ma",
		location: LOCATION.NONE,
		event: EVENT.baptist
	},
    "Rising Food Prices": {
		text: "Economy moves up one space on the Issue Track and Nixon gains 2 issue support in Economy",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ia",
		location: LOCATION.NONE,
		event: EVENT.risingFood
	},
    "\"A Time for Greatness\"": {
		text: "Nixon loses 1 issue support in each issue. The Kennedy player may add 3 state support anywhere, no more than 1 per state.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "tx",
		location: LOCATION.NONE,
		event: EVENT.greatnessTime
	},
    "Henry Cabot Lodge": {
		text: "Nixon gains 2 state support in Massachusetts and 2 issue support in Defense. If the Nixon candidate card is currently flipped to its Exhausted side, the Nixon player may reclaim it face-up.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "ny",
		location: LOCATION.NONE,
		event: EVENT.henryCabot
	},
    "Jackie Kennedy": {
		text: "For the remainder of the turn, the Nixon player must expend 1 momentum marker in order to play a card as an event.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.DEFENSE,
		state: "nj",
		location: LOCATION.NONE,
		event: EVENT.roundFlag(CONSTANTS.FLAGS.JACKIE_KENNEDY)
	},
    "The Great Seal Bug": {
		text: "Nixon gains 1 issue support in Defense and may retrieve the Henry Cabot Lodge card from the discard pile if it is there.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "wi",
		location: LOCATION.NONE,
		event: EVENT.sealBug
	},
    "Nixon's Pledge": {
		text: "For the remainder of the turn, the Kennedy player gains 1 momentum marker whenever the Nixon player plays a card as anything other than a Campaiging action.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.DEFENSE,
		state: "il",
		location: LOCATION.NONE,
		event: EVENT.roundFlag(CONSTANTS.FLAGS.NIXON_PLEDGE)
	},
    "Industrial Midwest": {
		text: "The Nixon player may add a total of 5 state support in Illinois, Indiana, Michigan, Minnesota, Ohio, and Wisconsin, no more than 2 per state.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "in",
		location: LOCATION.NONE,
		event: EVENT.industrialMidwest
	},
    "Bobby Kennedy": {
		text: "The Kennedy player gains +1 CP to all cards played for the remainder of the turn, to a maximum value of 5 CP.",
		points: 2,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "ct",
		location: LOCATION.NONE,
		event: EVENT.bobKen
	},
    "The New Nixon": {
		text: "The Nixon player gains 1 momentum marker.",
		points: 2,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "ks",
		location: LOCATION.NONE,
		event: EVENT.newNixon
	},
    "\"Lazy Shave\"": {
		text: "In each round of the Debates, the Nixon player's card is revealed before the Kennedy player selects a card to play. This event has no effect after the Debates.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "nc",
		location: LOCATION.DEBATE,
		event: EVENT.putFlag(CONSTANTS.DEBATE_FLAGS.LAZY_SHAVE)
	},
    "Puerto Rican Bishops": {
		text: "The Kennedy player may not expend momentum markers for the remainder of the turn. This event is prevented by the Greater Houston Ministerial Association event.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ne",
		location: LOCATION.NONE,
		event: EVENT.roundFlag(CONSTANTS.FLAGS.PUERTO_RICAN)
	},
    "\"High Hopes\"": {
		text: "Reveal the top two cards from the Campaign Deck, one at a time. Events on cards featuring the Kennedy icon take effect in the order revealed as if played by the Kennedy player.",
		points: 2,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ar",
		location: LOCATION.NONE,
		event: EVENT.highHopes
	},
    "\"Experience Counts\"": {
		text: "Kennedy loses 1 issue support in each issue. The Nixon player gains 1 momentum marker.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "ca",
		location: LOCATION.NONE,
		event: EVENT.experience
	},
    "Republican TV Spots": {
		text: "Immediately move the Nixon candidate token to New York, but do not pay the normal travel costs for doing so. The Nixon player may place 3 media support cubes.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ca",
		location: LOCATION.NONE,
		event: EVENT.repubTv
	},
    "Nikita Kruschev": {
		text: "The leader in Defense gains 1 momentum marker and may add a total of 3 state support anywhere, no more than 1 per state.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.ECONOMY,
		state: "fl",
		location: LOCATION.NONE,
		event: EVENT.kruschev
	},
    "Southern Strategy": {
		text: "The Nixon player may add a total of 5 state support in the South, no more than 2 per state. Kennedy gains 1 issue support in Civil Rights.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "ky",
		location: LOCATION.NONE,
		event: EVENT.southern
	},
    "Political Capital": {
		text: "The Nixon player may draw two cards from the Campaign Deck.",
		points: 2,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "ok",
		location: LOCATION.NONE,
		event: EVENT.polCapital
	},
    "New England": {
		text: "The Kennedy player may add a total of 5 state support to Connecticut, Massachusetts, Maine, New York, Rhode Island, and Vermont, no more than 2 per state",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.DEFENSE,
		state: "la",
		location: LOCATION.NONE,
		event: EVENT.newEngland
	},
    "Pierre Salinger": {
		text: "The Kennedy player may add 3 issue support in any one issue.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "al",
		location: LOCATION.NONE,
		event: EVENT.pierre
	},
    "Kennedy's Peace Corps": {
		text: "For the remainder of the turn, the Kennedy player may preempt event when playing cards without needing to expend momentum markers to do so.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "la",
		location: LOCATION.NONE,
		event: EVENT.roundFlag(CONSTANTS.FLAGS.KENNEDY_CORPS)
	},
    "Nelson Rockefeller": {
		text: "The Nixon player gains 1 state support in New York and may retrieve any card from the discard pile.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "ky",
		location: LOCATION.NONE,
		event: EVENT.nelsonRock
	},
    "Campaign Headquarters": {
		text: "Player may discard any number of cards from their hand and draw the same number of replacements from the Campaign Deck.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "nm",
		location: LOCATION.NONE,
		event: EVENT.campaignHead
	},
    "Soviet Economic Growth": {
		text: "Economy moves up one space on the Issue Track. The leader in Economy gains 1 state support in New York.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.ECONOMY,
		state: "nh",
		location: LOCATION.NONE,
		event: EVENT.sovietGrowth
	},
    "Eleanor Roosevelt's Speaking Tour": {
		text: "The Kennedy player may add a total of 5 state support in the Midwest, no more than 2 per state.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "fl",
		location: LOCATION.NONE,
		event: EVENT.eleanorTour
	},
    "Advance Men": {
		text: "For the remainder of the turn, player is not required to pay travel costs, nor to make support checks for Campaigning actions in states that are either carried by opponent or occupied by opponent's candidate token.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.ECONOMY,
		state: "nv",
		location: LOCATION.NONE,
		event: EVENT.advanceMen
	},
    "Citizens for Nixon-Lodge": {
		text: "The Nixon player gains +1 CP to all cards played for the remainder of the turn, to a maximum value of 5 CP.",
		points: 2,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "az",
		location: LOCATION.NONE,
		event: EVENT.citizensNixon
	},
    "Lunch Counter Sit-Ins": {
		text: "Civil Rights moves up one space on the Issue Track. The leader in Civil Rights may add a total of 3 state support anywhere, no more than 1 per state.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "nj",
		location: LOCATION.NONE,
		event: EVENT.lunchCounter
	},
    "Stature Gap": {
		text: "The Kennedy player suffers -2 CP to all cards played as Positioning actions for the remainder of the turn, to a minimum value of 1 CP",
		points: 2,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "vt",
		location: LOCATION.NONE,
		event: EVENT.structureGap
	},
    "Nixon's Knee": {
		text: "Immediately move the Nixon candidate token to Maryland, without paying the normal travel cost. For the remainder of the turn, the Nixon player must expend 1 momentum marker in order to play a card as a Campaigning action.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "tx",
		location: LOCATION.NONE,
		event: EVENT.nixonKnee
	},
    "Fifty Stars": {
		text: "Whichever player has more state support in Alaska and Hawaii may add a total of 5 state support anywhere, no more than 1 per state.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "ak",
		location: LOCATION.NONE,
		event: EVENT.fiftyStars
	},
    "Fidel Castro": {
		text: "The leader in Defense gains 1 momentum marker and 1 state support in Florida.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.ECONOMY,
		state: "id",
		location: LOCATION.NONE,
		event: EVENT.fidel
	},
    "Medal Count": {
		text: "The leaders in Civil Rights and Economy lose 1 issue support in those issues. If the same player leads both, they also lose 1 momentum marker.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "pa",
		location: LOCATION.NONE,
		event: EVENT.medal
	},
    "Harry F. Byrd": {
		text: "The Nixon player may subtract a total of 3 state support from Kennedy in Oklahoma, Mississippi, and Alabama.",
		points: 2,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "me",
		location: LOCATION.NONE,
		event: EVENT.harryByrd
	},
    "Herb Klein": {
		text: "The Nixon player may add a total of 3 issue support in any issue.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ia",
		location: LOCATION.NONE,
		event: EVENT.herbKlein
	},
    "Prime-Time Television": {
		text: "Player may add a total of 5 state support in any one region where that player has media support cubes, no more than 2 per state.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "al",
		location: LOCATION.NONE,
		event: EVENT.ptTv
	},
    "East Harlem Pledge": {
		text: "Nixon loses 1 issue support in Civil Rights. The Kennedy player may subtract a total of 5 support from Nixon in the South, no more than 2 per state.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "mi",
		location: LOCATION.NONE,
		event: EVENT.eastHarlem
	},
    "Trial of Gary Powers": {
		text: "Defense moves up two spaces on the Issue Track. The leader in Defense gains 1 momentum marker.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.ECONOMY,
		state: "wi",
		location: LOCATION.NONE,
		event: EVENT.garyPowers
	},
    "Late Returns from Cook County": {
		text: "On Election Day, the Kennedy player gains 5 support checks in Illinois.",
		points: 2,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "sc",
		location: LOCATION.NONE,
		event: EVENT.putFlag(CONSTANTS.ELECTION_FLAGS.COOK_COUNTY)
	},
    "Suburban Voters": {
		text: "The Kennedy player may add a total of 5 state support in states having 20 or more electoral votes, no more than 2 per state.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "mn",
		location: LOCATION.NONE,
		event: EVENT.suburban
	},
    "Old South": {
		text: "The leader in Civil Rights must subtract 5 state support in the South and may not spend CP on Campaigning actions in the South for the remainder of their turn.",
		points: 4,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "ny",
		location: LOCATION.NONE,
		event: EVENT.oldSouth
	},
    "Catholic Support": {
		text: "The Kennedy player may add a total of 7 state support anywhere, no more than 2 per state.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "ny",
		location: LOCATION.NONE,
		event: EVENT.catholic
	},
    "Early Returns From Connecticut": {
		text: "On Election Day, the player leading Connecticut gains 5 support checks in California.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "wy",
		location: LOCATION.ELECTION_DAY,
		event: EVENT.putFlag(CONSTANTS.ELECTION_FLAGS.EARLY_RETURNS)
	},
    "Volunteers": {
		text: "Player gains 1 momentum marker.",
		points: 2,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "or",
		location: LOCATION.NONE,
		event: EVENT.volunteers
	},
    "Sputnik V": {
		text: "Defense moves up one space on the Issue Track. The leader in Defense may add a total of 3 state support anywhere, no more than 1 per state.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "ma",
		location: LOCATION.NONE,
		event: EVENT.sputnik
	},
    "Compact of Fifth Avenue": {
		text: "Immediately move the Nixon candidate token to New York, without paying the normal travel costs. Nixon gains 1 issue support in Civil Rights, 2 state support in New York, and 1 media support cube in the East.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "mi",
		location: LOCATION.NONE,
		event: EVENT.fifthAvenue
	},
    "Gallup Poll": {
		text: "Player may alter the order of the Issues on the Issue Track as desired.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "mo",
		location: LOCATION.NONE,
		event: EVENT.gallup
	},
    "Whistlestop": {
		text: "Player may spend 7 CP on a Campaigning action, expending no more than 1 CP per state.",
		points: 4,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "tx",
		location: LOCATION.NONE,
		event: EVENT.whistlestop
	},
    "The Cold War": {
		text: "The leader in Defense may add a total of 5 state support anywhere, no more than 1 per state.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "mi",
		location: LOCATION.NONE,
		event: EVENT.coldWar
	},
    "Northern Blacks": {
		text: "The leader in Civil Rights may add a total of 5 state support in Illinois, Michigan, and New York, no more than 2 per state.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.DEFENSE,
		state: "mn",
		location: LOCATION.NONE,
		event: EVENT.northBlacks
	},
    "Recount": {
		text: "On Election Day, the Nixon player gains 3 support checks in any one state.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "tx",
		location: LOCATION.ELECTION_DAY,
		event: EVENT.putFlag(CONSTANTS.ELECTION_FLAGS.RECOUNT)
	},
    "A Low Blow": {
		text: "If Nixon is leading in multiple issues, the Kennedy player gains 1 momentum marker and may discard any number of cards from their hand, drawing the same number of replacements from the Campaign Deck.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "il",
		location: LOCATION.NONE,
		event: EVENT.lowBlow
	},
    "Southern Revolt": {
		text: "If Kennedy is leading in Civil Rights, the Nixon player may add a total of 5 state support in the South, no more than 2 per state.",
		points: 3,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.ECONOMY,
		state: "in",
		location: LOCATION.NONE,
		event: EVENT.southernRevolt
	},
    "Congressional Summer Session": {
		text: "The Kennedy player suffers -2 CP to all cards played for the remainder of the turn, to a minimum value of 1 CP. The Kennedy player must immediately (but without paying the normal travel costs) move their candidate token to either Maryland or Virginia.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "pa",
		location: LOCATION.NONE,
		event: EVENT.summerSession
	},
    "Profiles in Courage": {
		text: "For the remainder of the turn, the Kennedy player may redraw any failed support check. Each failed check may only be redrawn once.",
		points: 2,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "de",
		location: LOCATION.NONE,
		event: EVENT.roundFlag(CONSTANTS.FLAGS.PROFILES_COURAGE)
	},
    "Opposition Research": {
		text: "The Kennedy player reveals all cards in their hand. The Nixon player may then spend 3 CP.",
		points: 4,
		party: PARTY.REPUBLICAN,
		issue: ISSUE.DEFENSE,
		state: "oh",
		location: LOCATION.NONE,
		event: EVENT.opposition
	},
    "Mid-Atlantic": {
		text: "The Kennedy player may add a total of 5 state support in Delaware, Maryland, New Jersey, New York, and Pennsylvania, no more than 2 per state.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "tn",
		location: LOCATION.NONE,
		event: EVENT.midAtlantic
	},
    "Missile Gap": {
		text: "Kennedy gains 3 issue support in Defense.",
		points: 3,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.ECONOMY,
		state: "ga",
		location: LOCATION.NONE,
		event: EVENT.missileGap
	},
    "Stump Speech": {
		text: "If opponent has more momentum markers, player gains enough to have the same number.",
		points: 4,
		party: PARTY.BOTH,
		issue: ISSUE.ECONOMY,
		state: "oh",
		location: LOCATION.NONE,
		event: EVENT.stumpSpeech
	},
    "Henry Luce": {
		text: "The Kennedy player may place 1 endorsement marker in any single region.",
		points: 2,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.DEFENSE,
		state: "wv",
		location: LOCATION.NONE,
		event: EVENT.henryLuce
	},
    "Hostile Press Corps": {
		text: "The Nixon player is required to make support checks for Campaigning actions in all states for the remainder of the turn as if they were being carried by Kennedy.",
		points: 4,
		party: PARTY.DEMOCRAT,
		issue: ISSUE.DEFENSE,
		state: "pa",
		location: LOCATION.NONE,
		event: EVENT.roundFlag(CONSTANTS.FLAGS.HOSTILE_PRESS)
	},
    "Swing State": {
		text: "Player may add 5 state support to a single state which is currently being led, but not carried, by the opposing player. Immediately move player's candidate token to that state, without paying the normal travel costs.",
		points: 3,
		party: PARTY.BOTH,
		issue: ISSUE.CIVIL_RIGHTS,
		state: "va",
		location: LOCATION.NONE,
		event: EVENT.swingState
	}
};
export const CARDS = Object.fromEntries(Object.keys(_CARDS).map(name => [
	name, {rest: 4 - _CARDS[name].points, ..._CARDS[name]}
]));