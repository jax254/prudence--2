import supabase from "./supabase.js";

const newsList =
    document.getElementById("newsList");

const template =
    document.getElementById("newsTemplate");

let currentUser = null;


// =========================
// CHECK SUPER ADMIN
// =========================

async function checkUser() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();


    if (error || !user) {

        window.location.href =
            "../login.html";

        return false;

    }


    currentUser = user;


    // Check profile/role
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

        window.location.href =
            "../dashboard.html";

        return false;

    }


    if (profile.role !== "superadmin") {

        alert(
            "Only the Super Admin can access the News Approval Center."
        );

        window.location.href =
            "../dashboard.html";

        return false;

    }


    return true;

}


// =========================
// LOAD PENDING NEWS
// =========================

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
        .eq("approved", false)
        .order("Created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "APPROVAL LOAD ERROR:",
            error
        );

        newsList.innerHTML = `
            <div class="error-box">
                <h3>Unable to load news</h3>
                <p>${error.message}</p>
            </div>
        `;

        return;

    }


    newsList.innerHTML = "";


    if (!data || data.length === 0) {

        newsList.innerHTML = `
            <div class="empty-box">
                <h3>✅ No pending news</h3>
                <p>There are currently no articles waiting for approval.</p>
            </div>
        `;

        return;

    }


    data.forEach(news => {

        const card =
            template.content.cloneNode(true);


        // =========================
        // TEXT
        // =========================

        card.querySelector(".title")
            .textContent =
            news.title || "Untitled";


        card.querySelector(".author")
            .textContent =
            "Author: " +
            (news.author || "Unknown");


        card.querySelector(".date")
            .textContent =
            news.Created_at
                ? new Date(
                    news.Created_at
                ).toLocaleString()
                : "Just now";


        card.querySelector(".content")
            .innerHTML =
            news.content || "";


        // =========================
        // IMAGE
        // =========================

        const image =
            card.querySelector(".image");


        if (news.image) {

            image.src =
                news.image;

            image.style.display =
                "block";

        } else {

            image.style.display =
                "none";

        }


        // =========================
        // VIDEO
        // =========================

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


        // =========================
        // FEEDBACK
        // =========================

        const feedback =
            card.querySelector(".feedback");


        // =========================
        // APPROVE
        // =========================

        card.querySelector(".approveBtn")
            .addEventListener(
                "click",
                async () => {

                    const message =
                        feedback
                            ? feedback.value.trim()
                            : "";


                    const {
                        error
                    } = await supabase
                        .from("news")
                        .update({

                            approved: true,

                            status:
                                "Published",

                            feedback:
                                message || null,

                            approvedBy:
                                currentUser.email,

                            approvedAt:
                                new Date().toISOString()

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


                    await logAction(
                        "Approved news: " +
                        news.title
                    );


                    alert(
                        "News approved and published successfully."
                    );


                    loadPendingNews();

                }
            );


        // =========================
        // REJECT
        // =========================

        card.querySelector(".rejectBtn")
            .addEventListener(
                "click",
                async () => {

                    const message =
                        feedback
                            ? feedback.value.trim()
                            : "";


                    const {
                        error
                    } = await supabase
                        .from("news")
                        .update({

                            approved: false,

                            status:
                                "Rejected",

                            feedback:
                                message || null,

                            approvedBy:
                                currentUser.email,

                            approvedAt:
                                new Date().toISOString()

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


                    await logAction(
                        "Rejected news: " +
                        news.title
                    );


                    alert(
                        "News rejected."
                    );


                    loadPendingNews();

                }
            );


        // =========================
        // DELETE
        // =========================

        card.querySelector(".deleteBtn")
            .addEventListener(
                "click",
                async () => {

                    const confirmed =
                        confirm(
                            "Are you sure you want to permanently delete this article?"
                        );


                    if (!confirmed) return;


                    const {
                        error
                    } = await supabase
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


                    await logAction(
                        "Deleted news: " +
                        news.title
                    );


                    alert(
                        "Article deleted successfully."
                    );


                    loadPendingNews();

                }
            );


        // =========================
        // EDIT
        // =========================

        card.querySelector(".editBtn")
            .addEventListener(
                "click",
                () => {

                    localStorage.setItem(
                        "editNewsId",
                        news.id
                    );


                    window.location.href =
                        "admin-newsroom.html";

                }
            );


        newsList.appendChild(card);

    });

}


// =========================
// ADMIN LOG
// =========================

async function logAction(action) {

    const {
        error
    } = await supabase
        .from("adminLogs")
        .insert({

            admin:
                currentUser.id,

            action:
                action

        });


    if (error) {

        console.error(
            "ADMIN LOG ERROR:",
            error
        );

    }

}


// =========================
// START
// =========================

(async () => {

    const allowed =
        await checkUser();


    if (!allowed) return;


    await loadPendingNews();

})();            
                
