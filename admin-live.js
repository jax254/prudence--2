import supabase from "./supabase.js";


/* =========================
   ELEMENTS
========================= */

const pendingList =
    document.getElementById("pendingList");

const liveList =
    document.getElementById("liveList");

const historyList =
    document.getElementById("historyList");

const pendingCount =
    document.getElementById("pendingCount");

const liveCount =
    document.getElementById("liveCount");

const refreshBtn =
    document.getElementById("refreshBtn");

const backBtn =
    document.getElementById("backBtn");


let currentUser = null;


/* =========================
   HTML ESCAPE
========================= */

function escapeHTML(text){

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}


/* =========================
   CHECK ADMIN
========================= */

async function checkAdmin(){

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


    const {
        data:profile,
        error:profileError
    } =
    await supabase

        .from("profiles")

        .select("role")

        .eq(
            "id",
            currentUser.id
        )

        .single();


    if(
        profileError ||
        !profile
    ){

        alert(
            "Unable to verify administrator account."
        );

        window.location.href =
            "dashboard.html";

        return false;

    }


    const allowedRoles = [
        "admin",
        "newsroom",
        "superadmin"
    ];


    if(
        !allowedRoles.includes(
            profile.role
        )
    ){

        alert(
            "You are not authorized to manage Live broadcasts."
        );

        window.location.href =
            "dashboard.html";

        return false;

    }


    return true;

}


/* =========================
   LOAD PENDING
========================= */

async function loadPending(){

    const {
        data,
        error
    } =
    await supabase

        .from("live_streams")

        .select("*")

        .eq(
            "status",
            "pending"
        )

        .order(
            "created_at",
            {
                ascending:false
            }
        );


    if(error){

        console.error(error);

        pendingList.innerHTML = `
            <div class="error-message">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;

        return;

    }


    pendingCount.textContent =
        data?.length || 0;


    if(
        !data ||
        data.length === 0
    ){

        pendingList.innerHTML = `
            <div class="empty-state">
                No pending Live requests.
            </div>
        `;

        return;

    }


    pendingList.innerHTML = "";


    data.forEach(
        item => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "live-card";


            card.innerHTML = `

                <span class="pending-badge">
                    🟡 PENDING
                </span>

                <h3>
                    ${escapeHTML(
                        item.title
                    )}
                </h3>

                <p>
                    <strong>Preacher / Host:</strong>
                    ${escapeHTML(
                        item.preacher
                    )}
                </p>

                <p>
                    ${escapeHTML(
                        item.description
                    )}
                </p>

                <p class="requester">
                    User ID:
                    ${escapeHTML(
                        item.user_id
                    )}
                </p>

                ${
                    item.stream_url
                    ?
                    `
                    <div class="stream-link">
                        Stream:
                        ${escapeHTML(
                            item.stream_url
                        )}
                    </div>
                    `
                    :
                    `
                    <p class="requester">
                        No stream link provided.
                    </p>
                    `
                }

                <div class="actions">

                    <button
                        class="approve-btn"
                        data-id="${item.id}"
                    >
                        ✅ Approve
                    </button>

                    <button
                        class="reject-btn"
                        data-id="${item.id}"
                    >
                        ❌ Reject
                    </button>

                </div>

            `;


            pendingList.appendChild(
                card
            );

        }
    );


    pendingList
        .querySelectorAll(
            ".approve-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => approveLive(
                        button.dataset.id
                    )
                );

            }
        );


    pendingList
        .querySelectorAll(
            ".reject-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => rejectLive(
                        button.dataset.id
                    )
                );

            }
        );

}


/* =========================
   APPROVE
========================= */

async function approveLive(id){

    const confirmed =
        confirm(
            "Approve this Live broadcast?"
        );


    if(!confirmed){

        return;

    }


    const {
        error
    } =
    await supabase

        .from("live_streams")

        .update({

            approved:true,

            status:"live",

            started_at:
                new Date().toISOString()

        })

        .eq(
            "id",
            id
        );


    if(error){

        console.error(error);

        alert(
            "Unable to approve Live: " +
            error.message
        );

        return;

    }


    alert(
        "Live broadcast approved."
    );


    await loadAll();

}


/* =========================
   REJECT
========================= */

async function rejectLive(id){

    const confirmed =
        confirm(
            "Reject this Live broadcast?"
        );


    if(!confirmed){

        return;

    }


    const {
        error
    } =
    await supabase

        .from("live_streams")

        .update({

            approved:false,

            status:"rejected"

        })

        .eq(
            "id",
            id
        );


    if(error){

        console.error(error);

        alert(
            "Unable to reject Live: " +
            error.message
        );

        return;

    }


    alert(
        "Live broadcast rejected."
    );


    await loadAll();

}


/* =========================
   LOAD LIVE NOW
========================= */

async function loadLive(){

    const {
        data,
        error
    } =
    await supabase

        .from("live_streams")

        .select("*")

        .eq(
            "status",
            "live"
        )

        .eq(
            "approved",
            true
        )

        .order(
            "started_at",
            {
                ascending:false
            }
        );


    if(error){

        console.error(error);

        liveList.innerHTML = `
            <div class="error-message">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;

        return;

    }


    liveCount.textContent =
        data?.length || 0;


    if(
        !data ||
        data.length === 0
    ){

        liveList.innerHTML = `
            <div class="empty-state">
                No broadcasts are currently live.
            </div>
        `;

        return;

    }


    liveList.innerHTML = "";


    data.forEach(
        item => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "live-card";


            card.innerHTML = `

                <span class="live-badge">
                    🔴 LIVE NOW
                </span>

                <h3>
                    ${escapeHTML(
                        item.title
                    )}
                </h3>

                <p>
                    <strong>Preacher / Host:</strong>
                    ${escapeHTML(
                        item.preacher
                    )}
                </p>

                <p>
                    ${escapeHTML(
                        item.description
                    )}
                </p>

                <div class="actions">

                    <button
                        class="end-btn"
                        data-id="${item.id}"
                    >
                        ⏹️ End Live
                    </button>

                </div>

            `;


            liveList.appendChild(
                card
            );

        }
    );


    liveList
        .querySelectorAll(
            ".end-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => endLive(
                        button.dataset.id
                    )
                );

            }
        );

}


