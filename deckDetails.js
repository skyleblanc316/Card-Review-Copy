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
function addZero2Date(num){
  if (num < 10){
    return '0' + num;
  }
  return num;
}

//CONSTANTs
const nullDate = "2023/01/01";  //default date
const nullDatePlus1 = "2023/01/02";
//get current date
var nowDate = new Date();
nowDate = nowDate.getFullYear()+'/'+addZero2Date((nowDate.getMonth()+1))+'/'+ addZero2Date(nowDate.getDate());

const deckID = sessionStorage.getItem('DeckID');
const deckSnap = await getDoc(doc(db, "decks", deckID));
const deckName = deckSnap.data().DeckName;
var maximumLevel = deckSnap.data().maximumLevel;

google.charts.load("current", {packages:["corechart"]});
google.charts.setOnLoadCallback(drawChart);

//Document Elements
const deckTitle = document.getElementById('deckTitle');
deckTitle.innerHTML = " > " + deckName;

const flashcardList = document.getElementById('FlashcardList');
const afterContent = document.getElementById('afterContent');
const deleteButton = document.getElementById('deleteFlashcard');
const selectAll = document.getElementById('selectAll');
const startReviewButton = document.getElementById('startReview');
const logoutButton = document.getElementById('logoutButton');
var numCheckboxesClicked = 0;
var editOpen = false; // to keep track of whether we already have the edit menu open

//Side bar tabs
const flashcardTab = document.getElementById('FlashcardsTab');
const SummaryTab = document.getElementById('SummaryTab');
const SettingsTab = document.getElementById('SettingsTab');

//Content for each side bar tab
const flashcardContent = document.getElementById('flashcardContent');
const summaryContent = document.getElementById('summaryContent');
const settingsContent = document.getElementById('settingsContent');
const prevHTMLPg = sessionStorage.getItem("PrevHTMLPg");

/******************* PROGRESS TAB************************************/
async function drawChart() {
  const deckSnap = await getDoc(doc(db, "decks", deckID));
  const dateReviewed = deckSnap.data().dateReviewed;
  const correct = deckSnap.data().correct;
  const incorrect = deckSnap.data().incorrect;

  var rowsOfData = dateReviewed.map(function(d, j) {
    return [d, correct[j], incorrect[j], ""];
  });

  console.log([['Date', 'Correct', "Incorrect", { role: 'annotation' }]].concat(rowsOfData))

  var data = google.visualization.arrayToDataTable([['Date', 'Correct', "Incorrect", { role: 'annotation' }]].concat(rowsOfData));

  var view = new google.visualization.DataView(data);
  view.setColumns([0, 1,
    { calc: "stringify",
      sourceColumn: 1,
      type: "string",
      role: "annotation" },
    2,{ calc: "stringify",
    sourceColumn: 2,
    type: "string",
    role: "annotation" }]);

  var options = {
    title: "Progress in the Last 7 Days",
    width: 700,
    height: 600,
    legend: { position: 'right'},
    bar: { groupWidth: '75%' },
    isStacked: false,
    vAxis: {minValue: 0},
    fontName: 'Times-Roman',
    fontSize: 17
  };

  var chart = new google.visualization.ColumnChart(document.getElementById("barchart_values"));
  chart.draw(view, options);
}

/********************* SETTINGS TAB ****************************************/ 
const editDeckName = document.getElementById('editDeckName');
const editSettingsButton = document.getElementById('editSettingsButton');
const reviewTypeOptions = document.getElementById('reviewTypeOptions');
const orderTypeOptions = document.getElementById('orderTypeOptions');
const saveSettingButton = document.getElementById('saveSettingButton');
const cancelSettingButton = document.getElementById('cancelSettingButton');
const editNumNewCards = document.getElementById('editNumNewCards');
const editNewCardsArea = document.getElementById('editNewCardsArea');
const editMaxFlashcardLevel = document.getElementById('editMaxFlashcardLevel');
const reviewBurnedCards = document.getElementById('reviewBurnedCards');
const editSettingsButtonRow = document.getElementById('editSettingsButtonRow');

var editingSettings = false;

//Initialize with current Deck settings
editDeckName.value = deckName;
editMaxFlashcardLevel.value = deckSnap.data().maximumLevel;
document.getElementById(deckSnap.data().reviewType).selected = 'selected';
document.getElementById(deckSnap.data().orderType).selected = 'selected';
if (deckSnap.data().reviewBurnedCards){
  document.getElementById('reviewBurned').selected = "selected";
}
else{
  document.getElementById('noReviewBurned').selected = "selected";
}
editNumNewCards.value = deckSnap.data().numNewCards;

