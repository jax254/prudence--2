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
    getDocs
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
    document.getElementById(
        "notificationBadge"
    );


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
   LOAD NOTIFICATIONS
========================= */

async function loadUnreadNotifications(userId) {

    if (!userId) {

        return;

    }


    const {
        count,
        error
    } =
    await supabase
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
            "NOTIFICATION ERROR:",
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
   LOAD NEWS STATISTICS
========================= */

async function loadNewsStatistics() {

    const {
        data,
        error
    } =
    await supabase
        .from("news")
        .select(
            "id, approved, status"
        );


    if (error) {

        console.error(
            "NEWS STATISTICS ERROR:",
            error
        );

        newsCount.textContent =
            "—";

        pendingCount.textContent =
            "—";

        return;

    }


    const articles =
        data || [];


    /* TOTAL NEWS */

    newsCount.textContent =
        articles.length;


    /* PENDING */

    const pending =
        articles.filter(
            article =>
                article.status ===
                "Pending Approval" &&
                article.approved === false
        );


    pendingCount.textContent =
        pending.length;

}


/* =========================
   LOAD PENDING NEWS
========================= */

async function loadPendingNews() {

    pendingNews.innerHTML = `

        <p>
            Loading pending news...
        </p>

    `;


    const {
        data,
        error
    } =
    await supabase

        .from("news")

        .select(`
            id,
            title,
            author,
            content,
            Created_at,
            status,
            approved
        `)

        .eq(
            "status",
            "Pending Approval"
        )

        .eq(
            "approved",
            false
        )

        .order(
            "Created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "PENDING NEWS ERROR:",
            error
        );


        pendingNews.innerHTML = `

            <div class="error-box">

                <h3>
                    Unable to load pending news
                </h3>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>

        `;

        return;

    }


    pendingNews.innerHTML =
        "";


    const articles =
        data || [];


    /* UPDATE COUNT */

    pendingCount.textContent =
        articles.length;


    if (
        articles.length === 0
    ) {

        pendingNews.innerHTML = `

            <div class="empty-pending">

                <p>
                    ✅ No pending news.
                </p>

                <p>
                    There are currently no
                    articles waiting for approval.
                </p>

            </div>

        `;

        return;

    }


    articles.forEach(
        article => {

            const title =
                escapeHtml(
                    article.title ||
                    "Untitled News"
                );


            const author =
                escapeHtml(
                    article.author ||
                    "News Room"
                );


            const content =
                escapeHtml(
                    article.content ||
                    ""
                );


            const shortContent =
                content.length > 200

                    ? content.substring(
                        0,
                        200
                    ) + "..."

                    : content;


            const date =
                article.Created_at
                    ?
                    new Date(
                        article.Created_at
                    ).toLocaleString()
                    :
                    "Date unavailable";


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
                        <strong>
                            Submitted:
                        </strong>

                        ${escapeHtml(
                            date
                        )}
                    </p>


                    <p>
                        ${shortContent}
                    </p>


                    <span
                        class="pending-status"
                    >
                        ⏳ Pending Approval
                    </span>


                    <br><br>


                    <button
                        type="button"
                        class="review-button"
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

}


/* =========================
   LOAD USERS
========================= */

async function loadUsersCount() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        usersCount.textContent =
            snapshot.size;

    }

    catch (error) {

        console.error(
            "USERS ERROR:",
            error
        );

        usersCount.textContent =
            "—";

    }

}


/* =========================
   LOAD LIVE BROADCASTS
========================= */

async function loadLiveCount() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "liveStreams"
                )
            );


        liveCount.textContent =
            snapshot.size;

    }

    catch (error) {

        console.error(
            "LIVE ERROR:",
            error
        );

        liveCount.textContent =
            "—";

    }

}


/* =========================
   LOAD EVERYTHING
========================= */

async function loadDashboard(userId) {

    await Promise.all([

        loadUsersCount(),

        loadLiveCount(),

        loadNewsStatistics(),

        loadPendingNews(),

        loadUnreadNotifications(
            userId
        )

    ]);

}


/* =========================
   CHECK ADMIN LOGIN
========================= */

onAuthStateChanged(

    auth,

    async user => {

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }


        try {

            /* =====================
               LOAD FIREBASE PROFILE
            ===================== */

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


            if (
                !userSnap.exists()
            ) {

                alert(
                    "Access denied."
                );

                window.location.href =
                    "index.html";

                return;

            }


            const profile =
                userSnap.data();


            /* =====================
               CHECK ROLE
            ===================== */

            const allowedRoles = [

                "admin",

                "newsroom",

                "superadmin"

            ];


            if (
                !allowedRoles.includes(
                    profile.role
                )
            ) {

                alert(
                    "You are not authorized to access the Admin Panel."
                );

                window.location.href =
                    "index.html";

                return;

            }


            /* =====================
               DISPLAY PROFILE
            ===================== */

            adminName.textContent =
                profile.username ||
                user.email ||
                "Administrator";


            adminRole.textContent =
                (
                    profile.role ||
                    "admin"
                ).toUpperCase();


            /* =====================
               LOAD DASHBOARD
            ===================== */

            await loadDashboard(
                user.uid
            );


        }

        catch (error) {

            console.error(
                "ADMIN DASHBOARD ERROR:",
                error
            );


            alert(
                "Unable to load the Admin Dashboard.\n\n" +
                error.message
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
