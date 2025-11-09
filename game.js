const NUMBER_OF_GUESSES = 6; // you can try up to 6 words each game
let guessesRemaining, currentGuess, nextLetter, rightGuessString; // game state variables

// --- Stats setup ---
let stats = JSON.parse(localStorage.getItem("wordleStats")) || { // loaod saved stats or use defaults
  gamesPlayed: 0, // how many games played total
  wins: 0,        // how many wins total
  streak: 0,      // current win streak
  bestStreak: 0   // best win streak ever
};

function saveStats() { // save stats to browser storage
  localStorage.setItem("wordleStats", JSON.stringify(stats)); // convert stats to text and save
}

function updateStatsDisplay() { // show stats numbers on the page
  document.getElementById("gamesPlayed").textContent = stats.gamesPlayed; // show games played
  document.getElementById("wins").textContent = stats.wins; // show wins
  document.getElementById("streak").textContent = stats.streak; // show current streak
  document.getElementById("bestStreak").textContent = stats.bestStreak; // show best streak
}
updateStatsDisplay(); // update stats display right now

// --- hame setup ---
function startNewGame() { // start a new round
  guessesRemaining = NUMBER_OF_GUESSES; // reset number of guesses left
  currentGuess = []; // clear current typed letters
  nextLetter = 0; // reset position to first column
  rightGuessString = wordList[Math.floor(Math.random() * wordList.length)]; // pick a random secret word from wordList

  // clear any old board/keyboard so we can rebuild them clean
  document.getElementById("game-board").innerHTML = "";
  document.getElementById("keyboard").innerHTML = "";

  initBoard(); // build the empty 6x5 grid
  initKeyboard(); // build the on-screen keyboard
  console.log("New word:", rightGuessString); // print chosen word to console (for testing)
}

function initBoard() { // create the grid of boxes where guesses appear
  const board = document.getElementById("game-board"); // get the board container
  for (let i = 0; i < NUMBER_OF_GUESSES; i++) { // for each row (6)
    const row = document.createElement("div"); // make a row element
    row.className = "row"; // give it the "row" class
    for (let j = 0; j < 5; j++) { // for each column (5 letters)
      const tile = document.createElement("div"); // make a tile element
      tile.className = "tile"; // give it the "tile" class
      row.appendChild(tile); // put the tile into the row
    }
    board.appendChild(row); // add the row to the board
  }
}

function initKeyboard() { // build the clickable on-screen keyboard
  const keys = [ // keyboard layout rows
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l"],
    ["Enter","z","x","c","v","b","n","m","Back"]
  ];
  const keyboard = document.getElementById("keyboard"); // get keyboard container

  keys.forEach(rowKeys => { // for each keyboard row
    const row = document.createElement("div"); // make a row container
    row.className = "keyboard-row"; // give it class for styling
    rowKeys.forEach(key => { // for each key in that row
      const button = document.createElement("button"); // make a button
      button.textContent = key; // show the key label
      button.className = "key white"; // start with default "white" style
      if (key === "Enter" || key === "Back") button.classList.add("wide"); // make special keys wider
      button.addEventListener("click", () => handleKeyPress(key)); // click -> handleKeyPress
      row.appendChild(button); // add button to row
    });
    keyboard.appendChild(row); // add the row to the keyboard
  });
}

// --- Handle typing ---
document.addEventListener("keydown", e => { // listen to real keyboard presses
  if (guessesRemaining === 0) return; // if game is over, ignore keys
  let key = e.key.toLowerCase(); // make key lowercase
  if (key === "enter") handleSubmitGuess(); // Enter -> submit guess
  else if (key === "backspace") handleDeleteLetter(); // Backspace -> delete letter
  else if (/^[a-z]$/.test(key)) insertLetter(key); // a-z -> insert letter
});

function handleKeyPress(key) { // handle clicks on the on-screen keys
  if (key === "Enter") handleSubmitGuess(); // enter -> submit
  else if (key === "Back") handleDeleteLetter(); // back -> delete
  else insertLetter(key); // letter -> insert
}

