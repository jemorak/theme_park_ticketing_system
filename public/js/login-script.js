'use strict'

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";


const domEmail = document.getElementById("email");
const domError = document.getElementById("error");
const domForm = document.getElementById("login-form");
const domPassword = document.getElementById("password");
const domSubmit = document.getElementById("login");

const firebaseCfg = {
    apiKey: "AIzaSyBfLAagqttK3tLwoMeWAs5ZKCn1JREMzto",
    authDomain: "ssp-rides.firebaseapp.com",
    projectId: "ssp-rides",
    storageBucket: "ssp-rides.appspot.com",
    messagingSenderId: "1062116643752",
    appId: "1:1062116643752:web:888463cf59ab298b63439d",
    measurementId: "G-KB245HTLWC"
};

const firebaseApp = initializeApp(firebaseCfg);
const firebaseAuth = getAuth();
// Listeners
domForm.addEventListener("change", () =>
    {
    domSubmit.disabled = !domForm.checkValidity();
    });
    domForm.addEventListener("submit", (event) =>
    {
    event.preventDefault();
    login();
    });


    function login()
    {
        signInWithEmailAndPassword(firebaseAuth, domEmail.value, domPassword.value)
        .then(async (userCredential) =>//signs in a user user the email and password from the request body
    {
        const idTokenCred = await userCredential.user.getIdToken();
        const jsonBody = JSON.stringify({ idToken: idTokenCred });//converts the id token to a json string
        // take the session  cookie and implement function to create it
        
        fetch ("/users/session-login", 
        { 
            method: "POST", 
            headers: 
            { 
                "Content-Type": "application/json" 
            }, 
                body: jsonBody 
        })
            .then(()=>
            {
                window.location.assign = "/rides/view-rides";
            })
            .catch ((err)=>
            {
                console.log(err);
                //status errors? - handle errors
            });
    
            domError.innerHTML = "";
        })
        .catch((error) =>
        {
            let erroMsg;
            switch(error.code)
            {
                case "auth/invalid-email":
                    errorMsg = "Invalid email address";
                    break;
                    //take a look at more error codes
            }
            domError.innerHTML = errorMsg;
        });	
    } 

