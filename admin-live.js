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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const liveRequests = document.getElementById("liveRequests");
const template = document.getElementById("liveTemplate");

let currentUser = null;

// Authenticate Super Admin
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

    const profile = userSnap.data();

    if (profile.role !== "superadmin") {
        alert("Only the Super Admin can access this page.");
        window.location.href = "dashboard.html";
        return;
    }

    loadRequests();

});

// Load Pending Live Requests
function loadRequests() {

    const q = query(
        collection(db, "liveStreams"),
        where("status", "==", "Pending")
    );

    onSnapshot(q, (snapshot) => {

        liveRequests.innerHTML = "";

        if (snapshot.empty) {
            liveRequests.innerHTML = "<p>No pending live requests.</p>";
            return;
        }

        snapshot.forEach((item) => {

            const live = item.data();

            const card = template.content.cloneNode(true);

            card.querySelector(".title").textContent = live.title;
            card.querySelector(".preacher").textContent =
                "Preacher: " + live.preacher;

            card.querySelector(".username").textContent =
                "Requested by: " + live.username;

            card.querySelector(".description").textContent =
                live.description;

            const link = card.querySelector(".streamLink");
            link.href = live.streamLink || "#";

            // Approve
            card.querySelector(".approve").onclick = async () => {

                await updateDoc(doc(db, "liveStreams", item.id), {

                    approved: true,
                    status: "Approved",
                    approvedBy: currentUser.email,
                    approvedAt: serverTimestamp()

                });

                alert("Live broadcast approved.");

            };

            // Reject
            card.querySelector(".reject").onclick = async () => {

                await updateDoc(doc(db, "liveStreams", item.id), {

                    approved: false,
                    status: "Rejected",
                    approvedBy: currentUser.email,
                    approvedAt: serverTimestamp()

                });

                alert("Live broadcast rejected.");

            };

            // Stop Live
            card.querySelector(".stop").onclick = async () => {

                if (!confirm("Stop this live broadcast?")) return;

                await updateDoc(doc(db, "liveStreams", item.id), {

                    approved: false,
                    status: "Stopped",
                    stoppedBy: currentUser.email,
                    stoppedAt: serverTimestamp()

                });

                alert("Live broadcast stopped.");

            };

            liveRequests.appendChild(card);

        });

    });

}
