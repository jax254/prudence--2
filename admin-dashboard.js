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

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}


/* =========================
   CHECK CURRENT USER
========================= */

async function getCurrentUser() {

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
   LOAD ADMIN PROFILE
========================= */

async function loadAdminProfile(user) {

    const {
        data: profile,
        error
    } =
    await supabase
        .from("profiles")
        .select(
            "id, email, role, status, username"
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
            "Your profile could not be found."
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
   LOAD USER COUNT
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


    newsCount.textContent =
        articles.length;


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
   LOAD LIVE COUNT
========================= */

/*
 * Live broadcasts have not yet
 * been moved to Supabase in the
 * current project.
 *
 * We therefore do not query
 * Firebase here.
 */

async function loadLiveCount() {

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


    const articles =
        data || [];


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


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "pending-news-item";


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
                    ${escapeHtml(date)}
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
                >
                    Review Article
                </button>

            `;


            const reviewButton =
                item.querySelector(
                    ".review-button"
                );


            reviewButton.onclick =
            () => {

                /*
                 * Save the article ID.
                 * admin-approvals.html can
                 * use this later to open
                 * the specific article.
                 */

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
   LOAD NOTIFICATIONS
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

    await loadAdminProfile(
        user
    );


    await Promise.all([

        loadUsersCount(),

        loadNewsStatistics(),

        loadLiveCount(),

        loadPendingNews(),

        loadUnreadNotifications(
            user.id
        )

    ]);

}


/* =========================
   START
========================= */

(async function () {

    try {

        const user =
            await getCurrentUser();


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
            "ADMIN DASHBOARD ERROR:",
            error
        );


        alert(
            error.message
        );


        window.location.href =
            "../index.html";

    }

})();


/* =========================
   LOGOUT
========================= */

window.logout =
async function () {

    try {

        const {
            error
        } =
        await supabase.auth.signOut();


        if (error) {

            throw error;

        }


        window.location.href =
            "../login.html";

    }

    catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );


        alert(
            "Unable to logout:\n" +
            error.message
        );

    }

};
