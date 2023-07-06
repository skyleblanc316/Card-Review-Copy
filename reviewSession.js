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
    collection,
    query,
    where,
    doc,
    updateDoc,
    getDoc, 
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
const nullDate = "2023/01/01";
const nullDatePlus1 = "2023/01/02";
//get current date
var nowDate = new Date();
nowDate = nowDate.getFullYear()+'/'+addZero2Date((nowDate.getMonth()+1))+'/'+ addZero2Date(nowDate.getDate());
console.log(nowDate);

//Document Elements
const reviewSession = document.getElementById('reviewSession');
const reviewAnswerSession = document.getElementById('reviewAnswerSession');
const correctButtons = document.getElementById('correctButtons');
const pauseButton = document.getElementById('pauseButton');
const pgStartReviewClicked = sessionStorage.getItem('PrevHTMLPg');
var returnPg = "Home";
if (pgStartReviewClicked === "deckDetails"){
  returnPg = "Deck";
}

var correctlyAnswered; //boolean; true if user correctly answered question; else, false
var pause = false;
//of flashcards reviewed,...
var numCorrect = 0;                     //number of flashcards correctly answered
var numIncorrect = 0;                   //number of flashcards incorrectly answered
var noCards2Review = false;       //only applicable for continuous Review
                                        //true if user finished reviewing all flashcards

const pausePressedOutside = (e) =>{
  e.preventDefault();
  console.log('pressed pause review OUTSIDE');
  pause = true;
}

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));    //idea of permutation: first (i+1) items to choose from since floored
    console.log(j);
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

function reorderByLowHigh(arrLevel, arrID, maxLevel){
  var tempReviewID = [];
  for (let level = 0; level <= maxLevel; level++){
    console.log("Level:", level);
    var maskLevel = arrLevel.map(item => item == level);
    var indicesLevel = arrID.filter((item, i) => maskLevel[i]);   //indices of flashcards with a particular level
    console.log("Indices: ", indicesLevel);
    indicesLevel = shuffle(indicesLevel);  
    tempReviewID = tempReviewID.concat(indicesLevel);
  }

  return tempReviewID;
}

//waits for user to indicate that they want to see answer to flashcard question
function waitForRevealAnswer() {
  return new Promise((resolve) => {
    var revealButton = document.createElement("button");
    revealButton.id = "revealButton";
    revealButton.className = "reveal-button";
    revealButton.innerHTML = "Reveal Answer";
    revealButton.title = "Hotkey(s): space";
    reviewSession.appendChild(revealButton);

    function removeListeners(){
      document.removeEventListener('keydown', enterPressed);  //remove EventListener if clicked on button
      pauseButton.removeEventListener("click", pausePressed);
    }

    //only resolve key press if user pressed enter
    const enterPressed = (e) => {
      e.preventDefault();
      //keyCode 13 = enter or return key
      if (e.keyCode === 13 || e.keyCode === 32) {
        console.log("Enter pressed")
        pause = false;
        // reveal answer that was invisible previously
        document.getElementById("answerHeading").style.visibility = "visible";
        document.getElementById("reviewAnswerSession").style.visibility = "visible";
        removeListeners();
        resolve(e);
      }
    }

    const pausePressed = (e) =>{
      e.preventDefault();
      console.log('pressed pause review in REVEAL');
      pause = true;
      removeListeners();
      pauseButton.blur();
      resolve(e);
    }

    revealButton.addEventListener("click", handler => {
      console.log('pressed reveal');
      pause = false;
      removeListeners();
      resolve(handler);
      // reveal answer that was invisible previously
      document.getElementById("answerHeading").style.visibility = "visible";
      document.getElementById("reviewAnswerSession").style.visibility = "visible";
    }, { once: true });

    pauseButton.addEventListener("click", pausePressed);

    // pauseButton.addEventListener("click", handler => {
    //   console.log('pressed pause review');
    //   pause = true;
    //   document.removeEventListener('keydown', enterPressed);  //remove EventListener if users clicked on button
    //   resolve(handler);
    // }, { once: true });

    //listen to see if user pressed enter = reveal answer
    document.addEventListener('keydown', enterPressed);
  })
}

