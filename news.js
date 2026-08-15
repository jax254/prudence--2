import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const newsContainer =
    document.getElementById("newsContainer");

const newsTemplate =
    document.getElementById("newsTemplate");

const subscriberCount =
    document.getElementById("subscriberCount");


let currentUser = null;


/* =========================
   CHECK LOGIN
========================= */

async function checkLogin() {

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

    return true;

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}


/* =========================
   RECORD ONE VIEW
========================= */

async function recordView(newsId) {

    if (!currentUser) {
        return;
    }


    const {
        error
    } = await supabase
        .from("news_views")
        .insert({

            news_id:
                newsId,

            user_id:
                currentUser.id

        });


    /*
     * 23505 means the user has
     * already viewed this article.
     *
     * We deliberately ignore it.
     */

    if (error) {

        if (error.code !== "23505") {

            console.error(
                "VIEW ERROR:",
                error
            );

        }

    }

}


/* =========================
   GET VIEW COUNT
========================= */

async function getViewCount(newsId) {

    const {
        count,
        error
    } = await supabase
        .from("news_views")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "news_id",
            newsId
        );


    if (error) {

        console.error(
            "VIEW COUNT ERROR:",
            error
        );

        return 0;

    }


    return count || 0;

}


/* =========================
   LOAD SUBSCRIBER COUNT
========================= */

async function loadSubscriberCount() {

    const {
        count,
        error
    } = await supabase
        .from("news_subscriptions")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        );


    if (error) {

        console.error(
            "SUBSCRIBER ERROR:",
            error
        );

        subscriberCount.textContent =
            "0";

        return;

    }


    subscriberCount.textContent =
        count || 0;

}


/* =========================
   CHECK SUBSCRIPTION
========================= */

async function isSubscribed() {

    if (!currentUser) {
        return false;
    }


    const {
        data,
        error
    } = await supabase
        .from("news_subscriptions")
        .select("id")
        .eq(
            "user_id",
            currentUser.id
        )
        .maybeSingle();


    if (error) {

        console.error(
            "SUBSCRIPTION CHECK ERROR:",
            error
        );

        return false;

    }


    return !!data;

}


/* =========================
   UPDATE SUBSCRIBE BUTTON
========================= */

async function updateSubscribeButton(button) {

    if (!button) {
        return;
    }


    const subscribed =
        await isSubscribed();


    if (subscribed) {

        button.textContent =
            "🔕 Unsubscribe";

        button.classList.add(
            "subscribed"
        );

    }
    else {

        button.textContent =
            "🔔 Subscribe";

        button.classList.remove(
            "subscribed"
        );

    }

}


/* =========================
   SUBSCRIBE / UNSUBSCRIBE
========================= */

async function toggleSubscription(button) {

    if (!currentUser) {

        alert(
            "Please log in first."
        );

        return;

    }


    button.disabled = true;


    const subscribed =
        await isSubscribed();


    /* =====================
       UNSUBSCRIBE
    ===================== */

    if (subscribed) {

        const {
            error
        } = await supabase
            .from("news_subscriptions")
            .delete()
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            console.error(
                "UNSUBSCRIBE ERROR:",
                error
            );

            alert(
                "Unable to unsubscribe:\n" +
                error.message
            );

            button.disabled = false;

            return;

        }


        alert(
            "You have unsubscribed from Christian News."
        );

    }


    /* =====================
       SUBSCRIBE
    ===================== */

    else {

        const {
            error
        } = await supabase
            .from("news_subscriptions")
            .insert({

                user_id:
                    currentUser.id

            });


        if (error) {

            console.error(
                "SUBSCRIBE ERROR:",
                error
            );

            alert(
                "Unable to subscribe:\n" +
                error.message
            );

            button.disabled = false;

            return;

        }


        alert(
            "You are now subscribed to Christian News. 🔔"
        );

    }


    button.disabled = false;


    await updateSubscribeButton(
        button
    );

    await loadSubscriberCount();

}


/* =========================
   GET MY REACTION
========================= */

async function getMyReaction(newsId) {

    const {
        data,
        error
    } = await supabase
        .from("news_reactions")
        .select("reaction")
        .eq(
            "news_id",
            newsId
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .maybeSingle();


    if (error) {

        console.error(
            "REACTION ERROR:",
            error
        );

        return null;

    }


    return data?.reaction || null;

}


/* =========================
   GET REACTION COUNTS
========================= */

async function getReactionCounts(newsId) {

    const {
        count: likes,
        error: likeError
    } = await supabase
        .from("news_reactions")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "news_id",
            newsId
        )
        .eq(
            "reaction",
            "like"
        );


    const {
        count: dislikes,
        error: dislikeError
    } = await supabase
        .from("news_reactions")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "news_id",
            newsId
        )
        .eq(
            "reaction",
            "dislike"
        );


    if (likeError) {

        console.error(
            "LIKE COUNT ERROR:",
            likeError
        );

    }


    if (dislikeError) {

        console.error(
            "DISLIKE COUNT ERROR:",
            dislikeError
        );

    }


    return {

        likes:
            likes || 0,

        dislikes:
            dislikes || 0

    };

}


