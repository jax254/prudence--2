import { auth, db } from "./firebase.js";
import supabase from "./supabase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


/* =========================
   ELEMENTS
========================= */

const adminName =
    document.getElementById("adminName");

const adminRole =
    document.getElementById("adminRole");

const usersCount =
    document.getElementById("usersCount");

const newsCount =
    document.getElementById("newsCount");

const liveCount =
    document.getElementById("liveCount");

const pendingCount =
    document.getElementById("pendingCount");

const pendingNews =
    document.getElementById("pendingNews");

const notificationBadge =
    document.getElementById("notificationBadge");


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}


/* =========================
   LOAD UNREAD NOTIFICATIONS
========================= */

async function loadUnreadNotifications(userId) {

    if (!userId) {

        return;

    }


    const {
        count,
        error
    } = await supabase

        .from("notifications")

        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )

        .eq(
            "user_id",
            userId
        )

        .eq(
            "is_read",
            false
        );


    if (error) {

        console.error(
            "NOTIFICATION COUNT ERROR:",
            error
        );

        return;

    }


    const unread =
        count || 0;


    if (unread > 0) {

        notificationBadge.textContent =
            unread > 99
                ? "99+"
                : unread;

        notificationBadge.style.display =
            "inline-flex";

    }

    else {

        notificationBadge.style.display =
            "none";

    }

}


/* =========================
   LOAD DASHBOARD STATISTICS
========================= */

async function loadStatistics() {

    try {

        /* USERS */

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );

        usersCount.textContent =
            usersSnapshot.size;


        /* NEWS */

        const newsSnapshot =
            await getDocs(
                collection(
                    db,
                    "news"
                )
            );

        newsCount.textContent =
            newsSnapshot.size;


        /* LIVE */

        const liveSnapshot =
            await getDocs(
                collection(
                    db,
                    "liveStreams"
                )
            );

        liveCount.textContent =
            liveSnapshot.size;


        /* PENDING NEWS */

        const pendingSnapshot =
            await getDocs(

                query(

                    collection(
                        db,
                        "news"
                    ),

                    where(
                        "approved",
                        "==",
                        false
                    )

                )

            );


        pendingCount.textContent =
            pendingSnapshot.size;


    }

    catch (error) {

        console.error(
            "STATISTICS ERROR:",
            error
        );

        usersCount.textContent =
            "—";

        newsCount.textContent =
            "—";

        liveCount.textContent =
            "—";

        pendingCount.textContent =
            "—";

    }

}


/* =========================
   LOAD PENDING NEWS
========================= */

function loadPendingNews() {

    const q =
        query(

            collection(
                db,
                "news"
            ),

            where(
                "approved",
                "==",
                false
            )

        );


    onSnapshot(

        q,

        (snapshot) => {

            pendingNews.innerHTML =
                "";


            /* UPDATE PENDING COUNT */

            pendingCount.textContent =
                snapshot.size;


            if (snapshot.empty) {

                pendingNews.innerHTML = `

                    <div class="empty-pending">

                        <p>
                            ✅ No pending news.
                        </p>

                    </div>

                `;

                return;

            }


            snapshot.forEach(
                (document) => {

                    const news =
                        document.data();


                    const title =
                        escapeHtml(
                            news.title ||
                            "Untitled News"
                        );


                    const author =
                        escapeHtml(
                            news.author ||
                            "Unknown Author"
                        );


                    const content =
                        escapeHtml(
                            news.content ||
                            ""
                        );


                    const shortContent =
                        content.length > 200

                            ? content.substring(
                                0,
                                200
                            ) + "..."

                            : content;


                    pendingNews.innerHTML += `

                        <div
                            class="pending-news-item"
                        >

                            <h3>
                                ${title}
                            </h3>

                            <p>
                                <strong>
                                    Author:
                                </strong>
                                ${author}
                            </p>

                            <p>
                                ${shortContent}
                            </p>

                            <button
                                type="button"
                                onclick="
                                    location.href =
                                    'admin-approvals.html'
                                "
                            >
                                Review Article
                            </button>

                        </div>

                    `;

                }
            );

        },

        (error) => {

            console.error(
                "PENDING NEWS ERROR:",
                error
            );


            pendingNews.innerHTML = `

                <p>
                    Unable to load pending news.
                </p>

            `;

        }

    );

}


/* =========================
   CHECK ADMIN
========================= */

onAuthStateChanged(

    auth,

    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }


        try {

            /* GET USER PROFILE */

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnap =
                await getDoc(
                    userRef
                );


            if (!userSnap.exists()) {

                alert(
                    "Access denied."
                );

                window.location.href =
                    "index.html";

                return;

            }


            const data =
                userSnap.data();


            /* CHECK ROLE */

            const allowedRoles = [

                "admin",

                "newsroom",

                "superadmin"

            ];


            if (
                !allowedRoles.includes(
                    data.role
                )
            ) {

                alert(
                    "You are not authorized to access the Admin Panel."
                );

                window.location.href =
                    "index.html";

                return;

            }


            /* DISPLAY ADMIN */

            adminName.textContent =
                data.username ||
                user.email ||
                "Administrator";


            adminRole.textContent =
                (
                    data.role ||
                    "admin"
                ).toUpperCase();


            /* LOAD DASHBOARD */

            await loadStatistics();

            loadPendingNews();

            await loadUnreadNotifications(
                user.uid
            );

        }

        catch (error) {

            console.error(
                "ADMIN DASHBOARD ERROR:",
                error
            );

            alert(
                "Unable to load the Admin Dashboard."
            );

        }

    }

);


/* =========================
   LOGOUT
========================= */

window.logout =
async function () {

    try {

        await signOut(auth);

        window.location.href =
            "index.html";

    }

    catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

        alert(
            "Unable to logout. Please try again."
        );

    }

};