//waits for user to indicate whether they correctly or incorrectly answered flashcard
function waitForCorrectIncorrectResponse() {
  return new Promise((resolve) => {
    //create correct & incorrect buttons
    console.log("Back in CorrectIncorrectResponse")
    const correct = document.createElement('button');
    correct.innerHTML = "Correct";
    correct.id = "correct";
    correct.className = "correct-button";
    correct.title = "Hotkey(s): 1";
    correctButtons.appendChild(correct);

    const incorrect = document.createElement('button');
    incorrect.innerHTML = "Incorrect";
    incorrect.id = "incorrect";
    incorrect.className = "incorrect-button";
    correct.title = "Hotkey(s): 0, 2";
    correctButtons.appendChild(incorrect);

    function removeListeners(){
      document.removeEventListener('keydown', pressed01);
      pauseButton.removeEventListener("click", pausePressed);
    }
    
    //resolve key press only if user pressed 0 or 1
    const pressed01 = (e) => {
      //user presssed 0 or 2= incorrect
      if(e.keyCode === 96 || e.keyCode === 48 || e.keyCode === 50 || e.keyCode === 98){
        console.log("0 pressed")
        pause = false;
        correctlyAnswered = false;
        removeListeners();
        resolve(e);
        document.getElementById("answerHeading").style.visibility = "hidden";
      document.getElementById("reviewAnswerSession").style.visibility = "hidden";
      }
      12
      //user pressed 1 = correct = keyCode 97
      if (e.keyCode === 97 || e.keyCode === 49){
        console.log("1 pressed")
        pause = false;
        correctlyAnswered = true;
        removeListeners();
        resolve(e);
        document.getElementById("answerHeading").style.visibility = "hidden";
      document.getElementById("reviewAnswerSession").style.visibility = "hidden";
      }
    }

    const pausePressed = (e) =>{
      e.preventDefault();
      console.log('pressed pause review in ANSWER');
      pause = true;
      removeListeners();
      pauseButton.blur();
      resolve(e);
    }

    pauseButton.addEventListener("click", pausePressed);

    //listen for any key press
    document.addEventListener('keydown', pressed01);
    
    correct.addEventListener("click", handler => {
      correctlyAnswered = true;
      pause = false;
      // ++numCorrect;
      // console.log("numCorrect: ", numCorrect)
      removeListeners();
      resolve(handler);
      // hide answer that was visible previously
      document.getElementById("answerHeading").style.visibility = "hidden";
      document.getElementById("reviewAnswerSession").style.visibility = "hidden";
    }, { once: true });

    incorrect.addEventListener("click", handler => {
      console.log('incorrect click');
      correctlyAnswered = false;
      // ++numIncorrect;
      // console.log("numInCorrect: ", numIncorrect)
      removeListeners();
      pause = false;
      resolve(handler);
      // hide answer that was visible previously
      document.getElementById("answerHeading").style.visibility = "hidden";
      document.getElementById("reviewAnswerSession").style.visibility = "hidden";
    }, { once: true });

    // pauseButton.addEventListener("click", handler => {
    //   console.log('pressed pause review');
    //   pause = true;
    //   document.removeEventListener('keydown', pressed01);
    //   resolve(handler);
    // }, { once: true });
  })
}

//recursive call = ensures that user does want to pause the session
async function handlePauseRevealAnswer(){
  await waitForRevealAnswer();
  //remove the reveal button once the user has pressed some button
  reviewSession.removeChild(document.getElementById('revealButton'));

  if (pause === true && confirm("Pressing pause will save your progress, and return to " + returnPg) === false){
    pause = false;
    await handlePauseRevealAnswer();
  }

  //if pause = false, then user wants to proceed and reveal answer
  //if pause = true and confirm =  true, then return because user wants to pause
  return;
}

//recursive call = ensures that user does want to pause the session
async function handlePauseCorrectIncorrectResponse(answer){
  //display Answer heading
  // const answerHeading = document.getElementById('answerHeading');
  // answerHeading.id = "answerHeading"
  // answerHeading.innerHTML = "Answer";
  // reviewAnswerSession.appendChild(answerHeading);

  //display Answer
  const flashcardAnswer = document.createElement('p');
  flashcardAnswer.id = "flashcardAnswer"
  flashcardAnswer.innerHTML = answer;
  reviewAnswerSession.appendChild(flashcardAnswer);

  await waitForCorrectIncorrectResponse();
  //remove all dynamically added children
  //answerHeading.innerHTML = "";
  reviewAnswerSession.removeChild(document.getElementById('flashcardAnswer'));
  correctButtons.removeChild(document.getElementById('correct'));
  correctButtons.removeChild(document.getElementById('incorrect'));
  //correctButtons.removeChild(document.getElementById('pauseReview'));

  if (pause === true && confirm("Pressing pause will save your progress, and return to " + returnPg) === false){
    pause = false;
    await handlePauseCorrectIncorrectResponse(answer);
  }

  //if pause = false, then user indicated whether they correctly/incorrectly answered the question
  //if pause = true and confirm =  true, then return because user wants to pause
  return;
}

