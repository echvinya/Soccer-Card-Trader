import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB_FFY3omc51DkkBNmIftcuy0kiRKuNj1Q",
    authDomain: "soccer-card-trader.firebaseapp.com",
    projectId: "soccer-card-trader",
    storageBucket: "soccer-card-trader.firebasestorage.app",
    messagingSenderId: "858390637557",
    appId: "1:858390637557:web:64e33c6339e666b3b94ebc"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
