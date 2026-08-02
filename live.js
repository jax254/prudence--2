import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


const title = document.getElementById("title");
const preacher = document.getElementById("preacher");
const description = document.getElementById("description");
const streamLink = document.getElementById("streamLink");

const requestLive = document.getElementById("requestLive");
const liveList = document.getElementById("liveList");


let currentUser = null;
let profile = null;


// Check user login

onAuthStateChanged(auth, async(user)=>{


    if(!user){

        window.location.href="login.html";

        return;

    }


    currentUser = user;


    const userRef = doc(db,"users",user.uid);

    const userSnap = await getDoc(userRef);



    if(userSnap.exists()){

        profile = userSnap.data();

    }


    loadLiveBroadcasts();


});



// Request Live Broadcast

requestLive.addEventListener("click", async()=>{


    if(
        title.value.trim()==="" ||
        preacher.value.trim()==="" ||
        description.value.trim()===""
    ){

        alert("Please fill all required fields.");

        return;

    }



    await addDoc(collection(db,"liveStreams"),{


        uid:currentUser.uid,

        username:profile.username,

        title:title.value,

        preacher:preacher.value,

        description:description.value,

        streamLink:streamLink.value,

        approved:false,

        status:"Pending",

        createdAt:serverTimestamp()


    });



    alert("Your live broadcast request has been sent for approval.");



    title.value="";
    preacher.value="";
    description.value="";
    streamLink.value="";


});




// Display approved broadcasts

function loadLiveBroadcasts(){



    const q=query(

        collection(db,"liveStreams"),

        where("approved","==",true)

    );



    onSnapshot(q,(snapshot)=>{


        liveList.innerHTML="";



        if(snapshot.empty){


            liveList.innerHTML=
            "<p>No live broadcasts available.</p>";

            return;


        }




        snapshot.forEach((item)=>{


            const live=item.data();



            liveList.innerHTML += `


            <div class="live-card">


                <h3>${live.title}</h3>


                <p>
                Preacher: ${live.preacher}
                </p>


                <p>
                ${live.description}
                </p>



                ${
                    live.streamLink

                    ?

                    `
                    <iframe
                    src="${live.streamLink}"
                    allowfullscreen>
                    </iframe>
                    `

                    :

                    ""

                }



            </div>


            `;



        });



    });



}
