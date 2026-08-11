import supabase from "./supabase.js";


const form =
    document.getElementById("newsForm");

const titleInput =
    document.getElementById("title");

const contentEditor =
    document.getElementById("content");

const imageFile =
    document.getElementById("imageFile");

const videoFile =
    document.getElementById("videoFile");

const imagePreview =
    document.getElementById("imagePreview");

const videoPreview =
    document.getElementById("videoPreview");

const myArticles =
    document.getElementById("myArticles");

const template =
    document.getElementById("articleTemplate");

const editorHeading =
    document.getElementById("editorHeading");

const saveDraftButton =
    document.getElementById("saveDraft");

const cancelEditButton =
    document.getElementById("cancelEdit");

const linkButton =
    document.getElementById("linkButton");

const undoButton =
    document.getElementById("undoButton");

const redoButton =
    document.getElementById("redoButton");


let currentUser = null;

let editingArticleId = null;

let existingImage = null;

let existingVideo = null;


/* =========================
   CHECK LOGIN
========================= */

async function checkUser(){

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();


    if(error || !user){

        window.location.href =
            "login.html";

        return false;

    }


    currentUser = user;

    return true;

}


/* =========================
   RICH TEXT TOOLS
========================= */

document
.querySelectorAll(".toolbar button[data-command]")
.forEach(button => {

    button.addEventListener("click", () => {

        const command =
            button.dataset.command;

        document.execCommand(
            command,
            false,
            null
        );

        contentEditor.focus();

    });

});


/* LINK */

linkButton.addEventListener(
"click",
() => {

    const url =
        prompt(
            "Enter the website link:"
        );

    if(!url) return;

    document.execCommand(
        "createLink",
        false,
        url
    );

    contentEditor.focus();

});


/* UNDO */

undoButton.addEventListener(
"click",
() => {

    document.execCommand(
        "undo",
        false,
        null
    );

});


/* REDO */

redoButton.addEventListener(
"click",
() => {

    document.execCommand(
        "redo",
        false,
        null
    );

});


/* =========================
   IMAGE PREVIEW
========================= */

imageFile.addEventListener(
"change",
() => {

    const file =
        imageFile.files[0];

    imagePreview.innerHTML = "";

    if(!file) return;


    const url =
        URL.createObjectURL(file);


    const img =
        document.createElement("img");

    img.src = url;

    imagePreview.appendChild(img);

});


/* =========================
   VIDEO PREVIEW
========================= */

videoFile.addEventListener(
"change",
() => {

    const file =
        videoFile.files[0];

    videoPreview.innerHTML = "";

    if(!file) return;


    const url =
        URL.createObjectURL(file);


    const video =
        document.createElement("video");

    video.src = url;

    video.controls = true;

    videoPreview.appendChild(video);

});


/* =========================
   UPLOAD MEDIA
========================= */

async function uploadMedia(
file,
folder
){

    if(!file){

        return null;

    }


    const extension =
        file.name
        .split(".")
        .pop();


    const fileName =
        `${currentUser.id}/${Date.now()}.${extension}`;


    const path =
        `${folder}/${fileName}`;


    const {
        error
    } = await supabase
        .storage
        .from("news-media")
        .upload(
            path,
            file,
            {
                upsert:false
            }
        );


    if(error){

        throw error;

    }


    const {
        data
    } =
        supabase
        .storage
        .from("news-media")
        .getPublicUrl(path);


    return data.publicUrl;

}


/* =========================
   SAVE ARTICLE
========================= */

async function saveArticle(
status
){

    if(!currentUser){

        const loggedIn =
            await checkUser();

        if(!loggedIn) return;

    }


    const title =
        titleInput.value.trim();


    const content =
        contentEditor.innerHTML.trim();


    if(!title){

        alert(
            "Please enter a news title."
        );

        return;

    }


    if(!content){

        alert(
            "Please write the article."
        );

        return;

    }


    try{

        let imageURL =
            existingImage;

        let videoURL =
            existingVideo;


        /* Upload image */

        if(imageFile.files[0]){

            imageURL =
                await uploadMedia(
                    imageFile.files[0],
                    "images"
                );

        }


        /* Upload video */

        if(videoFile.files[0]){

            videoURL =
                await uploadMedia(
                    videoFile.files[0],
                    "videos"
                );

        }


        /* =====================
           EDIT EXISTING ARTICLE
        ===================== */

        if(editingArticleId){

            const {
                error
            } =
            await supabase
            .from("news")
            .update({

                title:title,

                content:content,

                image:imageURL,

                video:videoURL,

                status:status,

                approved:
                    status ===
                    "Pending Approval"
                    ? false
                    : false

            })
            .eq(
                "id",
                editingArticleId
            );


            if(error){

                throw error;

            }


            alert(
                status === "Draft"
                ?
                "Draft updated successfully."
                :
                "Article updated and submitted for approval."
            );

        }


        /* =====================
           NEW ARTICLE
        ===================== */

        else{

            const {
                error
            } =
            await supabase
            .from("news")
            .insert({

                title:title,

                content:content,

                image:imageURL,

                video:videoURL,

                author:
                    currentUser.email,

                uid:
                    currentUser.id,

                approved:false,

                status:status,

                likes:0

            });


            if(error){

                throw error;

            }


            alert(
                status === "Draft"
                ?
                "Draft saved successfully."
                :
                "News submitted for approval."
            );

        }


        resetEditor();

        loadArticles();

    }

    catch(error){

        console.error(
            "NEWSROOM ERROR:",
            error
        );

        alert(
            "Unable to save article:\n" +
            error.message
        );

    }

}


