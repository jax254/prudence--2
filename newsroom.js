import supabase from "./supabase.js";

const form = document.getElementById("newsForm");

const myArticles =
    document.getElementById("myArticles");

const template =
    document.getElementById("articleTemplate");

const titleInput =
    document.getElementById("title");

const contentEditor =
    document.getElementById("content");

const imageInput =
    document.getElementById("image");

const videoInput =
    document.getElementById("video");

const saveDraftButton =
    document.getElementById("saveDraft");

const submitApprovalButton =
    document.getElementById("submitApproval");

const cancelEditButton =
    document.getElementById("cancelEdit");

const editorTitle =
    document.getElementById("editorTitle");


let currentUser = null;

let editingArticleId = null;


// =========================
// CHECK LOGIN
// =========================

async function checkUser(){

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();


    if(error || !user){

        window.location.href =
            "../login.html";

        return false;

    }


    currentUser = user;

    return true;

}


// =========================
// TOOLBAR
// =========================

document
.querySelectorAll(".toolbar button")
.forEach(button => {

    button.addEventListener("click", () => {

        const command =
            button.dataset.command;

        const value =
            button.dataset.value || null;


        if(command === "createLink"){

            const url =
                prompt(
                    "Enter the website URL:"
                );


            if(url){

                document.execCommand(
                    "createLink",
                    false,
                    url
                );

            }

        }

        else{

            document.execCommand(
                command,
                false,
                value
            );

        }


        contentEditor.focus();

    });

});


// =========================
// GET ARTICLE DATA
// =========================

function getArticleData(){

    return {

        title:
            titleInput.value.trim(),

        content:
            contentEditor.innerHTML.trim(),

        image:
            imageInput.value.trim(),

        video:
            videoInput.value.trim()

    };

}


// =========================
// VALIDATE ARTICLE
// =========================

function validateArticle(data){

    const temporaryDiv =
        document.createElement("div");

    temporaryDiv.innerHTML =
        data.content;

    const plainText =
        temporaryDiv.textContent.trim();


    if(!data.title){

        alert(
            "Please enter a news title."
        );

        return false;

    }


    if(!plainText){

        alert(
            "Please write your article."
        );

        return false;

    }


    return true;

}


// =========================
// SAVE DRAFT
// =========================

saveDraftButton.addEventListener(
    "click",
    async () => {

        if(!currentUser){

            const loggedIn =
                await checkUser();

            if(!loggedIn) return;

        }


        const data =
            getArticleData();


        if(!data.title){

            alert(
                "Please enter a title before saving the draft."
            );

            return;

        }


        try{

            if(editingArticleId){

                const { error } =
                    await supabase
                    .from("news")
                    .update({

                        title:data.title,

                        content:data.content,

                        image:data.image || null,

                        video:data.video || null,

                        status:"Draft",

                        approved:false

                    })
                    .eq(
                        "id",
                        editingArticleId
                    );


                if(error){

                    console.error(error);

                    alert(
                        "Unable to update draft: " +
                        error.message
                    );

                    return;

                }


                alert(
                    "Draft updated successfully."
                );

            }

            else{

                const { error } =
                    await supabase
                    .from("news")
                    .insert({

                        title:data.title,

                        content:data.content,

                        image:data.image || null,

                        video:data.video || null,

                        author:
                            currentUser.email,

                        uid:
                            currentUser.id,

                        approved:false,

                        status:"Draft",

                        likes:0

                    });


                if(error){

                    console.error(error);

                    alert(
                        "Unable to save draft: " +
                        error.message
                    );

                    return;

                }


                alert(
                    "Draft saved successfully."
                );

            }


            resetEditor();

            loadArticles();

        }

        catch(error){

            console.error(error);

            alert(
                "Something went wrong while saving the draft."
            );

        }

    }
);


// =========================
// SUBMIT FOR APPROVAL
// =========================

submitApprovalButton.addEventListener(
    "click",
    async () => {

        if(!currentUser){

            const loggedIn =
                await checkUser();

            if(!loggedIn) return;

        }


        const data =
            getArticleData();


        if(!validateArticle(data))
            return;


        try{

            if(editingArticleId){

                const { error } =
                    await supabase
                    .from("news")
                    .update({

                        title:data.title,

                        content:data.content,

                        image:data.image || null,

                        video:data.video || null,

                        status:
                            "Pending Approval",

                        approved:false

                    })
                    .eq(
                        "id",
                        editingArticleId
                    );


                if(error){

                    console.error(error);

                    alert(
                        "Unable to submit article: " +
                        error.message
                    );

                    return;

                }

            }

            else{

                const { error } =
                    await supabase
                    .from("news")
                    .insert({

                        title:data.title,

                        content:data.content,

                        image:data.image || null,

                        video:data.video || null,

                        author:
                            currentUser.email,

                        uid:
                            currentUser.id,

                        approved:false,

                        status:
                            "Pending Approval",

                        likes:0

                    });


                if(error){

                    console.error(error);

                    alert(
                        "Unable to submit article: " +
                        error.message
                    );

                    return;

                }

            }


            alert(
                "News submitted successfully for approval."
            );


            resetEditor();

            loadArticles();

        }

        catch(error){

            console.error(error);

            alert(
                "Something went wrong while submitting the article."
            );

        }

    }
);


