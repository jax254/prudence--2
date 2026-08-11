import supabase from "./supabase.js";

const form = document.getElementById("newsForm");
const myArticles = document.getElementById("myArticles");
const template = document.getElementById("articleTemplate");

let currentUser = null;


// =========================
// CHECK LOGIN
// =========================

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

    return true;
}


// =========================
// SUBMIT NEWS
// =========================

form.addEventListener("submit", async (e) => {

    e.preventDefault();


    if (!currentUser) {

        const loggedIn =
            await checkUser();

        if (!loggedIn) return;

    }


    const title =
        document.getElementById("title")
        .value
        .trim();


    const content =
        document.getElementById("content")
        .value
        .trim();


    const image =
        document.getElementById("image")
        .value
        .trim();


    const video =
        document.getElementById("video")
        .value
        .trim();


    if (!title || !content) {

        alert(
            "Please enter a news title and article content."
        );

        return;

    }


    try {

        const { error } =
            await supabase
                .from("news")
                .insert({

                    title: title,

                    content: content,

                    image: image || null,

                    video: video || null,

                    author:
                        currentUser.email,

                    uid:
                        currentUser.id,

                    approved: false,

                    status:
                        "Pending Approval",

                    likes: 0

                });


        if (error) {

            console.error(
                "NEWSROOM ERROR:",
                error
            );

            alert(
                "Unable to submit news: " +
                error.message
            );

            return;

        }


        alert(
            "News submitted successfully for approval."
        );


        form.reset();


        loadArticles();

    }

    catch (error) {

        console.error(error);

        alert(
            "Something went wrong while submitting the article."
        );

    }

});


// =========================
// LOAD MY ARTICLES
// =========================

async function loadArticles() {

    if (!currentUser) return;


    const { data, error } =
        await supabase
            .from("news")
            .select("*")
            .eq("uid", currentUser.id)
            .order("Created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "LOAD ARTICLES ERROR:",
            error
        );

        myArticles.innerHTML =
            "<p>Unable to load your articles.</p>";

        return;

    }


    myArticles.innerHTML = "";


    if (!data || data.length === 0) {

        myArticles.innerHTML =
            "<p>No submitted articles.</p>";

        return;

    }


    data.forEach((news) => {

        const card =
            template.content.cloneNode(true);


        card.querySelector(
            ".articleTitle"
        ).textContent =
            news.title || "Untitled";


        card.querySelector(
            ".articleStatus"
        ).textContent =
            news.status ||
            (
                news.approved
                    ? "Approved"
                    : "Pending Approval"
            );


        card.querySelector(
            ".articleDate"
        ).textContent =
            news.Created_at
                ? new Date(
                    news.Created_at
                ).toLocaleString()
                : "Just now";


        card.querySelector(
            ".editButton"
        ).addEventListener(
            "click",
            () => {

                alert(
                    "Editing will be enabled in the next version."
                );

            }
        );


        myArticles.appendChild(card);

    });

}


// =========================
// START
// =========================

(async () => {

    const loggedIn =
        await checkUser();

    if (!loggedIn) return;

    await loadArticles();

})();
    