/* =========================
   REACT TO NEWS
========================= */

async function reactToNews(
    newsId,
    reaction
) {

    const currentReaction =
        await getMyReaction(newsId);


    /* =====================
       REMOVE REACTION
    ===================== */

    if (
        currentReaction ===
        reaction
    ) {

        const {
            error
        } = await supabase
            .from("news_reactions")
            .delete()
            .eq(
                "news_id",
                newsId
            )
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            alert(
                "Unable to remove reaction."
            );

            console.error(error);

            return;

        }

    }


    /* =====================
       CHANGE REACTION
    ===================== */

    else if (currentReaction) {

        const {
            error
        } = await supabase
            .from("news_reactions")
            .update({

                reaction:
                    reaction

            })
            .eq(
                "news_id",
                newsId
            )
            .eq(
                "user_id",
                currentUser.id
            );


        if (error) {

            alert(
                "Unable to change reaction."
            );

            console.error(error);

            return;

        }

    }


    /* =====================
       NEW REACTION
    ===================== */

    else {

        const {
            error
        } = await supabase
            .from("news_reactions")
            .insert({

                news_id:
                    newsId,

                user_id:
                    currentUser.id,

                reaction:
                    reaction

            });


        if (error) {

            alert(
                "Unable to save reaction."
            );

            console.error(error);

            return;

        }

    }


    await loadNews();

}


/* =========================
   LOAD COMMENTS
========================= */

async function loadComments(
    newsId,
    commentsContainer,
    commentCountElement
) {

    const {
        data,
        error
    } = await supabase
        .from("news_comments")
        .select(`
            id,
            user_id,
            content,
            created_at
        `)
        .eq(
            "news_id",
            newsId
        )
        .eq(
            "status",
            "Published"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "COMMENTS ERROR:",
            error
        );

        commentsContainer.innerHTML =
            "<p>Unable to load comments.</p>";

        return;

    }


    commentCountElement.textContent =
        data?.length || 0;


    if (
        !data ||
        data.length === 0
    ) {

        commentsContainer.innerHTML = `

            <div class="no-comments">

                No comments yet.
                Be the first to comment. 💬

            </div>

        `;

        return;

    }


    commentsContainer.innerHTML =
        "";


    data.forEach(
        comment => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "comment-item";


            item.innerHTML = `

                <div class="comment-author">

                    Christian User

                </div>

                <div class="comment-text">

                    ${escapeHtml(
                        comment.content
                    )}

                </div>

                <div class="comment-date">

                    ${new Date(
                        comment.created_at
                    ).toLocaleString()}

                </div>

            `;


            commentsContainer.appendChild(
                item
            );

        }
    );

}


/* =========================
   POST COMMENT
========================= */

async function postComment(
    newsId,
    input,
    commentsContainer,
    commentCountElement
) {

    const text =
        input.value.trim();


    if (!text) {

        alert(
            "Please write a comment first."
        );

        return;

    }


    const button =
        input.parentElement
            .querySelector(
                ".postCommentBtn"
            );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Posting...";

    }


    const {
        error
    } = await supabase
        .from("news_comments")
        .insert({

            news_id:
                newsId,

            user_id:
                currentUser.id,

            content:
                text,

            status:
                "Published"

        });


    if (error) {

        console.error(
            "COMMENT ERROR:",
            error
        );


        alert(
            "Unable to post comment:\n" +
            error.message
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Post Comment";

        }

        return;

    }


    input.value =
        "";


    if (button) {

        button.disabled =
            false;

        button.textContent =
            "Post Comment";

    }


    await loadComments(
        newsId,
        commentsContainer,
        commentCountElement
    );

}


/* =========================
   LOAD NEWS
========================= */

