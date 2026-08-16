import supabase from "./supabase.js";


const notificationsList =
    document.getElementById(
        "notificationsList"
    );


const notificationTemplate =
    document.getElementById(
        "notificationTemplate"
    );


const notificationSummary =
    document.getElementById(
        "notificationSummary"
    );


const markAllReadBtn =
    document.getElementById(
        "markAllReadBtn"
    );


let currentUser = null;



/* =========================
   CHECK LOGIN
========================= */

async function checkLogin() {

    const {
        data: { user },
        error
    } =
    await supabase.auth.getUser();


    if (
        error ||
        !user
    ) {

        window.location.href =
            "login.html";

        return false;

    }


    currentUser =
        user;

    return true;

}



/* =========================
   GET NOTIFICATION ICON
========================= */

function getNotificationIcon(type) {

    switch (type) {

        case "article_approved":

            return "✅";


        case "article_rejected":

            return "❌";


        case "comment":

            return "💬";


        case "announcement":

            return "📢";


        case "account":

            return "👤";


        default:

            return "🔔";

    }

}



/* =========================
   LOAD NOTIFICATIONS
========================= */

async function loadNotifications() {

    notificationsList.innerHTML = `
        <div class="loading">
            Loading notifications...
        </div>
    `;


    const {
        data,
        error
    } =
    await supabase
        .from("notifications")
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "NOTIFICATION ERROR:",
            error
        );


        notificationsList.innerHTML = `

            <div class="empty-state">

                <h3>
                    Unable to load notifications
                </h3>

                <p>
                    ${error.message}
                </p>

            </div>

        `;

        return;

    }


    notificationsList.innerHTML =
        "";


    if (
        !data ||
        data.length === 0
    ) {

        notificationSummary.textContent =
            "You have no notifications yet.";


        notificationsList.innerHTML = `

            <div class="empty-state">

                <h3>
                    🔔 No Notifications
                </h3>

                <p>
                    You're all caught up!
                </p>

            </div>

        `;

        return;

    }



    /* =========================
       COUNT UNREAD
    ========================= */

    const unreadCount =
        data.filter(
            notification =>
                !notification.is_read
        ).length;


    if (
        unreadCount === 0
    ) {

        notificationSummary.textContent =
            "You're all caught up.";

    }
    else {

        notificationSummary.textContent =
            `${unreadCount} unread notification${
                unreadCount === 1
                    ? ""
                    : "s"
            }.`;

    }



    /* =========================
       BUILD CARDS
    ========================= */

    data.forEach(
        notification => {

            const card =
                notificationTemplate
                    .content
                    .cloneNode(true);


            const article =
                card.querySelector(
                    ".notification-card"
                );


            const icon =
                card.querySelector(
                    ".notification-icon"
                );


            const title =
                card.querySelector(
                    ".notification-title"
                );


            const message =
                card.querySelector(
                    ".notification-message"
                );


            const date =
                card.querySelector(
                    ".notification-date"
                );


            const unreadBadge =
                card.querySelector(
                    ".unread-badge"
                );


            const markReadBtn =
                card.querySelector(
                    ".mark-read-btn"
                );


            const deleteBtn =
                card.querySelector(
                    ".delete-notification-btn"
                );



            /* ICON */

            icon.textContent =
                getNotificationIcon(
                    notification.type
                );



            /* TITLE */

            title.textContent =
                notification.title ||
                "Notification";



            /* MESSAGE */

            message.textContent =
                notification.message ||
                "";



            /* DATE */

            date.textContent =
                notification.created_at
                    ?
                    new Date(
                        notification.created_at
                    ).toLocaleString()
                    :
                    "Date unavailable";



            /* UNREAD */

            if (
                !notification.is_read
            ) {

                article.classList.add(
                    "unread"
                );

            }
            else {

                article.classList.add(
                    "read"
                );

            }



            /* =====================
               MARK READ
            ===================== */

            markReadBtn.onclick =
            async () => {

                const {
                    error
                } =
                await supabase
                    .from(
                        "notifications"
                    )
                    .update({
                        is_read: true
                    })
                    .eq(
                        "id",
                        notification.id
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    );


                if (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Unable to mark notification as read."
                    );

                    return;

                }


                await loadNotifications();

            };



            /* =====================
               DELETE
            ===================== */

            deleteBtn.onclick =
            async () => {

                const confirmed =
                    confirm(
                        "Delete this notification?"
                    );


                if (
                    !confirmed
                ) {

                    return;

                }


                const {
                    error
                } =
                await supabase
                    .from(
                        "notifications"
                    )
                    .delete()
                    .eq(
                        "id",
                        notification.id
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    );


                if (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Unable to delete notification."
                    );

                    return;

                }


                await loadNotifications();

            };



            /* =====================
               ADD CARD
            ===================== */

            notificationsList.appendChild(
                card
            );

        }
    );

}



/* =========================
   MARK ALL AS READ
========================= */

markAllReadBtn.onclick =
async () => {

    const {
        error
    } =
    await supabase
        .from("notifications")
        .update({

            is_read: true

        })
        .eq(
            "user_id",
            currentUser.id
        )
        .eq(
            "is_read",
            false
        );


    if (error) {

        console.error(
            error
        );

        alert(
            "Unable to mark notifications as read."
        );

        return;

    }


    await loadNotifications();

};



/* =========================
   START
========================= */

(async () => {

    const loggedIn =
        await checkLogin();


    if (!loggedIn) {

        return;

    }


    await loadNotifications();

})();
