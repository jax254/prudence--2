import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const liveList =
    document.getElementById(
        "liveList"
    );

const liveRequestForm =
    document.getElementById(
        "liveRequestForm"
    );

const titleInput =
    document.getElementById(
        "title"
    );

const preacherInput =
    document.getElementById(
        "preacher"
    );

const descriptionInput =
    document.getElementById(
        "description"
    );

const streamLinkInput =
    document.getElementById(
        "streamLink"
    );

const requestLive =
    document.getElementById(
        "requestLive"
    );

const requestStatus =
    document.getElementById(
        "requestStatus"
    );

const myRequests =
    document.getElementById(
        "myRequests"
    );


let currentUser = null;


/* =========================
   LOGIN
========================= */

async function checkLogin(){

    const {
        data,
        error
    } =
    await supabase.auth.getUser();


    if(
        error ||
        !data.user
    ){

        window.location.href =
            "login.html";

        return false;

    }


    currentUser =
        data.user;

    return true;

}


/* =========================
   STATUS
========================= */

function showStatus(
    message,
    type = ""
){

    requestStatus.textContent =
        message;

    requestStatus.className =
        "status-message " +
        type;

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text){

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text || "";

    return div.innerHTML;

}


/* =========================
   LOAD LIVE BROADCASTS
========================= */

async function loadLiveBroadcasts(){

    liveList.innerHTML = `
        <div class="loading">
            Loading live broadcasts...
        </div>
    `;


    const {
        data,
        error
    } =
    await supabase

        .from("live_streams")

        .select(`
            id,
            user_id,
            title,
            preacher,
            description,
            stream_url,
            started_at
        `)

        .eq(
            "approved",
            true
        )

        .eq(
            "status",
            "live"
        )

        .order(
            "started_at",
            {
                ascending:false
            }
        );


    if(error){

        console.error(
            "LIVE LOAD ERROR:",
            error
        );

        liveList.innerHTML = `
            <div class="error-message">
                Unable to load live broadcasts.
            </div>
        `;

        return;

    }


    if(
        !data ||
        data.length === 0
    ){

        liveList.innerHTML = `
            <div class="empty-state">

                🔴

                <h3>
                    No Live Broadcasts
                </h3>

                <p>
                    There are no live broadcasts
                    at the moment.
                </p>

            </div>
        `;

        return;

    }


    liveList.innerHTML = "";


    data.forEach(
        live => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "live-card";


            card.innerHTML = `

                <div class="live-badge">
                    🔴 LIVE
                </div>

                <h3>
                    ${escapeHTML(
                        live.title
                    )}
                </h3>

                <p class="preacher">
                    ✝ ${escapeHTML(
                        live.preacher
                    )}
                </p>

                <p>
                    ${escapeHTML(
                        live.description
                    )}
                </p>

                ${
                    live.stream_url
                    ?
                    `
                    <div class="stream-container">

                        <iframe
                            src="${escapeHTML(
                                live.stream_url
                            )}"
                            allowfullscreen
                            allow="autoplay; fullscreen"
                        ></iframe>

                    </div>
                    `
                    :
                    `
                    <div class="stream-unavailable">

                        🎥 Stream link not available yet.

                    </div>
                    `
                }

            `;


            liveList.appendChild(
                card
            );

        }
    );

}


/* =========================
   REQUEST LIVE
========================= */

liveRequestForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if(!currentUser){

            return;

        }


        requestLive.disabled =
            true;

        requestLive.textContent =
            "Submitting...";


        showStatus(
            "",
            ""
        );


        const title =
            titleInput.value.trim();

        const preacher =
            preacherInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const streamURL =
            streamLinkInput.value.trim();


        try{

            const {
                error
            } =
            await supabase

                .from("live_streams")

                .insert({

                    user_id:
                        currentUser.id,

                    title:
                        title,

                    preacher:
                        preacher,

                    description:
                        description,

                    stream_url:
                        streamURL || null,

                    status:
                        "pending",

                    approved:
                        false

                });


            if(error){

                throw error;

            }


            showStatus(
                "✅ Your Live request has been submitted for approval.",
                "status-success"
            );


            liveRequestForm.reset();


            await loadMyRequests();

        }
        catch(error){

            console.error(
                "LIVE REQUEST ERROR:",
                error
            );


            showStatus(
                "Unable to submit your request: " +
                error.message,
                "status-error"
            );

        }


        requestLive.disabled =
            false;

        requestLive.textContent =
            "🎥 Submit Live Request";

    }
);


/* =========================
   LOAD MY REQUESTS
========================= */

async function loadMyRequests(){

    myRequests.innerHTML = `
        <div class="loading">
            Loading your requests...
        </div>
    `;


    const {
        data,
        error
    } =
    await supabase

        .from("live_streams")

        .select(`
            id,
            title,
            preacher,
            description,
            stream_url,
            status,
            approved,
            created_at,
            started_at,
            ended_at
        `)

        .eq(
            "user_id",
            currentUser.id
        )

        .order(
            "created_at",
            {
                ascending:false
            }
        );


    if(error){

        console.error(
            "MY LIVE REQUESTS ERROR:",
            error
        );

        myRequests.innerHTML = `
            <div class="error-message">
                Unable to load your requests.
            </div>
        `;

        return;

    }


    if(
        !data ||
        data.length === 0
    ){

        myRequests.innerHTML = `
            <div class="empty-state">

                You haven't submitted
                a Live request yet.

            </div>
        `;

        return;

    }


    myRequests.innerHTML = "";


    data.forEach(
        request => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "request-card";


            let statusClass =
                "status-pending";


            if(
                request.status ===
                "live"
            ){

                statusClass =
                    "status-live";

            }
            else if(
                request.status ===
                "ended"
            ){

                statusClass =
                    "status-ended";

            }
            else if(
                request.status ===
                "rejected"
            ){

                statusClass =
                    "status-rejected";

            }


            card.innerHTML = `

                <div class="request-header">

                    <strong>
                        ${escapeHTML(
                            request.title
                        )}
                    </strong>

                    <span
                        class="request-status ${statusClass}"
                    >
                        ${escapeHTML(
                            request.status
                        )}
                    </span>

                </div>

                <p>
                    ${escapeHTML(
                        request.description
                    )}
                </p>

                <small>
                    Submitted:
                    ${new Date(
                        request.created_at
                    ).toLocaleString()}
                </small>

            `;


            myRequests.appendChild(
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


    await loadLiveBroadcasts();

    await loadMyRequests();

})();