//reviewOrder = flashcardIDs in order of how they will be reviewed
async function reviewingFlashcards(reviewOrder, reviewType, maximumLevel){
  //<p> element that indicates num_cards_reviewed / total_cards_2be_reviewed
  var progress = document.getElementById('progress');
  progress.style.textAlign = "center";

  var accuracy = document.getElementById('accuracy');
  accuracy.style.textAlign = "center";

  for (let index = 0; index < reviewOrder.length; index++){
    progress.innerHTML = "Progress: " + (index+1) + "/" + reviewOrder.length;
    accuracy.innerHTML = "Correct: " + numCorrect + "; Incorrect: " + numIncorrect;
    console.log("Flashcard ID in Review: ", reviewOrder[index]);
    const flashcard = doc(db, "Flashcard", reviewOrder[index]);
    const flashcardDoc = await getDoc(flashcard);

    //display Question
    var question = document.getElementById('question');
    question.innerText = flashcardDoc.data().Question;  
    var answer = flashcardDoc.data().Answer;  
    //to add style in dynamically: https://www.w3.org/wiki/Dynamic_style_-_manipulating_CSS_with_JavaScript

    //check if user has paused review
    if (pause === true && confirm("Pressing pause will save your progress, and return to " + returnPg) === true){
      break;
    }
    else{
      //Case 1: pause === false
      //Case 2: pause === true BUT user decides not to pause
      pause = false;
      if (index === 0){
        pauseButton.removeEventListener("click", pausePressedOutside);
        pauseButton.blur();
      }
      await handlePauseRevealAnswer();
    }

    if (pause){
      console.log("User has paused review session")
      break;
    }

    //***** Reveal answer to question & wait for user to respond *************
    //check if user has paused review
    if (pause === true && confirm("Pressing pause will save your progress, and return to " + returnPg) === true){
      break;
    }
    else{
      pause = false;
      await handlePauseCorrectIncorrectResponse(answer);
      if (correctlyAnswered && !pause){
        ++numCorrect;
        console.log("Correct: ", numCorrect)
      }
      else if (!correctlyAnswered && !pause){
        ++numIncorrect;
        console.log("Incorrect: ", numIncorrect)
      }
      else{
        console.log("No updates because user is pressing pause")
      }
    }
    if (pause){
      console.log("User has paused review session")
      break;
    }
    
    //update nextDateAppearance = now/current date => flashcard already reviewed
    //update flashcard level based on whether correctly answered the flashcard question
    var updateLevel = flashcardDoc.data().Level;        //get the flashcard's current level
    console.log("Flashcard current level", updateLevel);
    
    if (updateLevel < maximumLevel && correctlyAnswered){
      ++updateLevel;
    }
    else if(updateLevel > 0 && !correctlyAnswered){
      --updateLevel;
    }
    else{
      console.log("No update to the flashcard level")
    }
    console.log("Flashcard NEW level", updateLevel);

    var updateNextDateAppr = nowDate;
    if (reviewType === "Continuous"){
      var date = new Date();                              //get current date
      if (updateLevel === 0){
        //if level = 0, review flashcard the following day
        date.setDate(date.getDate() + 1);
      }
      else{
        date.setDate(date.getDate() + (2*updateLevel));     //next date to be reviewed is 2*updateLevel days later
      }
      updateNextDateAppr = date.getFullYear()+'/'+ addZero2Date((date.getMonth()+1))+'/'+ addZero2Date(date.getDate());
    }
    console.log("updated nextDateAppearance: " + updateNextDateAppr)

    await updateDoc(flashcard, {
      Level:updateLevel,
      nextDateAppearance: updateNextDateAppr,
      reviewedToday: nowDate
    });

    if (updateLevel === maximumLevel){
      //user has MASTERED the flashcard
      //Notify user whether they want to burn the card = no longer appears in review sessions
      //NOT yet implemented
      console.log("Maximum level reached!")
    }
  }
  return;
}

