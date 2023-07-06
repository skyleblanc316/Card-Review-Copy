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
    setDoc,
    collection,
    query,
    where,
    doc, 
    updateDoc,
    getDoc, 
    deleteDoc,
    writeBatch,
    getDocs
  } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';

let db = getFirestore(app);

//CONSTANTs
const nullDate = "2023/01/01";
const defaultOrderType = "Random";
const defaultReviewType = "Daily";

const user = sessionStorage.getItem('userID');

//Document Elements
const logoutButton = document.getElementById('logoutButton');
const afterdeck = document.getElementById('afterDeck');
const selectAllDecks = document.getElementById('selectAll');
const deleteButton = document.getElementById('deleteDeck');
const deckList = document.getElementById('DeckList');

const createDeckSection = document.getElementById('createDeckSection');
const newDeckName = document.getElementById('DeckName');
const warningMessage = document.getElementById('warningMessage');
const cancelButton = document.getElementById('Cancel');

var numCheckboxesClicked = 0;

async function listen2SelectAll(){
  selectAllDecks.addEventListener("click", async e=>{
    const deckIDs = await getDeckIDs();
    if (selectAllDecks.checked){
      //check all boxes
      for (let index = 0; index < deckIDs.length; index++){
        document.getElementById("check" + deckIDs[index]).checked = true;
        document.getElementById("check" + deckIDs[index]).style.visibility = "visible";
        document.getElementById("line" + deckIDs[index]).style.backgroundColor = "#0041CA";
        document.getElementById("line" + deckIDs[index]).style.color = "black";
        numCheckboxesClicked = deckIDs.length;
      }
    }else{
      //UNcheck all boxes
      for (let index = 0; index < deckIDs.length; index++){
        document.getElementById("check" + deckIDs[index]).checked = false;
        document.getElementById("check" + deckIDs[index]).style.visibility = "hidden";
        document.getElementById("line" + deckIDs[index]).style.backgroundColor = "#12a5da";
        document.getElementById("line" + deckIDs[index]).style.color = "white";
        deleteButton.style.visibility = "hidden";
        numCheckboxesClicked = 0;
      }
    }
    if(numCheckboxesClicked > 0){
      deleteButton.style.visibility = "visible";    //@Justin Do NOT remove the following line. Not for styling purposes
    }
    else{
      deleteButton.style.visibility = "hidden";     //@Justin Do not delete this line
    }
  })
}

//DeleteDeck to be fixed...
async function DeleteDeck(DeckID) //it is expected that the id of the deck being deleted will be provided to this function
{
  return new Promise(async (resolve) => {
    const DeckRef = doc(db, "decks", DeckID);
    const deckSearch = query(collection(db, 'Flashcard'), where('DeckID', '==', DeckID));
    const batch = writeBatch(db);//create batch

    const deckSearchQuerySnapshot = await getDocs(deckSearch);//get documents related to the query
    deckSearchQuerySnapshot.forEach(doc => batch.delete(doc.ref));//delete all the documents related to the query

    batch.commit();

    deleteDoc(DeckRef).then(() => {
      resolve("Completed Delete. Should return to main.");
      }).catch(error => {
        console.log(error);
      });
  });
}

