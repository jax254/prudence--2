import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const usersList = document.getElementById("usersList");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("message");

let currentUser = null;
let selectedUser = null;

// Check Login
onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";
        return;

    }

    currentUser = user;

    loadUsers();

});

// Load Users

async function loadUsers() {

    const snapshot = await getDocs(collection(db, "users"));

    usersList.innerHTML = "";

    snapshot.forEach((doc) => {

        const user = doc.data();

        if (doc.id === currentUser.uid) return;

        const card = document.createElement("div");

        card.className = "user";

        card.innerHTML = `
            <div class="user-name">${user.username}</div>
            <div class="user-status">Online</div>
        `;

        card.onclick = () => {

            selectedUser = doc.id;

            loadMessages();

        };

        usersList.appendChild(card);

    });

}

// Send Message

chatForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!selectedUser) {

        alert("Please select a member first.");

        return;

    }

    await addDoc(collection(db, "messages"), {

        sender: currentUser.uid,

        receiver: selectedUser,

        message: messageInput.value,

        createdAt: serverTimestamp()

    });

    messageInput.value = "";

});

// Load Messages

function loadMessages() {

    const q = query(

        collection(db, "messages"),

        orderBy("createdAt", "asc")

    );

    onSnapshot(q, (snapshot) => {

        chatMessages.innerHTML = "";

        snapshot.forEach((doc) => {

            const msg = doc.data();

            if (

                (msg.sender === currentUser.uid &&
                msg.receiver === selectedUser)

                ||

                (msg.sender === selectedUser &&
                msg.receiver === currentUser.uid)

            ) {

                const bubble = document.createElement("div");

                bubble.className =

                msg.sender === currentUser.uid

                ?

                "message sent"

                :

                "message received";

                bubble.innerHTML = `
                    <div>${msg.message}</div>
                    <div class="time">
                        ${msg.createdAt
                        ?
                        msg.createdAt.toDate().toLocaleTimeString()
                        :
                        ""}
                    </div>
                `;

                chatMessages.appendChild(bubble);

            }

        });

        chatMessages.scrollTop =
        chatMessages.scrollHeight;

    });

}
