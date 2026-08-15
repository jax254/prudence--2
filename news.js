   import supabase from "./supabase.js";


const newsContainer =
    document.getElementById(
        "newsContainer"
    );


const newsTemplate =
    document.getElementById(
        "newsTemplate"
    );


const subscriberCount =
    document.getElementById(
        "subscriberCount"
    );


let currentUser = null;



/* =========================
   CHECK LOGIN
========================= */

async function checkLogin(){

    const {
        data: { user },
        error
    } =
    await supabase.auth.getUser();


    if(
        error ||
        !user
    ){

        window.location.href =
            "login.html";

        return false;

    }


    currentUser =
        user;

    return true;

}



/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(text){

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text || "";

    return div.innerHTML;

}



/* =========================
   LOAD SUBSCRIBERS
========================= */

async function loadSubscriberCount(){

    const {
        count,
        error
    } =
    await supabase
        .from(
            "news_subscriptions"
        )
        .select(
            "id",
            {
                count:"exact",
                head:true
            }
        );


    if(error){

        console.error(
            "SUBSCRIBER ERROR:",
            error
        );

        return;

    }


    subscriberCount.textContent =
        count || 0;

}



/* =========================
   CHECK MY REACTION
========================= */

async function getMyReaction(
    newsId
){

    const {
        data,
        error
    } =
    await supabase
        .from(
            "news_reactions"
        )
        .select(
            "reaction"
        )
        .eq(
            "news_id",
            newsId
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .maybeSingle();


    if(error){

        console.error(
            "REACTION ERROR:",
            error
        );

        return null;

    }


    return data
        ?.reaction ||
        null;

}



/* =========================
   REACT TO NEWS
========================= */

async function reactToNews(
    newsId,
    reaction
){

    const currentReaction =
        await getMyReaction(
            newsId
        );


    /* Remove existing reaction */

    if(
        currentReaction ===
        reaction
    ){

        const {
            error
        } =
        await supabase
            .from(
                "news_reactions"
            )
            .delete()
            .eq(
                "news_id",
                newsId
            )
            .eq(
                "user_id",
                currentUser.id
            );


        if(error){

            alert(
                "Unable to remove reaction."
            );

            console.error(error);

            return;

        }

    }

    /* Change reaction */

    else if(
        currentReaction
    ){

        const {
            error
        } =
        await supabase
            .from(
                "news_reactions"
            )
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


        if(error){

            alert(
                "Unable to change reaction."
            );

            console.error(error);

            return;

        }

    }

    /* New reaction */

    else{

        const {
            error
        } =
        await supabase
            .from(
                "news_reactions"
            )
            .insert({

                news_id:
                    newsId,

                user_id:
                    currentUser.id,

                reaction:
                    reaction

            });


        if(error){

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
){

    const {
        data,
        error
    } =
    await supabase
        .from(
            "news_comments"
        )
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
                ascending:false
            }
        );


    if(error){

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


    if(
        !data ||
        data.length === 0
    ){

        commentsContainer.innerHTML =
            `
            <div class="no-comments">
                No comments yet. Be the first to comment. 💬
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
){

    const text =
        input.value.trim();


    if(!text){

        alert(
            "Please write a comment first."
        );

        return;

    }


    const button =
        input
            .parentElement
            .querySelector(
                ".postCommentBtn"
            );


    if(button){

        button.disabled =
            true;

        button.textContent =
            "Posting...";

    }


    const {
        error
    } =
    await supabase
        .from(
            "news_comments"
        )
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


    if(error){

        console.error(
            "COMMENT ERROR:",
            error
        );


        alert(
            "Unable to post comment:\n" +
            error.message
        );


        if(button){

            button.disabled =
                false;

            button.textContent =
                "Post Comment";

        }

        return;

    }


    input.value =
        "";


    if(button){

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
   SUBSCRIBE
========================= */

async function subscribe(){

    const {
        data: existing,
        error: checkError
    } =
    await supabase
        .from(
            "news_subscriptions"
        )
        .select(
            "id"
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .maybeSingle();


    if(checkError){

        console.error(
            checkError
        );

        return;

    }


    if(existing){

        const {
            error
        } =
        await supabase
            .from(
                "news_subscriptions"
            )
            .delete()
            .eq(
                "user_id",
                currentUser.id
            );


        if(error){

            alert(
                "Unable to unsubscribe."
            );

            return;

        }


        alert(
            "You have unsubscribed from Christian News."
        );

    }

    else{

        const {
            error
        } =
        await supabase
            .from(
                "news_subscriptions"
            )
            .insert({

                user_id:
                    currentUser.id

            });


        if(error){

            alert(
                "Unable to subscribe."
            );

            return;

        }


        alert(
            "You are now subscribed to Christian News. 🔔"
        );

    }


    await loadSubscriberCount();

}



/* =========================
   LOAD NEWS
========================= */

async function loadNews(){

    newsContainer.innerHTML =
        `
        <div class="loading">
            Loading Christian news...
        </div>
        `;


    const {
        data,
        error
    } =
    await supabase
        .from(
            "news"
        )
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
                ascending:false
            }
        );


    if(error){

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


    if(
        !data ||
        data.length === 0
    ){

        newsContainer.innerHTML =
            `
            <div class="news-card">

                <h3>
                    No news available.
                </h3>

                <p>
                    Check back soon for new Christian news.
                </p>

            </div>
            `;

        return;

    }



    /* =========================
       BUILD ARTICLES
    ========================= */

    for(
        const news of data
    ){

        const card =
            newsTemplate.content
                .cloneNode(true);


        /* TITLE */

        card.querySelector(
            ".title"
        ).textContent =
            news.title ||
            "Untitled News";


        /* AUTHOR */

        card.querySelector(
            ".author"
        ).textContent =
            "Published by: " +
            (
                news.author ||
                "News Room"
            );


        /* CONTENT */

        card.querySelector(
            ".content"
        ).innerHTML =
            news.content ||
            "";


        /* IMAGE */

        const image =
            card.querySelector(
                ".image"
            );


        if(news.image){

            image.src =
                news.image;

            image.style.display =
                "block";

        }
        else{

            image.style.display =
                "none";

        }


        /* VIDEO */

        const video =
            card.querySelector(
                ".video"
            );


        if(news.video){

            video.src =
                news.video;

            video.style.display =
                "block";

        }
        else{

            video.style.display =
                "none";

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


        viewCount.textContent =
            news.views || 0;


        /* =====================
           REACTIONS
        ===================== */

        const {
            count: likes
        } =
        await supabase
            .from(
                "news_reactions"
            )
            .select(
                "id",
                {
                    count:"exact",
                    head:true
                }
            )
            .eq(
                "news_id",
                news.id
            )
            .eq(
                "reaction",
                "like"
            );


        const {
            count: dislikes
        } =
        await supabase
            .from(
                "news_reactions"
            )
            .select(
                "id",
                {
                    count:"exact",
                    head:true
                }
            )
            .eq(
                "news_id",
                news.id
            )
            .eq(
                "reaction",
                "dislike"
            );


        likeCount.textContent =
            likes || 0;


        dislikeCount.textContent =
            dislikes || 0;


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


        if(
            myReaction ===
            "like"
        ){

            likeBtn.classList.add(
                "active"
            );

        }


        if(
            myReaction ===
            "dislike"
        ){

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


        /* COMMENT BUTTON */

        card.querySelector(
            ".commentBtn"
        ).onclick =
        () => {

            commentInput.focus();

            commentsContainer.scrollIntoView({
                behavior:"smooth",
                block:"center"
            });

        };


        /* =====================
           SHARE
        ===================== */

        card.querySelector(
            ".shareBtn"
        ).onclick =
        async () => {

            try{

                if(
                    navigator.share
                ){

                    await navigator.share({

                        title:
                            news.title,

                        text:
                            news.content,

                        url:
                            window.location.href

                    });

                }
                else{

                    await navigator.clipboard.writeText(
                        window.location.href
                    );

                    alert(
                        "Link copied."
                    );

                }

            }
            catch(error){

                console.log(
                    "Share cancelled."
                );

            }

        };


        /* =====================
           SAVE
        ===================== */

        card.querySelector(
            ".saveBtn"
        ).onclick =
        () => {

            alert(
                "Save feature will be completed in the profile module."
            );

        };


        /* =====================
           SUBSCRIBE
        ===================== */

        /*
         * We put a Subscribe button
         * into the card dynamically.
         */

        const subscribeBtn =
            document.createElement(
                "button"
            );


        subscribeBtn.type =
            "button";


        subscribeBtn.className =
            "subscribeBtn";


        subscribeBtn.textContent =
            "🔔 Subscribe";


        subscribeBtn.onclick =
        async () => {

            await subscribe();

        };


        card.querySelector(
            ".actions"
        ).appendChild(
            subscribeBtn
        );


        /* =====================
           VIEW
        ===================== */

        const {
            error:
                viewError
        } =
        await supabase.rpc(
            "increment_news_view",
            {
                article_id:
                    news.id
            }
        );


        if(viewError){

            console.error(
                "VIEW ERROR:",
                viewError
            );

        }
        else{

            viewCount.textContent =
                Number(
                    viewCount.textContent
                ) + 1;

        }


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


    if(!loggedIn){

        return;

    }


    await loadSubscriberCount();

    await loadNews();

})();            
