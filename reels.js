import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const reelsFeed =
    document.getElementById(
        "reelsFeed"
    );


/* =========================
   CURRENT USER
========================= */

let currentUser = null;


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value){

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value || "";

    return div.innerHTML;

}


/* =========================
   FORMAT DATE
========================= */

function formatDate(date){

    if(!date){

        return "";

    }


    return new Date(
        date
    ).toLocaleString(
        [],
        {
            dateStyle:"medium",
            timeStyle:"short"
        }
    );

}


/* =========================
   CHECK LOGIN
========================= */

async function checkLogin(){

    const {
        data,
        error
    } =
    await supabase.auth.getUser();


    if(error){

        console.error(
            "AUTH ERROR:",
            error
        );

        return false;

    }


    if(!data.user){

        window.location.href =
            "login.html";

        return false;

    }


    currentUser =
        data.user;


    return true;

}


/* =========================
   LOAD REELS
========================= */

async function loadReels(){

    reelsFeed.innerHTML = `

        <div class="loading">

            Loading Christian Reels...

        </div>

    `;


    const {
        data: reels,
        error
    } =
    await supabase
        .from("reels")
        .select(`
            id,
            user_id,
            video_url,
            caption,
            created_at,
            profiles (
                username
            )
        `)
        .eq(
            "status",
            "published"
        )
        .order(
            "created_at",
            {
                ascending:false
            }
        );


    if(error){

        console.error(
            "REELS LOAD ERROR:",
            error
        );


        reelsFeed.innerHTML = `

            <div class="no-reels">

                <h3>
                    Unable to load Reels
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


    renderReels(
        reels || []
    );

}


/* =========================
   RENDER REELS
========================= */

function renderReels(reels){

    reelsFeed.innerHTML =
        "";


    if(
        reels.length === 0
    ){

        reelsFeed.innerHTML = `

            <div class="no-reels">

                <h3>
                    🎬 No Reels Yet
                </h3>

                <p>
                    Christian Reels will appear
                    here when members start
                    sharing videos.
                </p>

            </div>

        `;

        return;

    }


    reels.forEach(
        reel => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "reel-card";


            const username =
                reel.profiles?.username ||
                "Christian Member";


            card.innerHTML = `

                <video
                    class="reel-video"
                    src="${escapeHtml(
                        reel.video_url
                    )}"
                    controls
                    playsinline
                    preload="metadata"
                ></video>


                <div class="reel-info">

                    <div class="reel-user">

                        👤 ${escapeHtml(
                            username
                        )}

                    </div>


                    <div class="reel-caption">

                        ${escapeHtml(
                            reel.caption ||
                            ""
                        )}

                    </div>


                    <div class="reel-date">

                        ${formatDate(
                            reel.created_at
                        )}

                    </div>


                    <div class="reel-actions">

                        <button
                            type="button"
                            class="like-button"
                            data-reel-id="${reel.id}"
                        >
                            ❤️ Like
                        </button>


                        <button
                            type="button"
                            class="comment-button"
                            data-reel-id="${reel.id}"
                        >
                            💬 Comments
                        </button>

                    </div>

                </div>

            `;


            const likeButton =
                card.querySelector(
                    ".like-button"
                );


            likeButton.addEventListener(
                "click",
                function(){

                    alert(
                        "Likes will be enabled in the next Reels stage."
                    );

                }
            );


            const commentButton =
                card.querySelector(
                    ".comment-button"
                );


            commentButton.addEventListener(
                "click",
                function(){

                    alert(
                        "Comments will be enabled in the next Reels stage."
                    );

                }
            );


            reelsFeed.appendChild(
                card
            );

        }
    );

}


/* =========================
   START
========================= */

(async function(){

    const loggedIn =
        await checkLogin();


    if(!loggedIn){

        return;

    }


    await loadReels();

})();
