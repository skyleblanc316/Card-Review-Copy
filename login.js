// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjmx_8Xdr9-kqDsjs_zlhdupZJD0keO4M",
  authDomain: "weblogindemo-2640e.firebaseapp.com",
  projectId: "weblogindemo-2640e",
  storageBucket: "weblogindemo-2640e.appspot.com",
  messagingSenderId: "61954503747",
  appId: "1:61954503747:web:f1aaa27126f738a1c410f6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Add the Firebase products and methods that you want to use
// addDoc: adds new "row"
// collection: "table" of users, decks, flashcards, etc.
import {
    getFirestore,
    doc,
    updateDoc,
    getDoc,
    deleteDoc
  } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

let db = getFirestore(app);

const form = document.getElementById('loginpage');
const username = document.getElementById('username');
const password = document.getElementById('password');
var errorMessageOn = false;

async function main() {
  // Listen to the form submission
  form.addEventListener('submit', async e => {
    // Prevent the default form redirect
    e.preventDefault();

    //check that username is not empty
    if (username.value === ""){
      console.log("No username provided.")
        if (!errorMessageOn){
          var error = document.getElementById('warningMessage');
          error.innerHTML = "Incorrect username or password. Please try again.";
          error.style.color = "red";
          errorMessageOn = true;
        }
    }
    else{
      //check to see if user entered valid username and password
      //ASSUME: doc id = username
      const docRef = doc(db, "users", username.value.toLowerCase());
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        //username exists
        //check if password is correct
        const savedPassword = docSnap.data().password;
        if (savedPassword === password.value){
          //entered correct password & username
          //go to home page
          console.log("Correctly entered username and password...")
          sessionStorage.setItem("userID", username.value.toLowerCase());
          window.location.href = "./homeScreen.html";
        }
        else{
          //password entered is incorrect
          console.log("Incorrect password")
          if (!errorMessageOn){
            var error = document.getElementById('warningMessage');
            error.innerHTML = "Incorrect username or password. Please try again.";
            error.style.color = "red";
            errorMessageOn = true;
          }
        }
      }
      else{
        console.log("Not a valid username")
        //user does NOT exist
        //display error message -> username incorrect
        if (!errorMessageOn){
          var error = document.getElementById('warningMessage');
          error.innerHTML = "Incorrect username or password. Please try again.";
          error.style.color = "red";
          errorMessageOn = true;
        }
      }
    }

    // clear message input fields
    username.value = '';
    password.value = '';
    // Return false to avoid redirect
    return false;
  });
}

main();
