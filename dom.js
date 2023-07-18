const loginPage = document.getElementById("loginPage");
const loginButton = document.getElementById("login");

const joinPageButton = document.getElementById("joinPage");
const logoutButton = document.getElementById("logout");
const userNameField = document.getElementById("name");
const createGameButton = document.getElementById("createGame");
const gameCodeField = document.getElementById("gameCode");
const joinGameButton = document.getElementById("joinGame");
const deleteGameButton = document.getElementById("deleteGame");
const gameIdsField = document.getElementById("gameIds");

const choosePage = document.getElementById("choosePage");
const kennedyButton = document.getElementById("kennedy");
const nixonButton = document.getElementById("nixon");

const gamePage = document.getElementById("gamePage");
const stateButtons = Object.fromEntries([...document.getElementsByClassName("sb")].map(sb => [
    sb.id, {
        button: sb, 
        setText: s => sb.children[0].innerText = s,
        setCount: n => {
            sb.children[0].innerText = n === 0 ? "" : Math.abs(n);
            removeCSSClass(sb, "red");
            removeCSSClass(sb, "blue");
            if (n > 0) {
                addCSSClass(sb, "red");
            } else if (n < 0) {
                addCSSClass(sb, "blue");
            }
        }
    }
]));
const showElectorsButton = document.getElementById("showElectors");
const turnIndicator = document.getElementById("turnIndicator");
const cardSlots = Object.fromEntries([...Array(8).keys()].map(i => {
    const parentCard = document.getElementById("card" + (i+1));
    return [
        i+1,
        {
            card: parentCard,
            header: parentCard.getElementsByClassName("header")[0],
            body: parentCard.getElementsByClassName("body")[0],
            candidateImg: parentCard.getElementsByClassName("candidate")[0],
            issueImg: parentCard.getElementsByClassName("issue")[0],
            cp: parentCard.getElementsByClassName("cp")[0],
            state: parentCard.getElementsByClassName("state")[0],
            rest: parentCard.getElementsByClassName("rest")[0],
            pointsCover: parentCard.getElementsByClassName("pointsCover")[0]
        }
    ];
}));

const choosePopup = document.getElementById("choosePopup");
const chooseWindow = document.getElementById("chooseWindow");
const chooseTitle = chooseWindow.getElementsByClassName("header")[0];
const chooseButtonsContainer = document.getElementById("buttonContainer");

const nixonIcon = document.getElementById("nixonIcon");
const kennedyIcon = document.getElementById("kennedyIcon");

const endorseButtons = Object.fromEntries([...document.getElementsByClassName("endorse")].map(sb => [
    sb.id, {
        button: sb,
        dataKey: sb.dataset.key,
        setText: s => sb.children[0].innerText = s,
        setCount: n => {
            sb.children[0].innerText = n === 0 ? "" : Math.abs(n);
            removeCSSClass(sb, "red");
            removeCSSClass(sb, "blue");
            if (n > 0) {
                addCSSClass(sb, "red");
            } else if (n < 0) {
                addCSSClass(sb, "blue");
            }
        }
    }
]));
const mediaButtons = Object.fromEntries([...document.getElementsByClassName("media")].map(sb => [
    sb.id, {
        button: sb,
        dataKey: sb.dataset.key,
        setText: s => sb.children[0].innerText = s,
        setCount: n => {
            sb.children[0].innerText = n === 0 ? "" : Math.abs(n);
            removeCSSClass(sb, "red");
            removeCSSClass(sb, "blue");
            if (n > 0) {
                addCSSClass(sb, "red");
            } else if (n < 0) {
                addCSSClass(sb, "blue");
            }
        }
    }
]));
const issueButtons = Object.fromEntries([...document.getElementsByClassName("issue-select")].map(sb => [
    parseInt(sb.dataset.index), {
        button: sb,
        setText: s => sb.children[0].innerText = s,
        setCount: n => {
            sb.children[0].innerText = n === 0 ? "" : Math.abs(n);
            removeCSSClass(sb, "red");
            removeCSSClass(sb, "blue");
            if (n > 0) {
                addCSSClass(sb, "red");
            } else if (n < 0) {
                addCSSClass(sb, "blue");
            }
        }
    }
]));