async function loadNews() {

    newsContainer.innerHTML = `

        <div class="loading">

            Loading Christian news...

        </div>

    `;


    const {
        data,
        error
    } = await supabase
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


    if (error) {

        console.error(
            "NEWS ERROR:",
            error
        );


        newsContainer.innerHTML = `

            <div class="news-card">

                <h3>
                    News Database Error
                </h3>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>

        `;

        return;

    }


    newsContainer.innerHTML =
        "";


    if (
        !data ||
        data.length === 0
    ) {

        newsContainer.innerHTML = `

            <div class="news-card">

                <h3>
                    No news available.
                </h3>

                <p>
                    Check back soon for new
                    Christian news.
                </p>

            </div>

        `;

        return;

    }


    /* =========================
       BUILD ARTICLES
    ========================= */

    for (
        const news of data
    ) {

        /*
         * Record the view BEFORE
         * displaying the article.
         *
         * Duplicate view errors are
         * deliberately ignored.
         */

        await recordView(
            news.id
        );


        const card =
            newsTemplate.content
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
                    "News Room"
                );

        }


        /* =====================
           CONTENT
        ===================== */

        const content =
            card.querySelector(
                ".content"
            );


        if (content) {

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
           STATISTICS
        ===================== */

        const viewCount =
            card.querySelector(
                ".viewCount"
            );

        const likeCount =
            card.querySelector(
                ".likeCount"
            );

        const dislikeCount =
            card.querySelector(
                ".dislikeCount"
            );

        const commentCount =
            card.querySelector(
                ".commentCount"
            );


        const views =
            await getViewCount(
                news.id
            );


        if (viewCount) {

            viewCount.textContent =
                views;

        }


        /* =====================
           REACTION COUNTS
        ===================== */

        const {
            likes,
            dislikes
        } = await getReactionCounts(
            news.id
        );


        if (likeCount) {

            likeCount.textContent =
                likes;

        }


        if (dislikeCount) {

            dislikeCount.textContent =
                dislikes;

        }


        /* =====================
           CURRENT REACTION
        ===================== */

        const myReaction =
            await getMyReaction(
                news.id
            );


        const likeBtn =
            card.querySelector(
                ".likeBtn"
            );

        const dislikeBtn =
            card.querySelector(
                ".dislikeBtn"
            );


        if (
            myReaction ===
            "like"
        ) {

            likeBtn.classList.add(
                "active"
            );

        }


        if (
            myReaction ===
            "dislike"
        ) {

            dislikeBtn.classList.add(
                "active"
            );

        }


        /* =====================
           LIKE
        ===================== */

        likeBtn.onclick =
        async () => {

            await reactToNews(
                news.id,
                "like"
            );

        };


        /* =====================
           DISLIKE
        ===================== */

        dislikeBtn.onclick =
        async () => {

            await reactToNews(
                news.id,
                "dislike"
            );

        };


        /* =====================
           COMMENTS
        ===================== */

        const commentsContainer =
            card.querySelector(
                ".comments"
            );


        await loadComments(
            news.id,
            commentsContainer,
            commentCount
        );


        /* =====================
           COMMENT INPUT
        ===================== */

        const commentInput =
            card.querySelector(
                ".commentInput"
            );


        const postCommentBtn =
            card.querySelector(
                ".postCommentBtn"
            );


        postCommentBtn.onclick =
        async () => {

            await postComment(
                news.id,
                commentInput,
                commentsContainer,
                commentCount
            );

        };


        /* =====================
           COMMENT BUTTON
        ===================== */

        const commentBtn =
            card.querySelector(
                ".commentBtn"
            );


        if (commentBtn) {

            commentBtn.onclick =
            () => {

                commentInput.focus();


                commentsContainer
                    .scrollIntoView({

                        behavior:
                            "smooth",

                        block:
                            "center"

                    });

            };

        }


        /* =====================
           SHARE
        ===================== */

        const shareBtn =
            card.querySelector(
                ".shareBtn"
            );


        if (shareBtn) {

            shareBtn.onclick =
            async () => {

                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share({

                            title:
                                news.title,

                            text:
                                news.content
                                    ?.replace(
                                        /<[^>]*>/g,
                                        ""
                                    ),

                            url:
                                window.location.href

                        });

                    }
                    else {

                        await navigator.clipboard
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

            };

        }


        /* =====================
           SAVE
        ===================== */

        const saveBtn =
            card.querySelector(
                ".saveBtn"
            );


        if (saveBtn) {

            saveBtn.onclick =
            () => {

                alert(
                    "Save feature will be connected to your profile module."
                );

            };

        }


        /* =====================
           SUBSCRIBE BUTTON
        ===================== */

        const subscribeBtn =
            card.querySelector(
                ".subscribeBtn"
            );


        if (subscribeBtn) {

            await updateSubscribeButton(
                subscribeBtn
            );


            subscribeBtn.onclick =
            async () => {

                await toggleSubscription(
                    subscribeBtn
                );

            };

        }


        /* =====================
           ADD CARD
        ===================== */

        newsContainer.appendChild(
            card
        );

    }

}


/* =========================
   START
========================= */

(async () => {

    const loggedIn =
        await checkLogin();


    if (!loggedIn) {

        return;

    }


    await loadSubscriberCount();

    await loadNews();

})();
