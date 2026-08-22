import supabase from "./supabase.js";


const reelsContainer =
    document.getElementById(
        "reelsContainer"
    );


function escapeHtml(text){

    const div =
        document.createElement("div");

    div.textContent =
        text || "";

    return div.innerHTML;

}


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


async function loadReels(){

    reelsContainer.innerHTML = `
        <div class="loading">
            Loading Christian reels...
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

        reelsContainer.innerHTML = `
            <div class="error-message">
                Unable to load Christian reels.
            </div>
        `;

        return;
    }


    if(!data || data.length === 0){

        reelsContainer.innerHTML = `
            <div class="no-reels">

                🎬

                <br><br>

                No Christian reels have been
                published yet.

                <br><br>

                Check back soon. ❤️

            </div>
        `;

        return;
    }


    reelsContainer.innerHTML = "";


    for(const reel of data){

        let username =
            "Christian Member";


        try{

            const {
                data:profile
            } =
            await supabase

                .from("profiles")

                .select(`
                    public_username,
                    username
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

        }
        catch(error){

            console.warn(
                "PROFILE LOAD ERROR:",
                error
            );

        }


        const article =
            document.createElement("article");

        article.className =
            "reel";


        article.innerHTML = `

            <video
                controls
                playsinline
                preload="metadata"
                src="${escapeHtml(
                    reel.video_url
                )}"
            ></video>


            <div class="reel-overlay">

                <div class="reel-user">

                    ✝ ${escapeHtml(
                        username
                    )}

                </div>


                <div class="reel-caption">

                    ${escapeHtml(
                        reel.caption
                    )}

                </div>


                <div class="reel-date">

                    ${formatDate(
                        reel.created_at
                    )}

                </div>

            </div>

        `;


        reelsContainer.appendChild(
            article
        );

    }

}


loadReels();
