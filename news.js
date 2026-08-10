 import supabase from "./supabase.js";

const newsContainer = document.getElementById("newsContainer");
const newsTemplate = document.getElementById("newsTemplate");


// =========================
// CHECK LOGIN
// =========================

const {
    data: { user },
    error: authError
} = await supabase.auth.getUser();

if (authError || !user) {

    window.location.href = "login.html";

}


// =========================
// LOAD NEWS
// =========================

async function loadNews() {

    const { data: newsList, error } = await supabase
        .from("news")
        .select("*")
        .eq("approved", true)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        newsContainer.innerHTML =
            "<p>Unable to load news.</p>";

        return;

    }


    newsContainer.innerHTML = "";


    if (!newsList || newsList.length === 0) {

        newsContainer.innerHTML =
            "<p>No news available.</p>";

        return;

    }


    newsList.forEach((news) => {

        const card =
            newsTemplate.content.cloneNode(true);


        // =========================
        // NEWS INFORMATION
        // =========================

        card.querySelector(".title").textContent =
            news.title || "Untitled News";


        card.querySelector(".author").textContent =
            "Published by: " +
            (news.author || "News Room");


        card.querySelector(".content").textContent =
            news.content || "";


        // =========================
        // IMAGE
        // =========================

        const image =
            card.querySelector(".image");


        if (news.image) {

            image.src = news.image;

        } else {

            image.style.display = "none";

        }


        // =========================
        // LIKE
        // =========================

        card.querySelector(".likeBtn")
            .addEventListener("click", async () => {

                const newLikes =
                    (news.likes || 0) + 1;


                const { error } = await supabase
                    .from("news")
                    .update({
                        likes: newLikes
                    })
                    .eq("id", news.id);


                if (error) {

                    console.error(error);

                    alert("Unable to like this news.");

                    return;

                }


                news.likes = newLikes;


                alert(
                    "You liked this news. 👍"
                );

            });


        // =========================
        // COMMENT
        // =========================

        card.querySelector(".commentBtn")
            .addEventListener("click", async () => {

                const text =
                    prompt("Write your comment");


                if (!text || !text.trim()) {

                    return;

                }


                const { error } = await supabase
                    .from("news_comments")
                    .insert({

                        news_id: news.id,

                        user_id: user.id,

                        comment: text.trim()

                    });


                if (error) {

                    console.error(error);

                    alert(
                        "Unable to post comment."
                    );

                    return;

                }


                alert(
                    "Comment posted successfully."
                );

            });


        // =========================
        // SAVE
        // =========================

        card.querySelector(".saveBtn")
            .addEventListener("click", () => {

                alert(
                    "Save feature will be completed in the profile module."
                );

            });


        // =========================
        // SUBSCRIBE
        // =========================

        card.querySelector(".subscribeBtn")
            .addEventListener("click", () => {

                alert(
                    "You have subscribed to Christian News."
                );

            });


        // =========================
        // SHARE
        // =========================

        card.querySelector(".shareBtn")
            .addEventListener("click", async () => {

                try {

                    if (navigator.share) {

                        await navigator.share({

                            title:
                                news.title,

                            text:
                                news.content,

                            url:
                                window.location.href

                        });

                    } else {

                        await navigator.clipboard.writeText(
                            window.location.href
                        );

                        alert(
                            "Link copied."
                        );

                    }

                } catch (error) {

                    console.log(
                        "Share cancelled."
                    );

                }

            });


        newsContainer.appendChild(card);

    });

}


// =========================
// START
// =========================

loadNews();       
        