// =========================
// LOAD ARTICLES
// =========================

async function loadArticles(){

    if(!currentUser)
        return;


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

        console.error(
            "LOAD ARTICLES ERROR:",
            error
        );


        myArticles.innerHTML =
            "<p>Unable to load your articles.</p>";

        return;

    }


    myArticles.innerHTML = "";


    if(!data || data.length === 0){

        myArticles.innerHTML =
            "<p>No articles yet.</p>";

        return;

    }


    data.forEach(news => {

        const card =
            template.content.cloneNode(true);


        card.querySelector(
            ".articleTitle"
        ).textContent =
            news.title || "Untitled";


        const status =
            news.status ||
            (
                news.approved
                ? "Approved"
                : "Pending Approval"
            );


        card.querySelector(
            ".articleStatus"
        ).textContent =
            "Status: " + status;


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


        // =====================
        // EDIT
        // =====================

        card.querySelector(
            ".editButton"
        ).addEventListener(
            "click",
            () => {

                if(
                    status !== "Draft" &&
                    status !== "Rejected"
                ){

                    alert(
                        "Only drafts or rejected articles can be edited."
                    );

                    return;

                }


                editingArticleId =
                    news.id;


                titleInput.value =
                    news.title || "";


                contentEditor.innerHTML =
                    news.content || "";


                imageInput.value =
                    news.image || "";


                videoInput.value =
                    news.video || "";


                editorTitle.textContent =
                    "Edit Article";


                saveDraftButton.style.display =
                    "block";


                submitApprovalButton.style.display =
                    "block";


                cancelEditButton.style.display =
                    "block";


                window.scrollTo({
                    top:0,
                    behavior:"smooth"
                });

            }
        );


        // =====================
        // DELETE
        // =====================

        card.querySelector(
            ".deleteButton"
        ).addEventListener(
            "click",
            async () => {

                if(
                    status !== "Draft"
                ){

                    alert(
                        "Only draft articles can be deleted."
                    );

                    return;

                }


                const confirmed =
                    confirm(
                        "Delete this draft?"
                    );


                if(!confirmed)
                    return;


                const { error } =
                    await supabase
                    .from("news")
                    .delete()
                    .eq(
                        "id",
                        news.id
                    );


                if(error){

                    console.error(error);

                    alert(
                        "Unable to delete draft: " +
                        error.message
                    );

                    return;

                }


                alert(
                    "Draft deleted."
                );


                loadArticles();

            }
        );


        // =====================
        // SUBMIT EXISTING DRAFT
        // =====================

        card.querySelector(
            ".submitButton"
        ).addEventListener(
            "click",
            async () => {

                if(
                    status !== "Draft" &&
                    status !== "Rejected"
                ){

                    alert(
                        "This article has already been submitted."
                    );

                    return;

                }


                const confirmed =
                    confirm(
                        "Submit this article for approval?"
                    );


                if(!confirmed)
                    return;


                const { error } =
                    await supabase
                    .from("news")
                    .update({

                        status:
                            "Pending Approval",

                        approved:false

                    })
                    .eq(
                        "id",
                        news.id
                    );


                if(error){

                    console.error(error);

                    alert(
                        "Unable to submit article: " +
                        error.message
                    );

                    return;

                }


                alert(
                    "Article submitted for approval."
                );


                loadArticles();

            }
        );


        myArticles.appendChild(card);

    });

}


// =========================
// RESET EDITOR
// =========================

function resetEditor(){

    editingArticleId = null;


    form.reset();


    contentEditor.innerHTML =
        "";


    editorTitle.textContent =
        "Write News Article";


    cancelEditButton.style.display =
        "none";

}


// =========================
// CANCEL EDIT
// =========================

cancelEditButton.addEventListener(
    "click",
    () => {

        resetEditor();

    }
);


// =========================
// START
// =========================

(async () => {

    const loggedIn =
        await checkUser();


    if(!loggedIn)
        return;


    await loadArticles();

})();        
                
