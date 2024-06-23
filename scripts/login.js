// @ts-ignore
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut
// @ts-ignore
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
// @ts-ignore
import { getFirestore} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { setup } from "./game.js";
import { joinPage, loginButton, logoutButton, userNameField } from './dom.js';
import { addCSSClass, removeCSSClass } from './util.js';

const firebaseConfig = {
    apiKey: "AIzaSyAudyd3kBHsh6aDlLb4lDoZNLaNyoUPxh0",
    authDomain: "tichu-f86a8.firebaseapp.com",
    projectId: "tichu-f86a8",
    storageBucket: "tichu-f86a8.appspot.com",
    messagingSenderId: "549138176153",
    appId: "1:549138176153:web:1a9dc709f64e6a49304008"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth();
auth.onAuthStateChanged(user => {
    if (user) {
        setup(user, db);
        removeCSSClass(joinPage, "hidden");
        removeCSSClass(logoutButton, "hidden");
        addCSSClass(loginButton, "hidden");
    } else {
        addCSSClass(joinPage, "hidden");
        addCSSClass(logoutButton, "hidden");
        removeCSSClass(loginButton, "hidden");
    }
});

function login() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.customData.email;
            console.error(`login error for ${email} (${errorCode}): ${errorMessage}`);
        });
}

function logout() {
    signOut(auth);
    userNameField.innerText = `Log in to play!`;
}

loginButton.onclick = login;
logoutButton.onclick = logout;