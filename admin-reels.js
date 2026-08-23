import supabase from "./supabase.js";


const reelsContainer =
    document.getElementById(
        "reelsContainer"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


let currentUser = null;


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


    /*
     * Check admin role from profiles.
     *
     * If your role is stored in another
     * table, we will adjust this later.
     */

    const {
        data:profile,
        error:profileError
    } =
    await supabase

        .from("profiles")

        .select(`
            id,
            username,
            role
        `)

        .eq(
            "id",
            currentUser.id
        )

        .maybeSingle();


    if(profileError){

        console.error(
            "ADMIN PROFILE ERROR:",
            profileError
        );

        alert(
            "Unable to verify administrator account."
        );

        return false;

    }


    if(
        !profile ||
        ![
            "admin",
            "newsroom",
            "superadmin"
        ].includes(
            profile.role
        )
    ){

        alert(
            "You are not authorized to access Reels moderation."
        );

        window.location.href =
            "dashboard.html";

        return false;

    }


    return true;

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
   LOAD PENDING REELS
========================= */

async function loadPendingReels(){

    reelsContainer.innerHTML = `
        <div class="loading">
            Loading pending Reels...
        </div>
    `;


    const {
        data,
        error
    } =
    await supabase

        .from("reels")

        .select(`
            id,
            user_id,
            video_url,
            caption,
            created_at
        `)

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

        console.error(
            "PENDING REELS ERROR:",
            error
        );

        reelsContainer.innerHTML = `
            <div class="empty">
                Unable to load pending Reels.
            </div>
        `;

        return;

    }


    if(
        !data ||
        data.length === 0
    ){

        reelsContainer.innerHTML = `
            <div class="empty">

                🎉

                <br><br>

                No pending Reels.

            </div>
        `;

        return;

    }


    reelsContainer.innerHTML =
        "";


    for(
        const reel of data
    ){

        let username =
            "Christian Member";


        const {
            data:profile
        } =
        await supabase

            .from("profiles")

            .select(`
                username,
                public_username
            `)

            .eq(
                "id",
                reel.user_id
            )

            .maybeSingle();


        if(profile){

            username =
                profile.public_username ||
                profile.username ||
                username;

        }


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "reel-card";


        card.innerHTML = `

            <video
                class="reel-video"
                controls
                playsinline
                preload="metadata"
                src="${escapeHtml(
                    reel.video_url
                )}"
            ></video>


            <div class="reel-details">

                <div class="creator">

                    ✝ ${escapeHtml(
                        username
                    )}

                </div>


                <div class="caption">

                    ${escapeHtml(
                        reel.caption ||
                        ""
                    )}

                </div>


                <div class="date">

                    Submitted:
                    ${formatDate(
                        reel.created_at
                    )}

                </div>


                <div class="actions">

                    <button
                        class="approve"
                        data-action="approve"
                        data-id="${reel.id}"
                    >
                        ✅ APPROVE
                    </button>


                    <button
                        class="reject"
                        data-action="reject"
                        data-id="${reel.id}"
                    >
                        ❌ REJECT
                    </button>


                    <button
                        class="delete"
                        data-action="delete"
                        data-id="${reel.id}"
                    >
                        🗑️ DELETE
                    </button>

                </div>

            </div>

        `;


        reelsContainer.appendChild(
            card
        );

    }

}


/* =========================
   MODERATION
========================= */

reelsContainer.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "button[data-action]"
            );


        if(!button){
            return;
        }


        const id =
            button.dataset.id;

        const action =
            button.dataset.action;


        if(action === "approve"){

            await updateStatus(
                id,
                "published"
            );

        }


        if(action === "reject"){

            await updateStatus(
                id,
                "rejected"
            );

        }


        if(action === "delete"){

            await deleteReel(
                id
            );

        }

    }
);


/* =========================
   UPDATE STATUS
========================= */

async function updateStatus(
    id,
    status
){

    const {
        error
    } =
    await supabase

        .from("reels")

        .update({
            status:
                status,

            updated_at:
                new Date().toISOString()

        })

        .eq(
            "id",
            id
        );


    if(error){

        console.error(
            "REEL STATUS ERROR:",
            error
        );

        alert(
            "Unable to update Reel. Check Supabase RLS policies."
        );

        return;

    }


    await loadPendingReels();

}


/* =========================
   DELETE
========================= */

async function deleteReel(
    id
){

    const confirmed =
        confirm(
            "Delete this Reel permanently?"
        );


    if(!confirmed){
        return;
    }


    const {
        error
    } =
    await supabase

        .from("reels")

        .delete()

        .eq(
            "id",
            id
        );


    if(error){

        console.error(
            "REEL DELETE ERROR:",
            error
        );

        alert(
            "Unable to delete Reel. Check Supabase RLS policies."
        );

        return;

    }


    await loadPendingReels();

}


/* =========================
   BACK
========================= */

backButton.addEventListener(
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

    const allowed =
        await checkAdmin();


    if(!allowed){
        return;
    }


    await loadPendingReels();

})();