//ASSUMPTION: all nextDateAppearance = {nullDate, nowDate}
//BUT maybe better just to have a resume field associated a deck
async function dailyReview(DeckID, orderType, maximumLevel, reviewBurnedCards){
  //Retrieve the orderType = determines the order that flashcards will be reviewed

  //query all flashcards in deck DeckID
  const flashcards = query(collection(db, "Flashcard"), where("DeckID", "==", DeckID));
  var flashcardSnapshot = await getDocs(flashcards);

  if (flashcardSnapshot.empty){
    console.log("Empty snapsot!!")
  }

  //************Is USER RESUMing or STARTing a new review session*****************/
  var resumeSession = false;
  /* IF non-NUll nextDateAppearance exists AND non-NULL nextDateAppearance != currentDate
    # new review, not resuming session
    Set all nextDateAppearance equal to NULL
  ENDIF */
  var flashcardID = [];       //holds ID of flashcards never reviewed
  //Note: Flashcard level should carry over
  var flashcardLevel = [];    //holds Level of flashcard never reviewed
  // var flashcardDates = [];     //holds the nextDateAppearance of flashcard never reviewed
  var counter = 0;            //total flashcards to reviewed in this session
  var index = 0;
  var allIDs = [];            //holds ID of ALL flashcards
  
  flashcardSnapshot.forEach((flashcardDoc) => {
      var flashcardDate = flashcardDoc.data().nextDateAppearance;
      allIDs[index] = flashcardDoc.id;
      index = index + 1;
      //If we store Date as a timestamp, it is actually stored as:
      // ir {seconds: 1676361600, nanoseconds: 685000000}
      // nanoseconds:685000000
      // seconds:1676361600
      // flashcardDate = flashcardDate.getFullYear()+'/'+(flashcardDate.getMonth()+1)+'/'+flashcardDate.getDate();

      console.log(flashcardDate);
      if (flashcardDate === nowDate || (!reviewBurnedCards && flashcardDoc.data().Level >= maximumLevel)){
          resumeSession = true;
          //cards NOT being reviewed
      }
      else{
        //flashcard was NOT viewed in CURRENT date & is NOT burned out (Level = 10)
        flashcardID[counter] = flashcardDoc.id;
        flashcardLevel[counter] = flashcardDoc.data().Level;
        // flashcardDates[counter] = flashcardDoc.data().nextDateAppearance;
        counter = counter + 1;
      }
      // doc.data() is never undefined for query doc snapshots
  });
 
  console.log(flashcardID);
  console.log(flashcardLevel);

  if (!resumeSession){
      console.log("New Review!");
      //reset all nextDateAppearance = nullDate
      // for (let i = 0; i < flashcardID.length; i++) {
      //   const flashcard = doc(db, "Flashcard", flashcardID[i]);
      //   await updateDoc(flashcard, {
      //     nextDateAppearance:nullDate
      //   });
      // }
  }
  else{
    console.log("Resume session!");
  }
  //*************** END: Determined whether RESUME or NEW ********************************* */

  //********** START: Determine the order in which flashcards will be reviewd ***************/

  console.log("Before Shuffle: ", flashcardID);  
  var orderReview = [];                       //flashcard ID in order of which flashcards will be reviewed first
  if (orderType === "Random"){
    orderReview = shuffle(flashcardID);
  }
  else if (orderType === "Low to High"){
    console.log("LowHigh");
    const maxLevel = Math.max.apply(null, flashcardLevel);    //maximum level of any flashcard from DeckID
    console.log("Max Level:", maxLevel);

    orderReview = reorderByLowHigh(flashcardLevel, flashcardID, maxLevel);
  }
  else{
    console.log("ERROR: only 2 possible review types");
  }
  console.log("After Shuffle: ", orderReview);                 //after shuffled

  if (orderReview.length === 0){
    //https://www.tutorialsteacher.com/javascript/display-popup-message-in-javascript
    alert("No flashcards to be reviewed today! Returning to " + returnPg);
    noCards2Review = true;
    return;
  }

  //Start reviewing flashcards
  await reviewingFlashcards(orderReview, "Daily", maximumLevel);

  if (!pause){
    // Finished reviewing all flashcards
    // Set NextAppearanceDate = Null for all flashcards in DeckName
    for (let i = 0; i < allIDs.length; i++) {
      const flashcard = doc(db, "Flashcard", allIDs[i]);
      await updateDoc(flashcard, {
        nextDateAppearance:nullDatePlus1
      });
    }
  } 

  return;
}