if (deckSnap.data().reviewType === "Continuous"){
  editNewCardsArea.style.display = "initial";
}
else{
  editNewCardsArea.style.display = "none";
}
editDeckName.readOnly = true;     //set this to read Only initially
reviewTypeOptions.disabled = true;
orderTypeOptions.disabled = true;
reviewBurnedCards.disabled = true;
editNumNewCards.readOnly = true;
editMaxFlashcardLevel.readOnly = true;

reviewTypeOptions.onchange = function(){
  const selectedReviewType = reviewTypeOptions.options[reviewTypeOptions.options.selectedIndex].id;
  // console.log(selectedReviewType)

  if(selectedReviewType === "Continuous" && editingSettings){
    //allow user to edit the number of new flashcards to appear
    editNumNewCards.readOnly = false;
    editNewCardsArea.style.display = "initial";
  }
  else{
    editNumNewCards.readOnly = true;
    editNewCardsArea.style.display = "none";
  }
};

function UpdateDeck(DeckID, DeckNameD, reviewTypeD, orderTypeD, numNewCardsD, maxFlashcardLevel, reviewBurnedCardsD){
  return new Promise((resolve) =>{
    //create reference variables for the document and the data that will be updated
    const deckRef = doc(db, "decks", DeckID);
    const data = {
      DeckName: DeckNameD,
      reviewType: reviewTypeD,
      orderType: orderTypeD,
      numNewCards: numNewCardsD,
      maximumLevel: maxFlashcardLevel,
      reviewBurnedCards: reviewBurnedCardsD
    };
    //function that updates the document; adds info to the console if successful or not
    updateDoc(deckRef, data).then(() => {
      resolve(console.log("Updates have been made to the deck"));
    }).catch(error => {
      console.log(error);
      })
  })
}

const clickEditSettingsButton = (e) =>{
  console.log("Listened to Edit")
  editingSettings = true;

  //allow edits
  editDeckName.readOnly = false;
  editNumNewCards.readOnly = false;
  editMaxFlashcardLevel.readOnly = false;
  reviewTypeOptions.disabled = false;
  orderTypeOptions.disabled = false;
  reviewBurnedCards.disabled = false;

  //make save and cancel button appear
  //hide edit button
  editSettingsButtonRow.style.display = "flex";
  saveSettingButton.style.display = "inline";
  cancelSettingButton.style.display = "inline";
  editSettingsButton.style.display = "none";

  editSettingsButton.removeEventListener("click", clickEditSettingsButton);
  cancelSettingButton.addEventListener("click", clickedCancelSettingsButton);
  saveSettingButton.addEventListener("click", clickedSaveSettingsButton);
}

const clickedCancelSettingsButton = async (e) =>{
  console.log("Listened to Cancel")

  // Reset deck settings to original
  const deckSnapCurrent = await getDoc(doc(db, "decks", deckID));
  editDeckName.value = deckSnapCurrent.data().DeckName;
  document.getElementById(deckSnapCurrent.data().reviewType).selected = 'selected';
  document.getElementById(deckSnapCurrent.data().orderType).selected = 'selected'; 
  editNumNewCards.value = deckSnapCurrent.data().numNewCards;

  if (deckSnapCurrent.data().reviewType === "Continuous"){
    editNewCardsArea.style.display = "initial";
  }else{
    editNewCardsArea.style.display = "none";
  }

  //make edit button visible
  editSettingsButton.style.display = "inline";
  saveSettingButton.style.display = "none";
  cancelSettingButton.style.display = "none";

  //disable edits
  editDeckName.readOnly = true;  
  editMaxFlashcardLevel.readOnly = true;
  reviewTypeOptions.disabled = true;
  orderTypeOptions.disabled = true;
  reviewBurnedCards.disabled = true;
  editNumNewCards.readOnly = true;

  editingSettings = false;
  cancelSettingButton.removeEventListener("click", clickedCancelSettingsButton);
  editSettingsButton.addEventListener("click", clickEditSettingsButton);
  saveSettingButton.removeEventListener("click", clickedSaveSettingsButton);
}

