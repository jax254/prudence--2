import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const notificationList = document.getElementById("notificationList");

let currentUser = null;

// Check Authentication
onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    loadNotifications();

});

// Load Notifications
function loadNotifications() {

    const q = query(

        collection(db, "notifications"),

        where("uid", "==", currentUser.uid),

        orderBy("createdAt", "desc")

    );

    onSnapshot(q, async (snapshot) => {

        notificationList.innerHTML = "";

        if (snapshot.empty) {

            notificationList.innerHTML =
                "<p>No notifications available.</p>";

            return;

        }

        snapshot.forEach((item) => {

            const notification = item.data();

            notificationList.innerHTML += `

            <div class="notification">

                <h3>${notification.title}</h3>

                <p>${notification.message}</p>

                <small>

                    ${
                        notification.createdAt
                        ?
                        notification.createdAt
                        .toDate()
                        .toLocaleString()
                        :
                        "Just now"
                    }

                </small>

            </div>

            `;

            // Mark as read
            updateDoc(doc(db, "notifications", item.id), {

                read: true

            });

        });

    });

}