//Decks with reviewType = "Continuous" MUST have a resume field!!!
async function continuousReview(DeckID, orderType, numberNewCards, resume, maximumLevel, reviewBurnedCards){
  //new cards nextDateAppearance = nullDate
  //cards reviewed at least once have nextDateAppearance > nullDate && < currentDate
  var newCardID = [];             //IDs of all cards not yet reveiwed; newCard Level = 0
  var reviewCardID = [];          //IDs of all cards to be reviewed
  var reviewCardLevel = [];       //level of all cards that have been reviewed
  var counter = 0;
  var index = 0;
  var total = 0;

  //query all flashcards in deck DeckID
  const flashcards = query(collection(db, "Flashcard"), where("DeckID", "==", DeckID));
  var flashcardSnapshot = await getDocs(flashcards);

  flashcardSnapshot.forEach((flashcardDoc) => {
    ++total;
    var nextDateAppearance = flashcardDoc.data().nextDateAppearance;
    if (nextDateAppearance === nullDate){
      //new card
      console.log("new card: " + flashcardDoc.id)
      newCardID[index] = flashcardDoc.id;
      ++index;
    }
    else if (nextDateAppearance <= nowDate && 
      (flashcardDoc.data().Level < maximumLevel || (reviewBurnedCards && flashcardDoc.data().Level >= maximumLevel))){
      // 	IF nextDateAppearance < currentDate
      // 		Set nextDateAppearance = currentDate
      console.log("old card: " + flashcardDoc.id)
      reviewCardID[counter] = flashcardDoc.id;
      reviewCardLevel[counter] = flashcardDoc.data().Level;
      ++counter;
    }
    else{
      //nextDateAppearance > now Date
      //card will not be reviewed today BUt will be in the future
      console.log(flashcardDoc.id, " to be reviewed in the future or burned OUt")
    }
  });

  var newCards2Review = 0;     //total number of new cards to be reviewed 
  //var oldCards2Review = total - newCards2Review;
  var oldCards2Review = reviewCardID.length;  //total number of OLD cards to be reviewed

  console.log("Before reorder: ", reviewCardID);
  //only reorder old cards if there are any old cards to be reviewed
  if(reviewCardID.length > 0){
    if (orderType === "Random"){
      reviewCardID = shuffle(reviewCardID);
    }
    else if (orderType === "Low to High"){
      console.log("ReviewCardLevel: " + reviewCardLevel)
      const maxReviewLevel = Math.max.apply(null, reviewCardLevel);    //maximum level of to be reviewed flashcard from DeckID
      console.log("Max Level:", maxReviewLevel);

      reviewCardID = reorderByLowHigh(reviewCardLevel, reviewCardID, maxReviewLevel);
    }
    else{
      console.log("ERROR: Not a valid orderType")
    }
    console.log("After reorder: ", reviewCardID);
  }

  //all new cards have level = 0, so the order of the new cards can be random
  //add new cards onto old cards list in reviewCardID, so that new cars are always reviewed first!
  if (!resume && newCardID.length > 0){
    console.log("New session + new cards still to review")
    //user is not resuming a session
    //if there are still new cards to review, randomly select numNewCards to be reviewed
    console.log("New cards before shuffle: ",  newCardID);
    newCardID = shuffle(newCardID);
    console.log("New cards After shuffle: ",  newCardID);

    //check if number of new cards left > fixed numberNewCards
    if (newCardID.length >= numberNewCards){
      //reviewCardID = reviewCardID.concat(newCardID.slice(0, numberNewCards));
      newCardID = newCardID.slice(0, numberNewCards);
      newCards2Review = numberNewCards;
    }
    else{
      //reviewCardID = reviewCardID.concat(newCardID);
      newCards2Review = newCardID.length;
    }

    reviewCardID = newCardID.concat(reviewCardID);
    //append level = 0 of new cards
    // for (var i = 0; i < newCards2Review; i++){
    //   reviewCardLevel = reviewCardLevel.concat(new Array(1).fill(0));
    // }
    //reviewCardID = reviewCardID.reverse();
    // reviewCardLevel = reviewCardLevel.reverse();
    // console.log("Review card level: " + reviewCardLevel)
  }
  console.log("Review cards: ", reviewCardID);

  //if user has finished reviewing ALL flashcards for the day, inform them!
  if (reviewCardID.length === 0){
    //https://www.tutorialsteacher.com/javascript/display-popup-message-in-javascript
    alert("No flashcards to be reviewed today! Returning to " + returnPg);
    noCards2Review = true;
    return;
  }

  //set nextDateAppearance for all cards to be reviewed today = nowDate
  //sets newCards from null -> nowDate
  //sets reviewedCards < nowDate to nowDate
  for (var i = 0; i < reviewCardID.length; i++){
    const flashcard = doc(db, "Flashcard", reviewCardID[i]);
    const flashcardSnap = await getDoc(flashcard);
    var nextDateAppearance = flashcardSnap.data().nextDateAppearance;
    console.log("nextDateAppearance: ", nextDateAppearance)
    if(nextDateAppearance != nowDate){
      await updateDoc(flashcard, {
        nextDateAppearance:nowDate
      });
    }
  }
  console.log("Updated nextDateAppearance!")

  //set heading indicating the number of NEW and OLD cards being reviewed
  // var newOldCards = document.getElementById('newOldCards');
  // newOldCards.innerHTML = "New: " + newCards2Review + " Old: " + oldCards2Review;

  //Start reviewing Flashcards
  await reviewingFlashcards(reviewCardID, "Continuous", maximumLevel);

  return;
}

