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
    getDoc,
    query,
    getDocs,
    collection,
    setDoc
  } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

let db = getFirestore(app);

const form = document.getElementById('loginpage');
const username = document.getElementById('username');
const password = document.getElementById('password');
var warningOn = false;

async function main() {
  // Listen to the form submission
  form.addEventListener('submit', async e => {
    // Prevent the default form redirect
    e.preventDefault();

    const docRef = doc(db, "users", username.value.toLowerCase());
    const docSnap = await getDoc(docRef);

    const users = query(collection(db,"users"));
    const userList = await getDocs(users);

    var count = 0;
    userList.forEach(() => {
      ++count;
    });

    if (count >= 20)
    {
      var warning = document.getElementById('warningMessage');
      warning.innerHTML = "Unable to create user profile. Maximum number of profiles reached";
      warning.style.color = "red";
      warningOn = true;
    }
    else if (docSnap.exists()) {
      //write warning message if not already on
      if (!warningOn){
        var warning = document.getElementById('warningMessage');
        warning.innerHTML = "This username is already taken. Please try another.";
        warning.style.color = "red";
        warningOn = true;
      }
    } 
    else if (password.value.length < 6)
    {
      var warning = document.getElementById('warningMessage');
      warning.innerHTML = "Password must be at least 6 characters long";
      warning.style.color = "red";
      warningOn = true;
    }
    else {
      // username is unique 
      // add user to database
      await setDoc(doc(db, "users", username.value.toLowerCase()), {
        username: username.value.toLowerCase(),
        password: password.value
      });

      //return to login page
      window.location.href = "./login.html";
    }     

    // clear message input fields
    username.value = '';
    password.value = '';
    // Return false to avoid redirect
    return false;
  });
}

main();