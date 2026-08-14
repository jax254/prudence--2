import supabase from "./supabase.js";


const newsContainer =
    document.getElementById("newsContainer");

const newsTemplate =
    document.getElementById("newsTemplate");



/* =========================
   CHECK LOGIN
========================= */

const {
    data: { user },
    error: authError
} =
await supabase.auth.getUser();


if (authError || !user) {

    window.location.href =
        "login.html";

}



/* =========================
   LOAD PUBLISHED NEWS
========================= */

async function loadNews() {

    newsContainer.innerHTML =
        "<p>Loading news...</p>";


    const {
        data,
        error
    } =
    await supabase

        .from("news")

        .select("*")

        .eq(
            "approved",
            true
        )

        .eq(
            "status",
            "Published"
        )

        .order(
            "Created_at",
            {
                ascending: false
            }
        );


    /* =========================
       DATABASE ERROR
    ========================= */

    if (error) {

        console.error(
            "NEWS ERROR:",
            error
        );


        newsContainer.innerHTML = `

            <div class="news-error">

                <h3>
                    News Database Error
                </h3>

                <p>
                    ${error.message}
                </p>

                <p>
                    <strong>
                        Code:
                    </strong>

                    ${error.code || "None"}

                </p>

            </div>

        `;

        return;

    }


    newsContainer.innerHTML =
        "";


    /* =========================
       NO NEWS
    ========================= */

    if (
        !data ||
        data.length === 0
    ) {

        newsContainer.innerHTML = `

            <div class="empty-news">

                <h3>
                    No news available
                </h3>

                <p>
                    There are currently
                    no published articles.
                </p>

            </div>

        `;

        return;

    }



    /* =========================
       DISPLAY ARTICLES
    ========================= */

    data.forEach(
        news => {


            const card =
                newsTemplate
                    .content
                    .cloneNode(true);



            /* =====================
               TITLE
            ===================== */

            const title =
                card.querySelector(
                    ".title"
                );


            if (title) {

                title.textContent =
                    news.title ||
                    "Untitled News";

            }



            /* =====================
               AUTHOR
            ===================== */

            const author =
                card.querySelector(
                    ".author"
                );


            if (author) {

                author.textContent =
                    "Published by: " +
                    (
                        news.author ||
                        "Prudence 2 News Room"
                    );

            }



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
               ARTICLE CONTENT
            ===================== */

            const content =
                card.querySelector(
                    ".content"
                );


            if (content) {

                /*
                 * innerHTML is used because
                 * the News Room supports
                 * bold, italic, lists and links.
                 */

                content.innerHTML =
                    news.content ||
                    "";

            }



            /* =====================
               IMAGE
            ===================== */

            const image =
                card.querySelector(
                    ".image"
                );


            if (image) {

                if (news.image) {

                    image.src =
                        news.image;

                    image.style.display =
                        "block";

                }

                else {

                    image.style.display =
                        "none";

                }

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

                }

                else {

                    video.style.display =
                        "none";

                }

            }



            /* =====================
               LIKE
            ===================== */

            const likeButton =
                card.querySelector(
                    ".likeBtn"
                );


            if (likeButton) {

                likeButton.addEventListener(
                    "click",
                    async () => {


                        const newLikes =
                            (
                                news.likes ||
                                0
                            ) + 1;


                        const {
                            error
                        } =
                        await supabase

                            .from("news")

                            .update({
                                likes:
                                    newLikes
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
                                "Unable to like this news."
                            );

                            return;

                        }


                        likeButton.textContent =
                            `👍 Liked (${newLikes})`;

                    }
                );

            }



            /* =====================
               COMMENT
            ===================== */

            const commentButton =
                card.querySelector(
                    ".commentBtn"
                );


            if (commentButton) {

                commentButton.addEventListener(
                    "click",
                    () => {

                        const text =
                            prompt(
                                "Write your comment:"
                            );


                        if (
                            !text ||
                            !text.trim()
                        ) {

                            return;

                        }


                        alert(
                            "Comment system will be connected next."
                        );

                    }
                );

            }



            /* =====================
               SAVE
            ===================== */

            const saveButton =
                card.querySelector(
                    ".saveBtn"
                );


            if (saveButton) {

                saveButton.addEventListener(
                    "click",
                    () => {

                        alert(
                            "Save feature will be completed in the profile module."
                        );

                    }
                );

            }



            /* =====================
               SUBSCRIBE
            ===================== */

            const subscribeButton =
                card.querySelector(
                    ".subscribeBtn"
                );


            if (subscribeButton) {

                subscribeButton.addEventListener(
                    "click",
                    () => {

                        alert(
                            "You have subscribed to Christian News."
                        );

                    }
                );

            }



            /* =====================
               SHARE
            ===================== */

            const shareButton =
                card.querySelector(
                    ".shareBtn"
                );


            if (shareButton) {

                shareButton.addEventListener(
                    "click",
                    async () => {


                        try {

                            if (
                                navigator.share
                            ) {

                                await navigator.share({

                                    title:
                                        news.title,

                                    text:
                                        news.content,

                                    url:
                                        window.location.href

                                });

                            }

                            else {

                                await navigator
                                    .clipboard
                                    .writeText(
                                        window.location.href
                                    );

                                alert(
                                    "Link copied."
                                );

                            }

                        }

                        catch (error) {

                            console.log(
                                "Share cancelled."
                            );

                        }

                    }
                );

            }



            /* =====================
               ADD CARD
            ===================== */

            newsContainer.appendChild(
                card
            );

        }
    );

}



/* =========================
   START
========================= */

loadNews();