const clickedSaveSettingsButton = async (e) =>{
  console.log("Listened to Save")
  saveSettingButton.innerHTML = "Saving";

  //get the selected reviewType & orderType option
  const selectedReviewType = reviewTypeOptions.options[reviewTypeOptions.options.selectedIndex].id;
  const selectedOrderType = orderTypeOptions.options[orderTypeOptions.options.selectedIndex].id;
  var selectedReviewBurnedCards = reviewBurnedCards.options[reviewBurnedCards.options.selectedIndex].id
  if (selectedReviewBurnedCards === "reviewBurned"){
    selectedReviewBurnedCards = true;
  }else{
    selectedReviewBurnedCards = false;
  }
  console.log(selectedReviewType + ", " + selectedOrderType)
  var selectedNumNewCards = editNumNewCards.value;
  var selectedMaxLevel = parseInt(editMaxFlashcardLevel.value);

  //disable edits
  editDeckName.readOnly = true;  
  editMaxFlashcardLevel.readOnly = true;
  reviewTypeOptions.disabled = true;
  orderTypeOptions.disabled = true;
  reviewBurnedCards.disabled = true;
  editNumNewCards.readOnly = true;

  if (selectedNumNewCards > 0 && selectedMaxLevel > 0){
    const deckSnapCurrent = await getDoc(doc(db, "decks", deckID));
    console.log("current: " + deckSnapCurrent.data().reviewType)
    console.log("selected: " + selectedReviewType)

    //switching from daily to continuous
    if (deckSnapCurrent.data().reviewType === "Daily" & selectedReviewType === "Continuous"){
      console.log("Fixing dates when change from daily -> continuous")
        /*
        nullDatePlus1 = reviewed before at least once
        Level     reviewedToday     prev: nextDateAppear        set: nextDateAppearance
          0           yes            currentDate                 use formula: current + 1
          0           no              nullDate                           NULLDate -> is a new card
          0           no              nullDatePlus1                   currentDate
          >0          yes             currentDate                use formula: current + 2*level
          >0          no              nullDatePlus1                      use formula
        */

      const flashcardIDs = await getFlashcardIDs();
      for (var i = 0; i < flashcardIDs.length; i++){
        const flashcardSnap = await getDoc(doc(db, "Flashcard", flashcardIDs[i]));
        var updateNextDateAppr = nullDate;  //new cards

        //flashcard has been reviewed before
        if (flashcardSnap.data().reviewedToday != nullDate){
          var date = new Date();  //get current date
          //if flashcard was NOT reviewed on now/currentDate
          if (flashcardSnap.data().reviewedToday != nowDate){
            const reviewedTodayDate = flashcardSnap.data().reviewedToday;
            const rTYear = parseInt(reviewedTodayDate.substring(0, 4));
            const rTMonth = parseInt(reviewedTodayDate.substring(5, 7)) - 1;
            const rTDay = parseInt(reviewedTodayDate.substring(8));
            date = new Date(rTYear,rTMonth,rTDay);
          }

          if (flashcardSnap.data().Level === 0){
            //if level = 0, review flashcard the following day
            date.setDate(date.getDate() + 1);
          }
          else{
            date.setDate(date.getDate() + (2*flashcardSnap.data().Level));     //next date to be reviewed is 2*updateLevel days later
          }
          updateNextDateAppr = date.getFullYear()+'/'+ addZero2Date((date.getMonth()+1))+'/'+ addZero2Date(date.getDate());

        }

        await updateDoc(doc(db, "Flashcard", flashcardIDs[i]), {
          nextDateAppearance: updateNextDateAppr
        });
        //resume field is NOT reset since only Continuous sessions update it. 
      }
    }

    //change from continuous -> daily
    if (deckSnapCurrent.data().reviewType === "Continuous" & selectedReviewType === "Daily"){
      /*
        level     reviewedToday     nextDateAppearance      updatedNextDateAppearance
          0           yes             current + 1                 current/nowDate
          0           no              nullDate                    nullDate    -> card never reviewed
          0           no              !nullDate                   nullDatePlus1
          >0          yes        >current (based on formula)      current
          >0          no              !nullDate                   nullDatePlus1
      */
      const flashcardIDs = await getFlashcardIDs();
      var numFlashcardsReviewedToday = 0;
      var updatedDates = [];
      for (var i = 0; i < flashcardIDs.length; i++){
        const flashcardSnap = await getDoc(doc(db, "Flashcard", flashcardIDs[i]));
        if (flashcardSnap.data().reviewedToday === nowDate){
          //flashcard was reviewed on currentDate
          updatedDates[i] = nowDate;
          numFlashcardsReviewedToday = numFlashcardsReviewedToday + 1;
        }
        else if(flashcardSnap.data().reviewedToday === nullDate){
          //flashcard NEVER reviewed
          updatedDates[i] = nullDate;
        }
        else{
          //flashcard reviewed sometime between nullDate and currentDate (exclusive)
          updatedDates[i] = nullDatePlus1;
        }
      }

      //if all flashcards have been reviewed on currentDate, reset nextDate appearance to nullDatePlus1
      if(numFlashcardsReviewedToday === flashcardIDs.length){
        for (var i = 0; i < flashcardIDs.length; i++){
          await updateDoc(doc(db, "Flashcard", flashcardIDs[i]), {
            nextDateAppearance: nullDatePlus1
          });
        }
      }
      //otherwise update accordingly
      else{
        for (var i = 0; i < flashcardIDs.length; i++){
          await updateDoc(doc(db, "Flashcard", flashcardIDs[i]), {
            nextDateAppearance: updatedDates[i]
          });
        }
      }
    }

    await UpdateDeck(deckID, editDeckName.value, selectedReviewType, selectedOrderType, 
      selectedNumNewCards, selectedMaxLevel, selectedReviewBurnedCards);
    saveSettingButton.innerHTML = "Save";
    deckTitle.innerHTML = " > " + editDeckName.value;
    maximumLevel = selectedMaxLevel;
   
    removeAllFlashcards();
    displayFlashcards();

    //make edit button visible
    editSettingsButton.style.display = "inline";
    saveSettingButton.style.display = "none";
    cancelSettingButton.style.display = "none";

    saveSettingButton.removeEventListener("click", clickedSaveSettingsButton);
    cancelSettingButton.removeEventListener("click", clickedCancelSettingsButton);
    editSettingsButton.addEventListener("click", clickEditSettingsButton);

    editingSettings = false;
  }
  else{
    console.log("Invalid input")
    if (selectedNumNewCards <= 0){
      editNumNewCards.value = "";
      editNumNewCards.placeholder = "Invalid input. Must be > 0.";
    }else{
      editMaxFlashcardLevel.value = "";
      editMaxFlashcardLevel.placeholder = "Invalid input. Must be > 0.";
    }
  }
}

