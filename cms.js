import { auth, db } from "../js/firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const announcement = document.getElementById("announcement");
const verseReference = document.getElementById("verseReference");
const verseText = document.getElementById("verseText");
const notification = document.getElementById("notification");

const enableNews = document.getElementById("enableNews");
const enableChat = document.getElementById("enableChat");
const enablePrayer = document.getElementById("enablePrayer");
const enableLive = document.getElementById("enableLive");

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href="../login.html";
        return;

    }

    const profile=await getDoc(doc(db,"users",user.uid));

    if(!profile.exists() || profile.data().role!=="superadmin"){

        alert("Access denied.");

        location.href="../dashboard.html";

        return;

    }

    loadSettings();

});

async function loadSettings(){

    const settingsDoc=await getDoc(doc(db,"settings","website"));

    if(!settingsDoc.exists()) return;

    const data=settingsDoc.data();

    announcement.value=data.announcement||"";

    verseReference.value=data.verseReference||"";

    verseText.value=data.verseText||"";

    enableNews.checked=data.enableNews??true;

    enableChat.checked=data.enableChat??true;

    enablePrayer.checked=data.enablePrayer??true;

    enableLive.checked=data.enableLive??true;

}

document.getElementById("saveAnnouncement").onclick=async()=>{

    await setDoc(doc(db,"settings","website"),{

        announcement:announcement.value

    },{merge:true});

    alert("Announcement saved.");

};

document.getElementById("saveVerse").onclick=async()=>{

    await setDoc(doc(db,"settings","website"),{

        verseReference:verseReference.value,

        verseText:verseText.value

    },{merge:true});

    alert("Daily Bible verse saved.");

};

document.getElementById("saveFeatures").onclick=async()=>{

    await updateDoc(doc(db,"settings","website"),{

        enableNews:enableNews.checked,

        enableChat:enableChat.checked,

        enablePrayer:enablePrayer.checked,

        enableLive:enableLive.checked

    });

    alert("Website settings updated.");

};

document.getElementById("sendNotification").onclick=async()=>{

    if(notification.value===""){

        alert("Enter a notification.");

        return;

    }

    await setDoc(doc(db,"notifications",Date.now().toString()),{

        message:notification.value,

        createdAt:new Date()

    });

    notification.value="";

    alert("Notification sent.");

};
