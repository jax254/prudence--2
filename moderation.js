import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const flaggedContent = document.getElementById("flaggedContent");
const securityAlerts = document.getElementById("securityAlerts");
const flaggedCount = document.getElementById("flaggedCount");
const removedCount = document.getElementById("removedCount");
const template = document.getElementById("flaggedTemplate");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    currentUser = user;

    const profile = await getDoc(doc(db, "users", user.uid));

    if (!profile.exists()) {

        location.href = "dashboard.html";

        return;

    }

    const role = profile.data().role;

    if (role !== "admin" &&
        role !== "newsroom" &&
        role !== "superadmin") {

        alert("Access denied.");

        location.href = "dashboard.html";

        return;

    }

    loadFlaggedContent();
    loadSecurityAlerts();

});

function loadFlaggedContent() {

    const q = query(

        collection(db, "moderation"),

        where("status", "==", "pending")

    );

    onSnapshot(q, (snapshot) => {

        flaggedContent.innerHTML = "";

        flaggedCount.textContent = snapshot.size;

        if (snapshot.empty) {

            flaggedContent.innerHTML =
                "<p>No flagged content.</p>";

            return;

        }

        snapshot.forEach((item) => {

            const data = item.data();

            const card =
                template.content.cloneNode(true);

            card.querySelector(".type").textContent =
                data.type;

            card.querySelector(".message").textContent =
                data.message;

            card.querySelector(".author").textContent =
                "Author: " + data.author;

            card.querySelector(".date").textContent =
                data.createdAt
                ?
                data.createdAt.toDate().toLocaleString()
                :
                "Just now";

            // Approve
            card.querySelector(".approve").onclick =
            async () => {

                await updateDoc(
                    doc(db, "moderation", item.id),
                    {
                        status: "approved",
                        reviewedAt: serverTimestamp()
                    }
                );

                await logAction(
                    "Approved flagged content"
                );

            };

            // Delete
            card.querySelector(".delete").onclick =
            async () => {

                await updateDoc(
                    doc(db, "moderation", item.id),
                    {
                        status: "deleted",
                        reviewedAt: serverTimestamp()
                    }
                );

                await logAction(
                    "Deleted flagged content"
                );

            };

            // Ban User
            card.querySelector(".ban").onclick =
            async () => {

                if (!confirm("Suspend this user?"))
                    return;

                await updateDoc(
                    doc(db, "users", data.uid),
                    {
                        suspended: true
                    }
                );

                await logAction(
                    "Suspended user " + data.author
                );

                alert("User suspended.");

            };

            flaggedContent.appendChild(card);

        });

    });

}

function loadSecurityAlerts() {

    const q = query(
        collection(db, "securityLogs")
    );

    onSnapshot(q, (snapshot) => {

        securityAlerts.innerHTML = "";

        removedCount.textContent = 0;

        if (snapshot.empty) {

            securityAlerts.innerHTML =
                "<p>No security alerts.</p>";

            return;

        }

        let removed = 0;

        snapshot.forEach((item) => {

            const log = item.data();

            if (log.action === "deleted") {

                removed++;

            }

            securityAlerts.innerHTML += `

            <div class="flagged-card">

                <h3>${log.level}</h3>

                <p>${log.message}</p>

                <small>

                    ${
                        log.createdAt
                        ?
                        log.createdAt
                        .toDate()
                        .toLocaleString()
                        :
                        "Just now"
                    }

                </small>

            </div>

            `;

        });

        removedCount.textContent = removed;

    });

}

async function logAction(action) {

    await addDoc(

        collection(db, "adminLogs"),

        {

            action,

            admin: currentUser.uid,

            createdAt: serverTimestamp()

        }

    );

}
