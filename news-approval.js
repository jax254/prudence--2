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
        error
    } = await supabase.auth.getUser();


    if (error || !user) {

        window.location.href =
            "login.html";

        return false;

    }


    currentUser = user;


    /* Get profile */

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
        .single();


    if (profileError || !profile) {

        console.error(
            "PROFILE ERROR:",
            profileError
        );

        alert(
            "Unable to verify your account."
        );

        return false;

    }


    /* Check role */

    if (
        profile.role !==
        "superadmin"
    ) {

        alert(
            "Access denied. Super Admin only."
        );

        window.location.href =
            "dashboard.html";

        return false;

    }


    /* Check status */

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


    data.forEach(
        (news) => {

            const card =
                template.content
                    .cloneNode(true);


            /* =====================
               TITLE
            ===================== */

            card.querySelector(
                ".title"
            ).textContent =
                news.title ||
                "Untitled";


            /* =====================
               AUTHOR
            ===================== */

            card.querySelector(
                ".author"
            ).textContent =
                "Author: " +
                (
                    news.author ||
                    "News Room"
                );


            /* =====================
               DATE
            ===================== */

            const date =
                card.querySelector(
                    ".date"
                );


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

            card.querySelector(
                ".content"
            ).innerHTML =
                news.content ||
                "";


            /* =====================
               IMAGE
            ===================== */

            const image =
                card.querySelector(
                    ".image"
                );


            if (news.image) {

                image.src =
                    news.image;

                image.style.display =
                    "block";

            } else {

                image.style.display =
                    "none";

            }


            /* =====================
               VIDEO
            ===================== */

            const video =
                card.querySelector(
                    ".video"
                );


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


                    const {
                        error
                    } =
                    await supabase
                        .from("news")
                        .update({

                            approved: true,

                            status:
                                "Published",

                            approvedBy:
                                currentUser.email,

                            approvedAt:
                                new Date()
                                .toISOString()

                        })
                        .eq(
                            "id",
                            news.id
                        );


                    if (error) {

                        console.error(
                            error
                        );

                        alert(
                            "Unable to approve article:\n" +
                            error.message
                        );

                        return;

                    }


                    alert(
                        "News approved and published successfully."
                    );


                    loadPendingNews();

                };

            }


            /* =====================
               REJECT
            ===================== */

            const rejectButton =
                card.querySelector(
                    ".rejectBtn"
                );


            if (rejectButton) {

                rejectButton.onclick =
                async () => {

                    const feedback =
                        prompt(
                            "Why are you rejecting this article?"
                        );


                    if (
                        feedback ===
                        null
                    ) {

                        return;

                    }


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
                                feedback

                        })
                        .eq(
                            "id",
                            news.id
                        );


                    if (error) {

                        console.error(
                            error
                        );

                        alert(
                            "Unable to reject article:\n" +
                            error.message
                        );

                        return;

                    }


                    alert(
                        "News rejected successfully."
                    );


                    loadPendingNews();

                };

            }


            /* =====================
               DELETE
            ===================== */

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
                            error
                        );

                        alert(
                            "Unable to delete article:\n" +
                            error.message
                        );

                        return;

                    }


                    alert(
                        "Article deleted successfully."
                    );


                    loadPendingNews();

                };

            }


            /* =====================
               EDIT
            ===================== */

            const editButton =
                card.querySelector(
                    ".editBtn"
                );


            if (editButton) {

                editButton.onclick =
                () => {

                    /*
                       Save the article ID
                       so the Newsroom can
                       open this article.
                    */

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

        }
    );

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
