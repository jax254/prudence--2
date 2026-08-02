const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const nodemailer = require("nodemailer");

initializeApp();

const db = getFirestore();
const auth = getAuth();

// Replace these with your email credentials
const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: "prudence2.noreply@gmail.com",

        pass: "YOUR_APP_PASSWORD"

    }

});

// Send Welcome Email
exports.sendWelcomeEmail = onDocumentCreated(
"users/{userId}",

async (event)=>{

    const data = event.data.data();

    if(!data.email) return;

    const mailOptions = {

        from: '"Prudence 2" <prudence2.noreply@gmail.com>',

        to: data.email,

        subject: "Welcome to Prudence 2",

        html: `

        <h2>Welcome to Prudence 2</h2>

        <p>

        Thank you for joining Prudence 2.

        </p>

        <p>

        This is where you will continue to grow
        your faith in Christ Jesus and meet
        other Christians around the world.

        </p>

        <p>

        May God richly bless you.

        </p>

        <br>

        <strong>

        Prudence 2 Team

        </strong>

        `

    };

    await transporter.sendMail(mailOptions);

});
