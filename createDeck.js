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
import {
    getFirestore,
    setDoc,
    collection,
    query,
    where,
    doc, 
    getDoc,
    getDocs,
    addDoc
  } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

let db = getFirestore(app);

const createDeckSection = document.getElementById('createDeckSection');
const newDeckName = document.getElementById('DeckName');
const warningMessage = document.getElementById('warningMessage');
const user = sessionStorage.getItem('userID');
const cancelButton = document.getElementById('Cancel');
const delay = ms => new Promise(res => setTimeout(res, ms));

const defaultOrderType = "Random";
const defaultReviewType = "Daily";
const nullDate = "2023/01/01";

async function DeckCreate(DeckNameD, userIDD)//same situation for CardCreate function in terms of variables
{
    return new Promise((resolve) =>{
        //this variation allows us to specify the document ID rather than letting it randomize
        console.log("Adding deck... in DeckCreate")
        const date = new Date();
        var past7Days = [];
        for (let d = 6; d >= 0; d--){
            const day = new Date(date.getTime() - (d * 24 * 60 * 60 * 1000));
            past7Days.push((day.getMonth() + 1) + "/" + day.getDate());
        }
        var correctPast7Days = new Array(7).fill(0);
        var incorrectPast7Days = new Array(7).fill(0);
        addDoc(collection(db, "decks"),
        {
            userID: userIDD,
            DeckName: DeckNameD,
            reviewType: defaultReviewType,
            orderType: defaultOrderType,
            numNewCards: 0,
            resume: nullDate,
            dateReviewed: past7Days,
            correct: correctPast7Days,
            incorrect: incorrectPast7Days
        }).then((docRef) => {
                console.log("Entire Document has been deleted successfully.")
                console.log("docRef.id: " + docRef.id)
                sessionStorage.setItem("DeckID", docRef.id);
                resolve();
            }).catch(error => {
                console.log("ERROR here!")
                console.log(error);
            });
    })
}

//retrieve the total number of decks a user has
async function getNumDecks(){
    const decks = query(collection(db, "decks"), where("userID", "==", user));
    const decksSnapshot = await getDocs(decks);
    var numDecks = 0;
    decksSnapshot.forEach((deck) => {
      ++numDecks;
    });
    return numDecks;
}

async function listen2CreateDeck(){
    
    createDeckSection.addEventListener("submit", async e =>{
        e.preventDefault();
        var numDecks = await getNumDecks();
        //check that the number of decks is < 5
        if (numDecks >= 20){
            warningMessage.innerHTML = "Maximum of 20 decks already created. Returning to home in 5 seconds."
            warningMessage.style.color = "red";
            await delay(5000);
            window.location.href = "./homeScreen.html";
        }
        //check that inputted deck name is not empty
        else if (newDeckName.value.length === 0){
            warningMessage.innerHTML = "Deck name can not be empty.";
            warningMessage.style.color = "red";
        }
        else{
            console.log("Inputted Deck Name: " + newDeckName.value)
            console.log("user: " + user)
            //check that inputted deck name is unique (APPLIES TO ALL REGARDLESS OF USER)
            const decks = query(collection(db, "decks"), where('userID', '==', user));
            const decksSnapshot = await getDocs(decks);
            var existingDeckNames = [];
            var counter = 0;
            console.log("Successfully queried")

            //get existing deck names
            decksSnapshot.forEach((deck) => {
                existingDeckNames[counter] = deck.data().DeckName;
                ++counter;
            });

            if (existingDeckNames.includes(newDeckName.value)){
                //inputted deck name already exists
                warningMessage.innerHTML = "Deck name already exists. Please try another."
                warningMessage.style.color = "red";
                newDeckName.value = "";                 //reset value
            }
            else{
                //inputted deck name is unique
                //add deck
                console.log("Creating deck...")
                await DeckCreate(newDeckName.value, user);
                console.log("Successfully created!");
                window.location.href = "./deckDetails.html";
            }
        }
    })

    cancelButton.addEventListener("click", async e =>{
        //return to home screen
        window.location.href = "./homeScreen.html";
    })
}

listen2CreateDeck();