/* =========================
   END LIVE
========================= */

async function endLive(id){

    const confirmed =
        confirm(
            "End this Live broadcast?"
        );


    if(!confirmed){

        return;

    }


    const {
        error
    } =
    await supabase

        .from("live_streams")

        .update({

            status:"ended",

            ended_at:
                new Date().toISOString()

        })

        .eq(
            "id",
            id
        );


    if(error){

        console.error(error);

        alert(
            "Unable to end Live: " +
            error.message
        );

        return;

    }


    alert(
        "Live broadcast ended."
    );


    await loadAll();

}


/* =========================
   LOAD HISTORY
========================= */

async function loadHistory(){

    const {
        data,
        error
    } =
    await supabase

        .from("live_streams")

        .select("*")

        .in(
            "status",
            [
                "ended",
                "rejected"
            ]
        )

        .order(
            "created_at",
            {
                ascending:false
            }
        )

        .limit(20);


    if(error){

        console.error(error);

        historyList.innerHTML = `
            <div class="error-message">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;

        return;

    }


    if(
        !data ||
        data.length === 0
    ){

        historyList.innerHTML = `
            <div class="empty-state">
                No recent decisions.
            </div>
        `;

        return;

    }


    historyList.innerHTML = "";


    data.forEach(
        item => {

            const badge =
                item.status === "rejected"
                ?
                "rejected-badge"
                :
                "ended-badge";


            const label =
                item.status === "rejected"
                ?
                "❌ REJECTED"
                :
                "⏹️ ENDED";


            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "live-card";


            card.innerHTML = `

                <span class="${badge}">
                    ${label}
                </span>

                <h3>
                    ${escapeHTML(
                        item.title
                    )}
                </h3>

                <p>
                    <strong>
                        Preacher / Host:
                    </strong>

                    ${escapeHTML(
                        item.preacher
                    )}
                </p>

                <p>
                    ${escapeHTML(
                        item.description
                    )}
                </p>

            `;


            historyList.appendChild(
                card
            );

        }
    );

}


/* =========================
   LOAD EVERYTHING
========================= */

async function loadAll(){

    await loadPending();

    await loadLive();

    await loadHistory();

}


/* =========================
   BUTTONS
========================= */

refreshBtn.addEventListener(
    "click",
    loadAll
);


backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "admin-dashboard.html";

    }
);


/* =========================
   START
========================= */

(async function(){

    const authorized =
        await checkAdmin();


    if(!authorized){

        return;

    }


    await loadAll();

})();