async function main() {  
  const DeckID =  sessionStorage.getItem('DeckID');       //this will vary depending on which deck the user selected

  var deckDoc = doc(db, "decks", DeckID);
  var deck = await getDoc(deckDoc);
  const reviewType = deck.data().reviewType;
  const orderType = deck.data().orderType;
  const maximumLevel = deck.data().maximumLevel;
  const reviewBurnedCards = deck.data().reviewBurnedCards;
  console.log("OrderType: ", orderType)

  if (reviewType == "Daily"){
    console.log("Daily")
    await dailyReview(DeckID, orderType, maximumLevel, reviewBurnedCards);
  }
  else if (reviewType == "Continuous"){
    console.log("Continuous")
    const resumeDate = deck.data().resume;
    var resume = false;
    console.log("resumeDate: ",  resumeDate)
    if (resumeDate === nowDate){
      resume = true;
      console.log("resuming...")
    }
    const numNewCards = deck.data().numNewCards;
    await continuousReview(DeckID, orderType, numNewCards, resume, maximumLevel, reviewBurnedCards);

    //only need to update resume for decks with reviewType = Continuous
    await updateDoc(deckDoc, {
      resume: nowDate
    });
    
    console.log("updated resume field!")
    }
  else{
    console.log("ERROR: not a valid review type")
  }

  console.log("return to the main!")

  if (numCorrect > 0 || numIncorrect > 0){
    console.log("Came to update history")
    const deckSnap = await getDoc(doc(db, "decks", DeckID));
    const correct = deckSnap.data().correct;
    const incorrect = deckSnap.data().incorrect;

    correct[correct.length - 1] = correct[correct.length - 1] + numCorrect;
    incorrect[incorrect.length - 1] = incorrect[correct.length - 1] + numIncorrect;
    await UpdateDeck(DeckID, correct, incorrect);
  }

  if (pause || noCards2Review){
    //didn't finish review
    //return to home screen
    if (pgStartReviewClicked === "homeScreen"){
        sessionStorage.removeItem('DeckID');                //remove saved cookie of DeckID
        window.location.href = "./homeScreen.html";
    }
    else{
        sessionStorage.setItem('PrevHTMLPg', "finishedReview");
        window.location.href = "./deckDetails.html";
    }
  }
  else{
    //finished review
    sessionStorage.setItem("numCorrect", numCorrect);
    sessionStorage.setItem("numMissed", numIncorrect);
    window.location.href = "./finishedReview.html";
  }
}

function UpdateDeck(DeckID, correctD, incorrectD){
  return new Promise((resolve) =>{
    //create reference variables for the document and the data that will be updated
    const deckRef = doc(db, "decks", DeckID);
    const data = {
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

pauseButton.addEventListener("click", pausePressedOutside);
main();