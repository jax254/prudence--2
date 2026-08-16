import supabase from "./supabase.js";


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

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value || "";

    return div.innerHTML;

}


/* =========================
   GET LOGGED-IN USER
========================= */

async function getLoggedInUser() {

    const {
        data: {
            user
        },
        error
    } =
    await supabase.auth.getUser();


    if (error) {

        console.error(
            "AUTH ERROR:",
            error
        );

        return null;

    }


    return user || null;

}


/* =========================
   LOAD PROFILE
========================= */

async function loadProfile(user) {

    const {
        data: profile,
        error
    } =
    await supabase
        .from("profiles")
        .select(
            "id, email, username, role, status"
        )
        .eq(
            "id",
            user.id
        )
        .maybeSingle();


    if (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        throw new Error(
            "Unable to load your profile:\n" +
            error.message
        );

    }


    if (!profile) {

        throw new Error(
            "Your profile was not found."
        );

    }


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

        throw new Error(
            "You are not authorized to access the Admin Panel."
        );

    }


    if (
        profile.status &&
        profile.status !== "active"
    ) {

        throw new Error(
            "Your administrator account is not active."
        );

    }


    adminName.textContent =
        profile.username ||
        profile.email ||
        user.email ||
        "Administrator";


    adminRole.textContent =
        (
            profile.role ||
            "admin"
        ).toUpperCase();


    return profile;

}


/* =========================
   USERS COUNT
========================= */

async function loadUsersCount() {

    const {
        count,
        error
    } =
    await supabase
        .from("profiles")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        );


    if (error) {

        console.error(
            "USERS COUNT ERROR:",
            error
        );

        usersCount.textContent =
            "—";

        return;

    }


    usersCount.textContent =
        count || 0;

}


/* =========================
   NEWS COUNT
========================= */

async function loadNewsCount() {

    const {
        count,
        error
    } =
    await supabase
        .from("news")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        );


    if (error) {

        console.error(
            "NEWS COUNT ERROR:",
            error
        );

        newsCount.textContent =
            "—";

        return;

    }


    newsCount.textContent =
        count || 0;

}


/* =========================
   PENDING COUNT
========================= */

async function loadPendingCount() {

    const {
        count,
        error
    } =
    await supabase
        .from("news")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "approved",
            false
        )
        .eq(
            "status",
            "Pending Approval"
        );


    if (error) {

        console.error(
            "PENDING COUNT ERROR:",
            error
        );

        pendingCount.textContent =
            "—";

        return;

    }


    pendingCount.textContent =
        count || 0;

}


/* =========================
   LIVE COUNT
========================= */

/*
   Firebase is completely removed.

   Until the Live module has been
   moved to Supabase, we show —.
*/

function loadLiveCount() {

    liveCount.textContent =
        "—";

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
            image,
            video,
            Created_at,
            status,
            approved
        `)
        .eq(
            "approved",
            false
        )
        .eq(
            "status",
            "Pending Approval"
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

            <div class="pending-news-item">

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


    if (
        !data ||
        data.length === 0
    ) {

        pendingNews.innerHTML = `

            <div class="empty-pending">

                <h3>
                    ✅ No pending news
                </h3>

                <p>
                    There are currently no
                    articles waiting for approval.
                </p>

            </div>

        `;

        return;

    }


    data.forEach(
        article => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "pending-news-item";


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
                    ?
                    content.substring(
                        0,
                        200
                    ) + "..."
                    :
                    content;


            const date =
                article.Created_at
                    ?
                    new Date(
                        article.Created_at
                    ).toLocaleString()
                    :
                    "Date unavailable";


            item.innerHTML = `

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

                <p>
                    <strong>
                        Status:
                    </strong>

                    ⏳ Pending Approval
                </p>

                <button
                    type="button"
                    class="review-button"
                >
                    Review Article
                </button>

            `;


            const reviewButton =
                item.querySelector(
                    ".review-button"
                );


            reviewButton.onclick =
            function () {

                localStorage.setItem(
                    "reviewNewsId",
                    article.id
                );


                window.location.href =
                    "admin-approvals.html";

            };


            pendingNews.appendChild(
                item
            );

        }
    );

}


/* =========================
   NOTIFICATIONS
========================= */

async function loadUnreadNotifications(
    userId
) {

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
   LOAD DASHBOARD
========================= */

async function loadDashboard(
    user
) {

    await loadProfile(
        user
    );


    await Promise.all([

        loadUsersCount(),

        loadNewsCount(),

        loadPendingCount(),

        loadPendingNews(),

        loadUnreadNotifications(
            user.id
        )

    ]);


    loadLiveCount();

}


/* =========================
   START DASHBOARD
========================= */

(async function () {

    try {

        const user =
            await getLoggedInUser();


        if (!user) {

            window.location.href =
                "../login.html";

            return;

        }


        await loadDashboard(
            user
        );

    }

    catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        alert(
            error.message
        );


        window.location.href =
            "../login.html";

    }

})();


/* =========================
   LOGOUT
========================= */

window.logout =
async function () {

    const {
        error
    } =
    await supabase.auth.signOut();


    if (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

        alert(
            "Unable to logout:\n" +
            error.message
        );

        return;

    }


    window.location.href =
        "../login.html";

};
    
