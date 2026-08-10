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

    const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("approved", true)
        .order("Created_at", {
            ascending: false
        });


    if (error) {

        console.error("NEWS ERROR:", error);

        newsContainer.innerHTML = `
            <div style="
                background:#ffe5e5;
                color:#b00020;
                padding:20px;
                border-radius:10px;
                margin:20px 0;
            ">
                <h3>News Database Error</h3>

                <p>${error.message}</p>

                <p>
                    <strong>Code:</strong>
                    ${error.code || "None"}
                </p>

                <p>
                    <strong>Details:</strong>
                    ${error.details || "None"}
                </p>

                <p>
                    <strong>Hint:</strong>
                    ${error.hint || "None"}
                </p>

            </div>
        `;

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


        // Title

        card.querySelector(".title").textContent =
            news.title || "Untitled News";


        // Author

        card.querySelector(".author").textContent =
            "Published by: " +
            (news.author || "News Room");


        // Content

        card.querySelector(".content").textContent =
            news.content || "";


        // Image

        const image =
            card.querySelector(".image");


        if (news.image) {

            image.src = news.image;
            image.style.display = "block";

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


                const { error } =
                    await supabase
                        .from("news")
                        .update({
                            likes: newLikes
                        })
                        .eq("id", news.id);


                if (error) {

                    console.error(error);

                    alert(
                        "Unable to like this news."
                    );

                    return;
                }


                alert(
                    "You liked this news. 👍"
                );


                loadNews();

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


                alert(
                    "Comment system will be connected next."
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
