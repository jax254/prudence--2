import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const messages = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("message");

let currentUser = null;
let currentProfile = null;

// Check authentication
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    currentUser = user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        alert("Access denied.");
        window.location.href = "../dashboard.html";
        return;
    }

    currentProfile = userSnap.data();

    if (
        currentProfile.role !== "admin" &&
        currentProfile.role !== "newsroom" &&
        currentProfile.role !== "superadmin"
    ) {
        alert("You are not authorized.");
        window.location.href = "../dashboard.html";
        return;
    }

    loadMessages();

});

// Send Message
sendBtn.addEventListener("click", async () => {

    const text = messageInput.value.trim();

    if (text === "") return;

    await addDoc(collection(db, "adminChat"), {

        sender: currentProfile.username,
        role: currentProfile.role,
        uid: currentUser.uid,
        message: text,
        createdAt: serverTimestamp()

    });

    messageInput.value = "";

});

// Load Messages
function loadMessages() {

    const q = query(
        collection(db, "adminChat"),
        orderBy("createdAt", "asc")
    );

    onSnapshot(q, (snapshot) => {

        messages.innerHTML = "";

        snapshot.forEach((item) => {

            const data = item.data();

            const div = document.createElement("div");

            div.className = "message";

            div.innerHTML = `
                <div class="sender">
                    ${data.sender} (${data.role})
                </div>

                <div>
                    ${data.message}
                </div>

                <div class="time">
                    ${data.createdAt?.toDate
                        ? data.createdAt.toDate().toLocaleString()
                        : "Just now"}
                </div>
            `;

            messages.appendChild(div);

        });

        messages.scrollTop = messages.scrollHeight;

    });

}
