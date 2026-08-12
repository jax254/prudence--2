import supabase from "./supabase.js";

const newsList = document.getElementById("newsList");
const template = document.getElementById("newsTemplate");

let currentUser = null;


/* =========================
   CHECK SUPER ADMIN LOGIN
========================= */

async function checkUser() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {

        window.location.href = "../login.html";

        return false;
    }

    currentUser = user;


    /* Get user's profile */

    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();


    if (profileError || !profile) {

        alert("Unable to verify your account.");

        window.location.href = "../dashboard.html";

        return false;
    }


    /* Check role */

    if (profile.role !== "superadmin") {

        alert("Access denied. Super Admin only.");

        window.location.href = "../dashboard.html";

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
        .eq("status", "Pending Approval")
        .order("Created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "APPROVAL ERROR:",
            error
        );

        newsList.innerHTML =
            "<p>Unable to load pending articles.</p>";

        return;
    }


    newsList.innerHTML = "";


    if (!data || data.length === 0) {

        newsList.innerHTML =
            "<h3>No pending news.</h3>";

        return;
    }


    data.forEach(news => {

        const card =
            template.content.cloneNode(true);


        /* TITLE */

        card.querySelector(
            ".title"
        ).textContent =
            news.title || "Untitled";


        /* AUTHOR */

        card.querySelector(
            ".author"
        ).textContent =
            "Author: " +
            (news.author || "Unknown");


        /* DATE */

        const dateElement =
            card.querySelector(".date");

        if (dateElement) {

            dateElement.textContent =
                news.Created_at
                    ?
                    new Date(
                        news.Created_at
                    ).toLocaleString()
                    :
                    "Just now";
        }


        /* CONTENT */

        const contentElement =
            card.querySelector(".content");

        contentElement.innerHTML =
            news.content || "";


        /* IMAGE */

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


        /* VIDEO */

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
                            "Approve this article for publication?"
                        );

                    if (!confirmed)
                        return;


                    const {
                        error
                    } =
                    await supabase
                        .from("news")
                        .update({

                            approved: true,

                            status: "Published",

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

                        alert(
                            "Unable to approve article:\n" +
                            error.message
                        );

                        return;
                    }


                    alert(
                        "News approved successfully."
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
                            "Reason for rejecting this article:"
                        );


                    if (
                        feedback === null
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

                            status: "Rejected",

                            feedback:
                                feedback,

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

                        alert(
                            "Unable to reject article:\n" +
                            error.message
                        );

                        return;
                    }


                    alert(
                        "News rejected."
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


                    if (!confirmed)
                        return;


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
                     * For now we open the
                     * Newsroom editor with
                     * the article ID.
                     */

                    window.location.href =
                        `admin-newsroom.html?edit=${news.id}`;
                };
        }


        newsList.appendChild(card);

    });
}


/* =========================
   START
========================= */

(async () => {

    const loggedIn =
        await checkUser();


    if (!loggedIn)
        return;


    await loadPendingNews();

})();