function insertLetter(letter) { // put a letter into the current row
  if (nextLetter === 5) return; // if row is full, do nothing
  let row = document.getElementsByClassName("row")[NUMBER_OF_GUESSES - guessesRemaining]; // choose the active row
  let tile = row.children[nextLetter]; // pick the tile for nextLetter
  tile.textContent = letter; // show the letter in the tile
  currentGuess.push(letter); // add letter to currentGuess array
  nextLetter++; // move to next tile
}

function handleDeleteLetter() { // remove the last letter typed
  if (nextLetter === 0) return; // if nothing typed, do nothing
  nextLetter--; // move back one position
  let row = document.getElementsByClassName("row")[NUMBER_OF_GUESSES - guessesRemaining]; // active row again
  let tile = row.children[nextLetter]; // tile to clear
  tile.textContent = ""; // clear the tile
  currentGuess.pop(); // remove last letter from currentGuess
}

function handleSubmitGuess() { // check and evaluate the guess
  if (currentGuess.length !== 5) { // if not 5 letters
    alert("Not enough letters!"); // tell the user
    return; // stop
  }

  const guess = currentGuess.join(""); // make the guess string
  if (!wordList.includes(guess)) { // if guess is not a known word
    alert("Not in word list!"); // tell the user
    return; // stop
  }

  const row = document.getElementsByClassName("row")[NUMBER_OF_GUESSES - guessesRemaining]; // row we are evaluating
  const correctLetters = Array.from(rightGuessString); // copy of the secret word letters

  // --- first check: exact matches (green) ---
  for (let i = 0; i < 5; i++) {
    let letter = currentGuess[i]; // letter guessed at position i
    let tile = row.children[i]; // tile at position i
    if (letter === rightGuessString[i]) { // if letter is exactly correct
      tile.classList.add("correct"); // mark tile green
      updateKeyboardColor(letter, "green"); // mark keyboard key green
      correctLetters[i] = null; // remove this letter from the copy so it's not reused
    }
  }

  // --- second check: letters present but wrong place (yellow) or absent (gray) ---
  for (let i = 0; i < 5; i++) {
    let letter = currentGuess[i]; // letter guessed at position i
    let tile = row.children[i]; // tile at position i
    if (tile.classList.contains("correct")) continue; // skip if already green

    if (correctLetters.includes(letter)) { // if letter exists somewhere in secret word copy
      tile.classList.add("present"); // mark tile yellow
      updateKeyboardColor(letter, "yellow"); // mark keyboard key yellow
      correctLetters[correctLetters.indexOf(letter)] = null; // remove that match to avoid double count
    } else {
      tile.classList.add("absent"); // mark tile gray if not in word
      updateKeyboardColor(letter, "gray"); // mark keyboard key gray
    }
  }

  if (guess === rightGuessString) { // if the guess matches the secret word
    alert("🎉 You got it!"); // show a win message
    endGame(true); // end game as win
    return; // stop further processing
  }

  guessesRemaining--; // use up one guess
  currentGuess = []; // clear current built word for next try
  nextLetter = 0; // reset position to first tile

  if (guessesRemaining === 0) { // If no guesses left
    alert(`Game Over! The word was "${rightGuessString.toUpperCase()}".`); // revealss the word
    endGame(false); // over game as loss
  }
}

function updateKeyboardColor(letter, color) { // change the color of a key on the on-screen keyboard
  const keys = document.querySelectorAll(".key"); // Get all keyboard keys
  keys.forEach(k => {
    if (k.textContent.toLowerCase() === letter) { // find The key that matches the letter
      k.classList.remove("white", "green", "yellow", "gray"); // remove old color classes
      k.classList.add(color); // add the new color class
    }
  });
}

function endGame(win) { // update stats and stop input when game ends
  stats.gamesPlayed++; // Count the finished no. ofgames
  if (win) { // if player won
    stats.wins++; // count a win
    stats.streak++; // increase current streak
    stats.bestStreak = Math.max(stats.bestStreak, stats.streak); // update best streak if needed
  } else {
    stats.streak = 0; // reset streak on loss
  }
  saveStats(); // save stats to localStorage
  updateStatsDisplay(); // update the numbers shown on screen
  guessesRemaining = 0; // block further input
}

// button to start a new word (game)
document.getElementById("newWordBtn").addEventListener("click", startNewGame);

// start the first game automatically
startNewGame();
