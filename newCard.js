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
    addDoc,
    collection
  } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

let db = getFirestore(app);
const deck = sessionStorage.getItem('DeckID');
const question = document.getElementById('cardFront');
const answer = document.getElementById('cardBack');
const createFlashcardButton = document.getElementById('createFlashcard');
const nullDate = "2023/01/01";

//Level initialized to 0
//nextDateAppearance initialize to nullDate
async function CardCreate(AnswerD, DeckIDD, QuestionD)//I am using place holder names so that you know what goes where, change these variables as you see fit.
{
  //the 'D' was added to the variables to distinguish them as the data
  //document ID for these will end up being randomized
  return new Promise((resolve) =>{
    addDoc(collection(db, "Flashcard"),{
      DeckID: DeckIDD,
      Question: QuestionD,
      Answer: AnswerD,
      Level: 0,
      nextDateAppearance: nullDate
    }).then(() => {
        resolve("Completed delete. Returning to listen2SubmitButton.");
        }).catch(error => {
          console.log(error);
        });
  })
}

async function listen2SubmitButton(){
    createFlashcardButton.addEventListener("click", async e => {
        if (question.value === ""){
            question.value = "";
            question.placeholder = "Question can not be empty.";
        }

        if (answer.value === ""){
            question.value = "";
            question.placeholder = "Answer can not be empty.";
        }

        if (question.value != "" && answer.value != ""){
            await CardCreate(answer.value, deckID, question.value);
            //console.log("Returning to main!")
            sessionStorage.setItem('PrevHTMLPg', "newCard");
            window.location.href = "./deckDetails.html";
        }
    });
}

listen2SubmitButton();