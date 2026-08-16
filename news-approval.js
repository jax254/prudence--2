import supabase from "./supabase.js";


const newsList =
    document.getElementById("newsList");

const template =
    document.getElementById("newsTemplate");


let currentUser = null;


/* =========================
   CHECK SUPER ADMIN
========================= */

async function checkSuperAdmin() {

    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser();


    if (authError || !user) {

        window.location.href =
            "../login.html";

        return false;

    }


    currentUser = user;


    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select(
            "id, email, role, status, username"
        )
        .eq(
            "id",
            user.id
        )
        .maybeSingle();


    if (profileError) {

        console.error(
            "PROFILE ERROR:",
            profileError
        );

        alert(
            "Unable to verify your account:\n" +
            profileError.message
        );

        return false;

    }


    if (!profile) {

        alert(
            "Unable to verify your Super Admin profile."
        );

        return false;

    }


    if (
        profile.role !==
        "superadmin"
    ) {

        alert(
            "Access denied.\n\n" +
            "This account is not a Super Admin."
        );

        window.location.href =
            "../dashboard.html";

        return false;

    }


    if (
        profile.status &&
        profile.status !==
        "active"
    ) {

        alert(
            "Your Super Admin account is not active."
        );

        return false;

    }


    return true;

}
/* =========================
   CREATE NOTIFICATION
========================= */

async function createNotification({
    userId,
    title,
    message,
    type,
    articleId
}) {

    const { error } = await supabase
        .from("notifications")
        .insert({
            user_id: userId,
            title: title,
            message: message,
            type: type,
            article_id: articleId,
            is_read: false
        });

    if (error) {

        console.error(
            "NOTIFICATION ERROR:",
            error
        );

        throw error;
    }

}

/* =========================
   LOAD PENDING NEWS
========================= */

async function loadPendingNews() {

    newsList.innerHTML =
        "<p>Loading pending articles...</p>";


    const {
        data,
        error
    } = await supabase
        .from("news")
        .select("*")
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
            "NEWS LOAD ERROR:",
            error
        );


        newsList.innerHTML = `

            <div class="error-box">

                <h3>
                    Unable to load pending news
                </h3>

                <p>
                    ${error.message}
                </p>

                <p>
                    Code:
                    ${error.code || "None"}
                </p>

            </div>

        `;

        return;

    }


    newsList.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        newsList.innerHTML = `

            <div class="empty-state">

                <h3>
                    No pending news.
                </h3>

                <p>
                    There are currently no
                    articles waiting for approval.
                </p>

            </div>

        `;

        return;

    }


    data.forEach(news => {

        const card =
            template.content.cloneNode(true);


        /* =====================
           TITLE
        ===================== */

        const title =
            card.querySelector(".title");

        if (title) {

            title.textContent =
                news.title ||
                "Untitled";

        }


        /* =====================
           AUTHOR
        ===================== */

        const author =
            card.querySelector(".author");

        if (author) {

            author.textContent =
                "Author: " +
                (
                    news.author ||
                    "News Room"
                );

        }


        /* =====================
           DATE
        ===================== */

        const date =
            card.querySelector(".date");


        if (date) {

            date.textContent =
                news.Created_at
                    ?
                    new Date(
                        news.Created_at
                    ).toLocaleString()
                    :
                    "Date unavailable";

        }


        /* =====================
           CONTENT
        ===================== */

        const content =
            card.querySelector(".content");


        if (content) {

            content.innerHTML =
                news.content ||
                "";

        }


        /* =====================
           IMAGE
        ===================== */

        const image =
            card.querySelector(".image");


        if (image) {

            if (news.image) {

                image.src =
                    news.image;

                image.style.display =
                    "block";

            } else {

                image.style.display =
                    "none";

            }

        }


        /* =====================
           VIDEO
        ===================== */

        const video =
            card.querySelector(".video");


        if (video) {

            if (news.video) {

                video.src =
                    news.video;

                video.style.display =
                    "block";

            } else {

                video.style.display =
                    "none";

            }

        }


        /* =====================
           APPROVE
        ===================== */

        const approveButton =
            card.querySelector(
                ".approveBtn"
            );


        if (approveButton) {

            approveButton.onclick =
            async () => {

                const confirmed =
                    confirm(
                        "Approve this article and publish it?"
                    );


                if (!confirmed) {

                    return;

                }


                approveButton.disabled =
                    true;


                const {
                    error
                } =
                await supabase
                    .from("news")
                    .update({

                        approved: true,

                        status:
                            "Published"

                    })
                    .eq(
                        "id",
                        news.id
                    );


                if (error) {

                    console.error(
                        "APPROVAL ERROR:",
                        error
                    );

                    approveButton.disabled =
                        false;

                    alert(
                        "Unable to approve article:\n" +
                        error.message
                    );

                    return;

                }
                
                await createNotification({
    userId: news.uid,

    title: "✅ Article Approved",

    message:
        `Your article "${news.title}" has been approved and published by the Superadmin.`,

    type: "article_approved",

    articleId: news.id
});
                alert(
                    "News approved and published successfully."
                );


                await loadPendingNews();

            };

        }



        /* =========================
   REJECT
========================= */

const rejectButton =
    card.querySelector(".rejectBtn");

if (rejectButton) {

    rejectButton.onclick =
    async () => {

        const feedback =
            prompt(
                "Why are you rejecting this article?\n\nPlease give the author helpful feedback:"
            );

        if (
            feedback === null
        ) {
            return;
        }

        if (
            !feedback.trim()
        ) {

            alert(
                "Please provide a reason for rejecting the article."
            );

            return;

        }

        rejectButton.disabled =
            true;


        const {
            error
        } =
        await supabase
            .from("news")
            .update({

                approved: false,

                status:
                    "Rejected",

                feedback:
                    feedback.trim()

            })
            .eq(
                "id",
                news.id
            );


        if (error) {

            console.error(
                "REJECTION ERROR:",
                error
            );

            rejectButton.disabled =
                false;

            alert(
                "Unable to reject article:\n" +
                error.message
            );

            return;

        }


        alert(
            "Article rejected and feedback sent to the author."
        );


        await loadPendingNews();

    };

}


        /* =========================
           DELETE
        ========================= */

        const deleteButton =
            card.querySelector(
                ".deleteBtn"
            );


        if (deleteButton) {

            deleteButton.onclick =
            async () => {

                const confirmed =
                    confirm(
                        "Are you sure you want to permanently delete this article?"
                    );


                if (!confirmed) {

                    return;

                }


                deleteButton.disabled =
                    true;


                const {
                    error
                } =
                await supabase
                    .from("news")
                    .delete()
                    .eq(
                        "id",
                        news.id
                    );


                if (error) {

                    console.error(
                        "DELETE ERROR:",
                        error
                    );

                    deleteButton.disabled =
                        false;

                    alert(
                        "Unable to delete article:\n" +
                        error.message
                    );

                    return;

                }


                alert(
                    "Article deleted successfully."
                );


                await loadPendingNews();

            };

        }


        /* =========================
           EDIT
        ========================= */

        const editButton =
            card.querySelector(
                ".editBtn"
            );


        if (editButton) {

            editButton.onclick =
            () => {

                localStorage.setItem(
                    "editNewsId",
                    news.id
                );


                window.location.href =
                    "admin-newsroom.html";

            };

        }


        newsList.appendChild(
            card
        );

    });

}


/* =========================
   START
========================= */

(async () => {

    const verified =
        await checkSuperAdmin();


    if (!verified) {

        return;

    }


    await loadPendingNews();

})();
        