async function listen2DeleteButton(){
  deleteButton.addEventListener("click", async e =>{
    const deckIDs = await getDeckIDs();
    if (confirm("Are you sure you want to delete the deck(s)?\nIt will also delete all the flashcards inside") == true)
    {
      for (let index = 0; index < deckIDs.length; index++){
        const deckID = deckIDs[index];
        if (document.getElementById("check" + deckID).checked){
          console.log("Deck being deleted: " + deckID)
          await DeleteDeck(deckID);
          deckList.removeChild(document.getElementById("line" + deckID));
        }
      }
      deleteButton.style.visibility = "hidden";
      //window.location.href = "./homeScreen.html";   //reload the webpage after delete
    }
  });
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

//retrieve the deckIDs of user
async function getDeckIDs(){
  const decks = query(collection(db, "decks"), where("userID", "==", user));
  const decksSnapshot = await getDocs(decks);
  var deckIDs = [];
  var counter = 0;

  //get existing deck ids
  decksSnapshot.forEach((deck) => {
    deckIDs[counter] = deck.id;
    ++counter;
  });
  return deckIDs;
}

//displays add deck button for less than 5 decks
async function displayAddDecksButton()
{
  const numDecks = await getNumDecks();
  console.log(numDecks)
  if (numDecks < 20)
  {
    var addDecks = document.createElement("button")
    addDecks.innerHTML = "+";
    addDecks.id = "addDecks";
    addDecks.className = "add-decks";
    afterdeck.appendChild(addDecks);
    addDecks.addEventListener("click", async e =>{
      //if user presses add deck button, go to createDeck.html
      //window.location.href = "./createDeck.html";
      createDeckSection.style.display = "flex";
      addDecks.style.visibility = "hidden";
    })
  }
  else
  {
    console.log("ERROR: More than 5 decks created")
  }
}

function UpdateDeck(DeckID, dateReviewedD, correctD, incorrectD){
  return new Promise((resolve) =>{
    //create reference variables for the document and the data that will be updated
    const deckRef = doc(db, "decks", DeckID);
    const data = {
      dateReviewed: dateReviewedD,
      correct: correctD,
      incorrect: incorrectD
    };
    //function that updates the document; adds info to the console if successful or not
    updateDoc(deckRef, data).then(() => {
      resolve(console.log("Updates have been made to the deck"));
    }).catch(error => {
      console.log(error);
      })
  })
}

// displays the user's decks on the home screen
async function displayDecks()
{
  const decks = query(collection(db, "decks"), where("userID", "==", user));
  const decksSnapshot = await getDocs(decks);
  decksSnapshot.forEach(async (deck) => {
    /*Update the deck's history*/
    const dateReviewed = deck.data().dateReviewed;
    const correct = deck.data().correct;
    const incorrect = deck.data().incorrect;

    const date = new Date();
    
    console.log("Line 214: " + deck.id)
    if (dateReviewed[dateReviewed.length-1] != ((date.getMonth() + 1) + "/" + date.getDate())){
      console.log("Updating Deck History!!")
      //gets the last seven days
      var past7Days = [];
      for (let d = 6; d >= 0; d--){
        const day = new Date(date.getTime() - (d * 24 * 60 * 60 * 1000));
        past7Days.push((day.getMonth() + 1) + "/" + day.getDate());
      }
      console.log(dateReviewed)
      console.log(past7Days)

      var startDate = -1;     //already 7 days user has not reviewed
      for (let i = 0; i < dateReviewed.length; i++){
        if (past7Days.includes(dateReviewed[i])){
          startDate = i;
          break;
        }
      }
      var correctPast7Days = new Array(7).fill(0);
      var incorrectPast7Days = new Array(7).fill(0);

      if (startDate != -1){
        correctPast7Days = correct.slice(startDate).concat(new Array(startDate).fill(0));
        incorrectPast7Days = incorrect.slice(startDate).concat(new Array(startDate).fill(0));
        await UpdateDeck(deck.id, past7Days, correctPast7Days, incorrectPast7Days);        
      }
    }
    else{
      console.log("did NOT update Deck History!!")
    }
    /*End Updating the deck's history */

    // overall deck line
    var deckLine = document.createElement('div');
    deckLine.setAttribute('id', "line" + deck.id);
    deckLine.className = "deck-line";
    
    // checkbox
    var checkbox4Delete = document.createElement("input");
    checkbox4Delete.type = "checkbox";
    checkbox4Delete.id = "check" + deck.id;
    checkbox4Delete.style.visibility = "hidden"; //@Justin Do NOT remove the following line. Not for styling purposes
    checkbox4Delete.className = "checkbox-4-delete";

    // button to open deck
    var deckButton = document.createElement('button');
    deckButton.className = "deck-button";
    deckButton.innerHTML = deck.data().DeckName;

    // start review button
    var startReviewButton = document.createElement("button");
    startReviewButton.innerHTML = "&#8594";
    startReviewButton.className = "start-review-button";

    // append elements to deckline
    deckLine.appendChild(checkbox4Delete);
    deckLine.appendChild(deckButton)
    deckLine.appendChild(startReviewButton);

    // append deckline to decklist
    deckList.appendChild(deckLine);

    //listen to see if user clicks on checkbox4Delete
    //if true, then unselect SelectAll checkbox if currently checked
    checkbox4Delete.addEventListener("click", e =>{
      if (selectAllDecks.checked){
        selectAllDecks.checked = false;
      }
    
      if (checkbox4Delete.checked){
        numCheckboxesClicked++;
        checkbox4Delete.style.visibility = "visible";
        deckLine.style.backgroundColor = "#0041CA";
      }else{
        numCheckboxesClicked--;
        deckLine.style.backgroundColor = "#12a5da";
      }
    
      if(numCheckboxesClicked > 0){
        deleteButton.style.visibility = "visible";   //@Justin Do NOT remove the following line. Not for styling purposes
      }
      else{
        deleteButton.style.visibility = "hidden";;     //@Justin Do not delete this line
      }
    });

    //listen to see if user clicks on a deck
    //If so, start a review session
    deckButton.addEventListener("click", async e =>{
      //save cookie of deck clicked by user
      sessionStorage.setItem("DeckID", deck.id);
      sessionStorage.setItem("PrevHTMLPg", "homeScreen");
      window.location.href = "./deckDetails.html";
      deckLine.style.transform = "translate(-5px, 5px)";
      deckLine.style.boxShadow = "none";
    });

    startReviewButton.addEventListener("click", async e =>{
      //save cookie of deck clicked by user
      sessionStorage.setItem("DeckID", deck.id);
      sessionStorage.setItem("PrevHTMLPg", "homeScreen");
      window.location.href = "./reviewSession.html";
    });

    deckLine.addEventListener("mouseover", e =>{
      if (!selectAllDecks.checked){
        checkbox4Delete.style.visibility = "visible";   //@Justin Do NOT delete this line
        if (!checkbox4Delete.checked) {
          deckLine.style.opacity = "0.8";
        }
      }
    })

    deckLine.addEventListener("mouseout", e =>{
      if (!checkbox4Delete.checked){
        checkbox4Delete.style.visibility = "hidden";     //@Justin Do NOT delete this line\
        if (!checkbox4Delete.checked) {
          deckLine.style.opacity = "1";
        }
      }
    })
  });

  listen2SelectAll();
  listen2DeleteButton();
}

//listen to see if user clicks on the logout button
//If so, return to login page
async function listen4Logout(){
  logoutButton.addEventListener('click', async e => {
    e.preventDefault();         // Prevent the default form redirect
    console.log("Logging out")
    sessionStorage.clear();     // Clear all saved "cookies"
    window.location.href = "./login.html";
  });
}

async function DeckCreate(DeckNameD, userIDD)//same situation for CardCreate function in terms of variables
{
    return new Promise(async (resolve) =>{
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
        //addDoc(collection(db, "decks"),
        await setDoc(doc(db, "decks", userIDD + "_" + DeckNameD), 
        {
            userID: userIDD,
            DeckName: DeckNameD,
            reviewType: defaultReviewType,
            orderType: defaultOrderType,
            numNewCards: 1,
            resume: nullDate,
            cardNum: 0, //"id" of next flashcard from this deck
            dateReviewed: past7Days,
            correct: correctPast7Days,
            incorrect: incorrectPast7Days,
            maximumLevel: 10, 
            reviewBurnedCards: false
        }).then((docRef) => {
                console.log("Entire Document has been deleted successfully.")
                // console.log("docRef.id: " + docRef.id)
                // sessionStorage.setItem("DeckID", docRef.id);
                sessionStorage.setItem("DeckID", userIDD + "_" + DeckNameD);
                resolve();
            }).catch(error => {
                console.log("ERROR here!")
                console.log(error);
            });
    })
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
          newDeckName.placeholder = "Can not be empty.";
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
              newDeckName.placeholder = "Deck name already exists. Please try another.";
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
      //window.location.href = "./homeScreen.html";
      var addDecks = document.getElementById("addDecks");
      createDeckSection.style.display = "none";
      newDeckName.value = "";   //set to empty string when cancel
      addDecks.style.visibility = "visible";
  })
}

//listen4DeleteDeck();
listen4Logout();
displayDecks();
displayAddDecksButton();
listen2CreateDeck();