/********************* END SETTINGS TAB ****************************************/

// New Card window
const question = document.getElementById('cardFront');
const answer = document.getElementById('cardBack');
const createFlashcardButton = document.getElementById('createFlashcard');
const newCardWindow = document.getElementById('new-card-window');
const newCardWindowCancelButton = document.getElementById('cancelButton');

function UpdateCard (DocID, Question, Answer)//it is expected that the id of the card being updated will be provided to this function
{
  return new Promise((resolve) =>{
    //create reference variables for the document and the data that will be updated
    const CardRef = doc(db, "Flashcard", DocID);
    const data = {
      Question: Question,
      Answer: Answer
    };
    //function that updates the document; adds info to the console if successful or not
    updateDoc(CardRef, data).then(() => {
      resolve(console.log("Updates have been made to the card"));
    }).catch(error => {
      console.log(error);
      })
  })
}

async function DeleteCard(DocID) //it is expected that the id of the card being deleted will be provided to this function
{
  const CardRef = doc(db, "Flashcard", DocID);
  return new Promise((resolve) =>{
    deleteDoc(CardRef).then(() => {
      resolve(console.log("Entire Document has been deleted successfully."));
      }).catch(error => {
      console.log(error);
      });
  })
}

async function removeAllFlashcards(){
  const flashcardIDs = await getFlashcardIDs();
  console.log("Deleting...")
  for (let index = 0; index < flashcardIDs.length; index++){
    const flashcardID = flashcardIDs[index];
    console.log("FlashcardID: " + flashcardID)
    if (document.getElementById("line" + flashcardID)){
      flashcardList.removeChild(document.getElementById("line" + flashcardID));
    }
  }
}

//retrieve the total number of decks a user has
async function getFlashcardIDs(){
  const flashcards = query(collection(db, "Flashcard"), where("DeckID", "==", deckID));
  const flashcardSnapshot = await getDocs(flashcards);
  var flashcardIDs = [];
  var counter = 0;

  //get existing deck names
  flashcardSnapshot.forEach((flashcard) => {
    flashcardIDs[counter] = flashcard.id;
    ++counter;
  });
  return flashcardIDs;
}

