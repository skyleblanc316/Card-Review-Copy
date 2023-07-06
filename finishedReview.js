// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";

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
    getDoc
  } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

let db = getFirestore(app);

const pgStartReviewClicked = sessionStorage.getItem('PrevHTMLPg');
const returnButton = document.getElementById('returnHome');
if (pgStartReviewClicked === "homeScreen"){
    returnButton.innerHTML = "Return to Home Screen";
}
else{
    returnButton.innerHTML = "Return to Deck Screen";
}
const deckID = document.getElementById('deckID');
const totalReviewed = document.getElementById('totalReviewed');
const numCorrect = document.getElementById('numCorrect');
const numMissed = document.getElementById('numMissed');
const score = document.getElementById('score');

//display results from review session
const deckName = (await getDoc(doc(db, "decks", sessionStorage.getItem('DeckID')))).data().DeckName;
deckID.innerHTML = deckName;
const correct = sessionStorage.getItem("numCorrect");
const incorrect = sessionStorage.getItem("numMissed");
const total = parseInt(correct) + parseInt(incorrect);
totalReviewed.innerHTML += total;
numCorrect.innerHTML += correct;
numMissed.innerHTML += incorrect;
// if (total > 0){
//     score.innerHTML += (Math.round((correct / total) * 100 * 100)) / 100 + "%";
// }
// else{
//     score.innerHTML = "0%";
// }

google.charts.load("current", {packages:["corechart"]});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    var data = google.visualization.arrayToDataTable([
        ['Task', 'Hours per Day'],
        ['Correct',  parseInt(correct)],
        ['Incorrect', parseInt(incorrect)]
    ]);

    var options = {
        title: '',
        is3D: true,
    };

    var chart = new google.visualization.PieChart(document.getElementById('piechart_3d'));
    chart.draw(data, options);
}
//delete cookie on number of flashcards correct/missed in last review session
sessionStorage.removeItem("numCorrect");
sessionStorage.removeItem("numMissed");

async function main(){
    const startNewReviewButton = document.getElementById('startNewReview')
    const returnHomeButton = document.getElementById('returnHome');
    
    returnHomeButton.addEventListener("click", async e =>{
        e.preventDefault();
        if (pgStartReviewClicked === "homeScreen"){
            sessionStorage.removeItem('DeckID');                //remove saved cookie of DeckID
            window.location.href = "./homeScreen.html";
        }
        else{
            sessionStorage.setItem('PrevHTMLPg', "finishedReview");
            window.location.href = "./deckDetails.html";
        }
        return false;
    })

    startNewReviewButton.addEventListener("click", async e =>{
        e.preventDefault();
        console.log("Starting new review...");
        //Still need to link back to reviewSession.html
        window.location.href = "./reviewSession.html";
        return false;
    })
}

main();