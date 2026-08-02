// Firebase SDK Imports

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { 
    getAuth 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { 
    getFirestore 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { 
    getStorage 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";


// Your Firebase Configuration

const firebaseConfig = {

  apiKey: "AIzaSyCKRcU62Ez3928rG_fRGk6hU0VYurSWjFw",

  authDomain: "prudence-kas.firebaseapp.com",

  projectId: "prudence-kas",

  storageBucket: "prudence-kas.firebasestorage.app",

  messagingSenderId: "98599014078",

  appId: "1:98599014078:web:6118132c134024906f58ef",

  measurementId: "G-LBFLVVZ6X7"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);


// Firebase Services

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


// Export for other files

export {
    app,
    auth,
    db,
    storage
};