//retrieve the total number of decks a user has
async function getNumFlashcards(){
  const flashcards = query(collection(db, "Flashcard"), where("DeckID", "==", deckID));
  const flashcardsSnapshot = await getDocs(flashcards);
  var numFlash = 0;
  flashcardsSnapshot.forEach((FC) => {
    ++numFlash;
  });
  return numFlash;
}

async function displayAddFlashcardsButton()
{
  const numFlash = await getNumFlashcards();
  console.log(numFlash)
  if (numFlash < 50)
  {
    var addFlashcard = document.createElement("button")
    addFlashcard.innerHTML = "+";
    addFlashcard.className = "add-flashcard";
    addFlashcard.id = "addFlashcardButton";
    afterContent.appendChild(addFlashcard);
    addFlashcard.addEventListener("click", e => {
      //go to newCard.html to add new flashcard
      //window.location.href = "./newCard.html";

      // open create card window
      newCardWindow.style.display = "flex";
      addFlashcard.style.display = "none";
    })
  }
  else
  {
    console.log("ERROR: More than 5 decks created")
  }
}

//check if user selected all decks
async function listen2SelectAll(){
  selectAll.addEventListener("click", async e=>{
    const flashcardIDs = await getFlashcardIDs();
    if (selectAll.checked){
      //check all boxes
      for (let index = 0; index < flashcardIDs.length; index++){
        document.getElementById("check" + flashcardIDs[index]).checked = true;
        document.getElementById("check" + flashcardIDs[index]).style.visibility = "visible";
        document.getElementById("line" + flashcardIDs[index]).style.backgroundColor = "#def1fd";
        document.getElementById("line" + flashcardIDs[index]).firstChild.style.backgroundColor = "#def1fd";
        numCheckboxesClicked = flashcardIDs.length;
      }
    }else{
      //UNcheck all boxes
      for (let index = 0; index < flashcardIDs.length; index++){
        document.getElementById("check" + flashcardIDs[index]).checked = false;
        document.getElementById("check" + flashcardIDs[index]).style.visibility = "hidden";
        document.getElementById("line" + flashcardIDs[index]).style.backgroundColor = "#ededed";
        document.getElementById("line" + flashcardIDs[index]).firstChild.style.backgroundColor = "#ededed";
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

async function listen2DeleteButton(){
  deleteButton.addEventListener("click", async e =>{
    const flashcardIDs = await getFlashcardIDs();
    if (confirm("Are you sure you want to delete the flashcard(s)?") == true)
    {
      for (let index = 0; index < flashcardIDs.length; index++){
        const flashcardID = flashcardIDs[index];
        if (document.getElementById("check" + flashcardID).checked){
          console.log("Flashcard being deleted: " + flashcardID)
          await DeleteCard(flashcardID);
          if (document.getElementById("line" + flashcardID)){
            flashcardList.removeChild(document.getElementById("line" + flashcardID));
          }
        }
      }
      deleteButton.style.visibility = "hidden";
      sessionStorage.setItem('PrevHTMLPg', "newCard");

      // reload webpage after delete for nice corners
      removeAllFlashcards();
      displayFlashcards();
      //window.location.href = "./deckDetails.html";   //reload the webpage after delete
    }
  });
}

// displays the user's flashcards on the home screen
async function displayFlashcards()
{
  const flashcards = query(collection(db, "Flashcard"), where("DeckID", "==", deckID));
  const flashcardsSnapshot = await getDocs(flashcards);
  var numOfFlashCards = await getNumFlashcards();
  var counter = 0;
  flashcardsSnapshot.forEach((flashcard) => {
    ++counter;

    // create flashcard line
    var flashcardLine = document.createElement('div');
    flashcardLine.setAttribute('id', "line" + flashcard.id);
    flashcardLine.className = "flashcard-line";

    // two rows of flashcard line
    var flashcardLineRow1 = document.createElement('div');
    flashcardLineRow1.className = "flashcard-line-row-1";
    flashcardLineRow1.setAttribute('id', "row1" + flashcard.id);

    // to round corners of first and last flashcard line and when an edit window opens
    if (counter === 1)
    {
      flashcardLine.style.borderRadius = "1em 1em 0 0";
      flashcardLineRow1.style.borderRadius = "1em 1em 0 0";
    }
    if (counter === numOfFlashCards)
    {
      flashcardLine.style.borderRadius = "0 0 1em 1em";
      flashcardLineRow1.style.borderRadius = "0 0 1em 1em";
    }
    if (counter === 1 && counter === numOfFlashCards)
    {
      flashcardLine.style.borderRadius = "1em 1em 1em 1em";
      flashcardLineRow1.style.borderRadius = "1em 1em 1em 1em";
    }
    
    var checkbox4Delete = document.createElement("input");
    checkbox4Delete.type = "checkbox";
    checkbox4Delete.id = "check" + flashcard.id;
    checkbox4Delete.style.visibility = "hidden"; //@Justin Do NOT remove the following line. Not for styling purposes
    checkbox4Delete.className="checkbox-4-delete";

    //display flashcard question
    var flashcardQuestion = document.createElement("div");
    flashcardQuestion.id = flashcard.id;
    flashcardQuestion.innerHTML = flashcard.data().Question;
    flashcardQuestion.className = "flashcard-question";

    //add icon to edit flashcard
    var editFlashcard = document.createElement("div");
    editFlashcard.innerHTML = "Edit";  
    editFlashcard.id = counter;
    editFlashcard.className = "edit-flashcard";  

    flashcardLineRow1.appendChild(checkbox4Delete);
    flashcardLineRow1.appendChild(flashcardQuestion);
    flashcardLineRow1.appendChild(editFlashcard);

    if(flashcard.data().Level >= maximumLevel){
      //flashcard has been burned!
      console.log("Flashcard: " + flashcard.id + " is burned!!!")
      flashcardLineRow1.style.backgroundColor = "#d9c6f2";
    }
    else{
      flashcardLineRow1.style.backgroundColor = "#ededed";
    }
    flashcardLine.appendChild(flashcardLineRow1);
    flashcardList.appendChild(flashcardLine);

    //listen to see if user clicks on checkbox4Delete
    //if true, then unselect SelectAll checkbox if currently checked
    checkbox4Delete.addEventListener("click", e =>{
      if (selectAll.checked){
        selectAll.checked = false;
      }
    
      if (checkbox4Delete.checked){
        numCheckboxesClicked++;
        checkbox4Delete.style.visibility = "visible";
        flashcardLineRow1.style.backgroundColor = "#def1fd";
      }else{
        numCheckboxesClicked--;
        flashcardLineRow1.style.backgroundColor = "#ededed";
      }
    
      if(numCheckboxesClicked > 0){
        deleteButton.style.visibility = "visible";   //@Justin Do NOT remove the following line. Not for styling purposes
      }
      else{
        deleteButton.style.visibility = "hidden";;     //@Justin Do not delete this line
      }
    });

    editFlashcard.addEventListener("click", async e =>{
      // so we can only open one edit box
      if (editOpen)
        return;
      else
        editOpen = true;

      const flashcardRef = doc(db, "Flashcard", flashcard.id);
      const flashcardSnap = await getDoc(flashcardRef);

      const edit = document.createElement("div");
      edit.className = "edit";

      //Edit Question field
      const editQuestion = document.createElement("div");
      editQuestion.className = "edit-question-row";
      const inputQuestion = document.createElement('input');
      inputQuestion.type = "text";
      inputQuestion.value = flashcardSnap.data().Question;
      inputQuestion.id = "editQuestion";
      inputQuestion.className = "question-input";

      var questionLabel = document.createElement("Label");
      questionLabel.setAttribute("for",inputQuestion);
      questionLabel.innerHTML = "Question";
      questionLabel.className = "question-label";

      //add label & input field for question
      editQuestion.appendChild(questionLabel);
      editQuestion.appendChild(inputQuestion);
      edit.appendChild(editQuestion);

      //Edit Answer field
      const editAnswer = document.createElement("div");
      editAnswer.className = "edit-answer-row";
      const inputAnswer = document.createElement('input');
      inputAnswer.type = "text";
      inputAnswer.id = "editAnswer";
      inputAnswer.value = flashcardSnap.data().Answer;
      inputAnswer.className = "answer-input";

      //add label & input field for answer
      var answerLabel = document.createElement("Label");
      answerLabel.setAttribute("for",inputAnswer);
      answerLabel.innerHTML = "Answer";
      answerLabel.className = "answer-label";

      editAnswer.appendChild(answerLabel);
      editAnswer.appendChild(inputAnswer);
      edit.appendChild(editAnswer);

      //buttons to submit or cancel
      const buttonsLine = document.createElement("div");
      buttonsLine.className = "edit-buttons-row";
      const saveChanges = document.createElement('button');
      saveChanges.innerHTML = "Save";
      saveChanges.id = "save-" + editFlashcard.id;
      saveChanges.className = "save-button";

      const cancelChanges = document.createElement('button');
      cancelChanges.innerHTML = "Cancel";
      cancelChanges.id = "cancelChanges";
      cancelChanges.className = "edit-cancel-button";
      console.log(edit.id);
      cancelChanges.id = "cancel-" + editFlashcard.id;

      buttonsLine.append(saveChanges);
      buttonsLine.append(cancelChanges);

      edit.appendChild(buttonsLine);
      flashcardLine.appendChild(edit);
      
      // if edit is placed last we want it to look like it isn't out of place
      if (e.target.id == numOfFlashCards)
      {
        edit.style.borderRadius = "0 0 1em 1em";
        edit.parentNode.style.borderRadius = "0";
        edit.parentNode.firstChild.style.borderRadius = "0";
      }

      if (e.target.id == numOfFlashCards && e.target.id == 1)
      {
        edit.style.borderRadius = "0 0 1em 1em";
        edit.parentNode.style.borderRadius = "1em 1em 0 0";
        edit.parentNode.firstChild.style.borderRadius = "1em 1em 0 0";
      }

      const removeEdit = (e) =>{

        if (e.target.id === "cancel-" + numOfFlashCards)
        {
          e.target.parentNode.parentNode.parentNode.firstChild.style.borderRadius = "0 0 1em 1em";
          e.target.parentNode.parentNode.parentNode.style.borderRadius = "0 0 1em 1em";
        }

        // if there is only one flashcard
        if (e.target.id === "cancel-" + numOfFlashCards && e.target.id === "cancel-1")
        {
          e.target.parentNode.parentNode.parentNode.firstChild.style.borderRadius = "1em 1em 1em 1em";
          e.target.parentNode.parentNode.parentNode.style.borderRadius = "1em 1em 1em 1em";
        }
        
        cancelChanges.removeEventListener("click", removeEdit);
        saveChanges.removeEventListener("click", saveChangesListener);
        flashcardLine.removeChild(edit);
        editOpen = false;
      }

      const saveChangesListener = async (e) =>{

        if (e.target.id === "save-" + numOfFlashCards)
        {
          e.target.parentNode.parentNode.parentNode.firstChild.style.borderRadius = "0 0 1em 1em";
          e.target.parentNode.parentNode.parentNode.style.borderRadius = "0 0 1em 1em";
        }

        // if there is only one flashcard
        if (e.target.id === "save-" + numOfFlashCards && e.target.id === "save-1")
        {
          e.target.parentNode.parentNode.parentNode.firstChild.style.borderRadius = "1em 1em 1em 1em";
          e.target.parentNode.parentNode.parentNode.style.borderRadius = "1em 1em 1em 1em";
        }

        await UpdateCard (flashcard.id, inputQuestion.value, inputAnswer.value);
        flashcardQuestion.innerHTML = inputQuestion.value;
        cancelChanges.removeEventListener("click", removeEdit);
        saveChanges.removeEventListener("click", saveChangesListener);
        flashcardLine.removeChild(edit);
        editOpen = false;
      }

      saveChanges.addEventListener("click", saveChangesListener);

      cancelChanges.addEventListener("click", removeEdit);
    });

    flashcardLine.addEventListener("mouseover", e =>{
      if (!selectAll.checked){
        checkbox4Delete.style.visibility = "visible";   //@Justin Do NOT delete this line
      }
    })

    flashcardLine.addEventListener("mouseout", e =>{
      flashcardLine.style.borderStyle = "none";
      if (!checkbox4Delete.checked){
        checkbox4Delete.style.visibility = "hidden";     //@Justin Do NOT delete this line
      }
    })
  });
}

async function listen2StartReview(){
  startReviewButton.addEventListener("click", e =>{
    sessionStorage.setItem("PrevHTMLPg", "deckDetails");
    window.location.href = "./reviewSession.html";
  })
}

//only runs if user has no flashcards in deck
//give a tip to user!
async function listen2RemoveTip(){
  if (await getNumFlashcards() === 0){
    console.log("came here!")
    const tipNoFlashcards = document.getElementById('tipNoFlashcards');
    const closeTip = document.getElementById('closeTipNoFlashcard');
    tipNoFlashcards.style.visibility = "visible";
  
    const removeTip = async (e) =>{
      tipNoFlashcards.style.visibility = "hidden";
      closeTip.removeEventListener("click", removeTip);
    }
  
    closeTip.addEventListener("click", removeTip);
    console.log("ended came here!")
  }
}

async function listen2Tabs(){
  console.log("Listening 2 TABS")
  drawChart();
  displayFlashcards();
  displayAddFlashcardsButton();

  flashcardTab.addEventListener("click", async (e) =>{
    flashcardContent.style.display = "initial";
    summaryContent.style.display = "none";
    settingsContent.style.display = "none";
  })

  SummaryTab.addEventListener("click", async (e) =>{
    summaryContent.style.display = "initial";
    flashcardContent.style.display = "none";
    settingsContent.style.display = "none";
  })

  SettingsTab.addEventListener("click", async (e) =>{
    settingsContent.style.display = "flex";
    summaryContent.style.display = "none";
    flashcardContent.style.display = "none";
  })
}

if (prevHTMLPg === "newCard"){
  summaryContent.style.display = "none";
  flashcardContent.style.display = "initial";
}

// if (prevHTMLPg === "settings"){
//   settingsContent.style.display = "initial";
//   flashcardContent.style.display = "none";
//   summaryContent.style.display = "none";
// }

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

// For creating card with create card window
//Level initialized to 0
//nextDateAppearance initialize to nullDate
async function CardCreate(AnswerD, DeckIDD, QuestionD)//I am using place holder names so that you know what goes where, change these variables as you see fit.
{
  console.log("In card create deck details")
  const deckSnap = await getDoc(doc(db, "decks", DeckIDD));
  const currentCardNum = deckSnap.data().cardNum;

  console.log(" updating")
  await updateDoc(doc(db, "decks", DeckIDD), {
    cardNum: currentCardNum + 1
  });
  console.log(" finished updating")
  
  //the 'D' was added to the variables to distinguish them as the data
  //document ID for these will end up being randomized
  return new Promise(async (resolve) =>{
    //addDoc(collection(db, "Flashcard"),{
    console.log("Inside adding flashcard")
    await setDoc(doc(db, "Flashcard", DeckIDD + currentCardNum),{
      DeckID: DeckIDD,
      Question: QuestionD,
      Answer: AnswerD,
      Level: 0,
      nextDateAppearance: nullDate,
      reviewedToday: nullDate
    }).then(() => {
        resolve("Completed delete. Returning to listen2SubmitButton.");
        }).catch(error => {
          console.log(error);
        });
  })
}

async function listen2CancelButton() {
  newCardWindowCancelButton.addEventListener("click", async e =>{
    //return to home screen
    //window.location.href = "./deckDetails.html";
    newCardWindow.style.display = "none";
    question.value = "";
    answer.value = "";

    var addFlashcardButton = document.getElementById("addFlashcardButton");
    addFlashcardButton.style.display = "block";
})
}

async function listen2SubmitButton(){
    createFlashcardButton.addEventListener("click", async e => {
        if (question.value === ""){
            question.placeholder = "Question can not be empty.";
        }

        else if (answer.value === ""){
            answer.placeholder = "Answer can not be empty.";
        }

        if (question.value != "" && answer.value != ""){
          console.log("HERE!!")
          await CardCreate(answer.value, deckID, question.value);
          console.log("Came out!!")
          //console.log("Returning to main!")
          sessionStorage.setItem('PrevHTMLPg', "newCard");

          question.value = "";
          answer.value = "";
          newCardWindow.style.display = "none";
          document.getElementById('addFlashcardButton').style.display = "block";

          const flashcardIDs = await getFlashcardIDs();
          //remove flashcards previously made
          for (let index = 0; index < flashcardIDs.length; index++){
            const flashcardID = flashcardIDs[index];
            console.log("FlashcardID: " + flashcardID)
            //if flashcard line exists then delete; otherwise not there because have NOT added
            if (document.getElementById("line" + flashcardID)){
              flashcardList.removeChild(document.getElementById("line" + flashcardID));
            }
          }
          //reload flashcard list so that it includes newest flashcard
          displayFlashcards();
          // window.location.href = "./deckDetails.html";
        }
    });
}

editSettingsButton.addEventListener("click", clickEditSettingsButton);
listen2RemoveTip();
listen2StartReview();
listen2Tabs();
listen4Logout();
listen2SelectAll();
listen2DeleteButton();
listen2SubmitButton();
listen2CancelButton();

console.log("h10" > "h2")