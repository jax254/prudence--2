import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const totalUsers = document.getElementById("totalUsers");
const pendingNews = document.getElementById("pendingNews");
const liveBroadcasts = document.getElementById("liveBroadcasts");
const prayerRequests = document.getElementById("prayerRequests");
const chatMessages = document.getElementById("chatMessages");
const admins = document.getElementById("admins");

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../login.html";
        return;

    }

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {

        window.location.href = "../login.html";
        return;

    }

    const userData = userDoc.data();

    if (userData.role !== "superadmin") {

        alert("Access denied.");

        window.location.href = "../dashboard.html";

        return;

    }

    loadDashboard();

});

async function loadDashboard() {

    // Total Users
    const usersSnapshot = await getDocs(
        collection(db, "users")
    );
    totalUsers.textContent = usersSnapshot.size;

    // Pending News
    const newsSnapshot = await getDocs(
        query(
            collection(db, "news"),
            where("approved", "==", false)
        )
    );
    pendingNews.textContent = newsSnapshot.size;

    // Live Broadcasts
    const liveSnapshot = await getDocs(
        query(
            collection(db, "live"),
            where("status", "==", "live")
        )
    );
    liveBroadcasts.textContent = liveSnapshot.size;

    // Prayer Requests
    const prayerSnapshot = await getDocs(
        collection(db, "prayers")
    );
    prayerRequests.textContent = prayerSnapshot.size;

    // Chat Messages
    const messageSnapshot = await getDocs(
        collection(db, "messages")
    );
    chatMessages.textContent = messageSnapshot.size;

    // Admins
    const adminSnapshot = await getDocs(
        query(
            collection(db, "users"),
            where("role", "in", [
                "admin",
                "newsroom",
                "superadmin"
            ])
        )
    );

    admins.textContent = adminSnapshot.size;

}
