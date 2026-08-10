import supabase from "./supabase.js";

const newsContainer = document.getElementById("newsContainer");
const newsTemplate = document.getElementById("newsTemplate");

async function loadNews() {

    const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("News error:", error);

        newsContainer.innerHTML =
            "<p>Unable to load news.</p>";

        return;
    }

    newsContainer.innerHTML = "";

    if (!data || data.length === 0) {

        newsContainer.innerHTML =
            "<p>No news available.</p>";

        return;
    }

    data.forEach((news) => {

        const card =
            newsTemplate.content.cloneNode(true);

        card.querySelector(".title").textContent =
            news.title || "";

        card.querySelector(".author").textContent =
            "Published by: " +
            (news.author || "News Room");

        card.querySelector(".content").textContent =
            news.content || "";

        const image =
            card.querySelector(".image");

        if (news.image) {

            image.src = news.image;
            image.style.display = "block";

        } else {

            image.style.display = "none";

        }

        // Like
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

                alert("You liked this news.");

                loadNews();

            });


        // Comment
        card.querySelector(".commentBtn")
            .addEventListener("click", async () => {

                const text =
                    prompt("Write your comment");

                if (!text || !text.trim()) return;

                const { error } = await supabase
                    .from("newsComments")
                    .insert({
                        news_id: news.id,
                        comment: text.trim()
                    });

                if (error) {

                    console.error(error);
                    alert("Unable to post comment.");

                    return;
                }

                alert("Comment posted.");

            });


        // Save
        card.querySelector(".saveBtn")
            .addEventListener("click", () => {

                alert(
                    "Saved feature will be completed in the profile module."
                );

            });


        // Subscribe
        card.querySelector(".subscribeBtn")
            .addEventListener("click", () => {

                alert(
                    "You have subscribed to Christian News."
                );

            });


        // Share
        card.querySelector(".shareBtn")
            .addEventListener("click", async () => {

                if (navigator.share) {

                    await navigator.share({

                        title: news.title,

                        text: news.content,

                        url: window.location.href

                    });

                } else {

                    await navigator.clipboard.writeText(
                        window.location.href
                    );

                    alert("Link copied.");

                }

            });


        newsContainer.appendChild(card);

    });

}

loadNews();                    