/* =========================
   SAVE DRAFT
========================= */

saveDraftButton.addEventListener(
"click",
async () => {

    await saveArticle(
        "Draft"
    );

});


/* =========================
   SUBMIT
========================= */

form.addEventListener(
"submit",
async(e) => {

    e.preventDefault();

    await saveArticle(
        "Pending Approval"
    );

});


/* =========================
   LOAD ARTICLES
========================= */

async function loadArticles(){

    if(!currentUser) return;


    const {
        data,
        error
    } =
    await supabase
    .from("news")
    .select("*")
    .eq(
        "uid",
        currentUser.id
    )
    .order(
        "Created_at",
        {
            ascending:false
        }
    );


    if(error){

        console.error(error);

        myArticles.innerHTML =
            "<p>Unable to load your articles.</p>";

        return;

    }


    myArticles.innerHTML = "";


    if(!data ||
       data.length === 0){

        myArticles.innerHTML =
            "<p>No articles yet.</p>";

        return;

    }


    data.forEach(news => {

        const card =
            template.content
            .cloneNode(true);


        card.querySelector(
            ".articleTitle"
        ).textContent =
            news.title ||
            "Untitled";


        card.querySelector(
            ".articleStatus"
        ).textContent =
            news.status ||
            "Draft";


        card.querySelector(
            ".articleDate"
        ).textContent =
            news.Created_at
            ?
            new Date(
                news.Created_at
            ).toLocaleString()
            :
            "Just now";


        /* EDIT */

        card.querySelector(
            ".editButton"
        ).addEventListener(
            "click",
            () => {

                editArticle(news);

            }
        );


        /* DELETE */

        card.querySelector(
            ".deleteButton"
        ).addEventListener(
            "click",
            async() => {

                deleteArticle(
                    news.id
                );

            }
        );


        myArticles.appendChild(card);

    });

}


/* =========================
   EDIT ARTICLE
========================= */

function editArticle(news){

    editingArticleId =
        news.id;


    existingImage =
        news.image || null;


    existingVideo =
        news.video || null;


    titleInput.value =
        news.title || "";


    contentEditor.innerHTML =
        news.content || "";


    editorHeading.textContent =
        "✏️ Edit Article";


    cancelEditButton.style.display =
        "block";


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });


    imagePreview.innerHTML =
        existingImage
        ?
        `<img src="${existingImage}">`
        :
        "";


    videoPreview.innerHTML =
        existingVideo
        ?
        `<video src="${existingVideo}" controls></video>`
        :
        "";

}


/* =========================
   DELETE
========================= */

async function deleteArticle(id){

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this article?"
        );


    if(!confirmDelete){

        return;

    }


    const {
        error
    } =
    await supabase
    .from("news")
    .delete()
    .eq(
        "id",
        id
    );


    if(error){

        alert(
            "Unable to delete article:\n" +
            error.message
        );

        return;

    }


    alert(
        "Article deleted."
    );


    loadArticles();

}


/* =========================
   CANCEL EDIT
========================= */

cancelEditButton.addEventListener(
"click",
() => {

    resetEditor();

});


/* =========================
   RESET
========================= */

function resetEditor(){

    form.reset();

    contentEditor.innerHTML =
        "";

    imagePreview.innerHTML =
        "";

    videoPreview.innerHTML =
        "";

    editingArticleId =
        null;

    existingImage =
        null;

    existingVideo =
        null;

    editorHeading.textContent =
        "Write News Article";

    cancelEditButton.style.display =
        "none";

}


/* =========================
   START
========================= */

(async() => {

    const loggedIn =
        await checkUser();

    if(!loggedIn) return;

    await loadArticles();

})();        

        
            
                    
