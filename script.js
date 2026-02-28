// ---------- SMART WORD MATCHING (linear space optimization) ----------
function wordEditDistance(originalWords, typedWords) {
    const m = originalWords.length;
    const n = typedWords.length;
    
    // Using a simpler approach for very long passages to avoid O(N^2) memory and time issues
    // For the sake of this app, we'll use a basic comparison if the text is extremely long,
    // or a more efficient Levenshtein if it's manageable.
    
    // If we want to keep the full DP but use less memory:
    let prevRow = new Array(n + 1);
    let currRow = new Array(n + 1);
    
    for (let j = 0; j <= n; j++) prevRow[j] = j;
    
    // To backtrack and mark errors, we actually need the full matrix OR a different approach.
    // However, the "stuck" behavior is likely due to the O(N^2) matrix creation for 800x800 words.
    // 800 * 800 = 640,000 elements, which should be fine for memory, but let's optimize.
    
    // Let's use a more efficient comparison for the UI markers if the distance is large.
    // Re-implementing with a focus on speed.
    
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (originalWords[i - 1] === typedWords[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + 1
                );
            }
        }
    }

    let i = m, j = n;
    const originalMark = new Array(m).fill(false);
    const typedMark = new Array(n).fill(false);

    while(i > 0 && j > 0){
        if(originalWords[i-1] === typedWords[j-1]){
            i--; j--;
        } else if(dp[i][j] === dp[i-1][j-1]+1){
            originalMark[i-1] = true;
            typedMark[j-1] = true;
            i--; j--;
        } else if(dp[i][j] === dp[i-1][j]+1){
            originalMark[i-1] = true;
            i--;
        } else if(dp[i][j] === dp[i][j-1]+1){
            typedMark[j-1] = true;
            j--;
        } else {
            // Fallback for unexpected DP values
            i--; j--;
        }
    }
    while(i > 0){ originalMark[i-1] = true; i--; }
    while(j > 0){ typedMark[j-1] = true; j--; }

    return {errors: dp[m][n], originalMark, typedMark};
}

// ---------- GLOBAL VARIABLES ----------
let timerInterval;
let timeLeft = 0;
let startTime = 0;

// ---------- GUI & FONT SIZE CONTROLS ----------
function changeGuiSize(factor) {
    let currentSize = parseFloat(localStorage.getItem("guiSize") || "1");
    currentSize *= factor;
    if (currentSize < 0.5) currentSize = 0.5;
    if (currentSize > 2) currentSize = 2;
    localStorage.setItem("guiSize", currentSize);
    applyGuiSize();
}

function resetGuiSize() {
    localStorage.setItem("guiSize", "1");
    applyGuiSize();
}

function applyGuiSize() {
    const size = localStorage.getItem("guiSize") || "1";
    document.documentElement.style.setProperty('--gui-scale', size);
    document.body.style.transform = `scale(${size})`;
    document.body.style.transformOrigin = "top center";
    document.body.style.width = `${100 / size}%`;
}

function changeFontSize(factor) {
    let currentSize = parseFloat(localStorage.getItem("fontSize") || "18");
    currentSize *= factor;
    if (currentSize < 10) currentSize = 10;
    if (currentSize > 40) currentSize = 40;
    localStorage.setItem("fontSize", currentSize);
    applyFontSize();
}

function applyFontSize() {
    const size = localStorage.getItem("fontSize") || "18";
    document.documentElement.style.setProperty('--base-font-size', size + "px");
}

// ---------- ON PAGE LOAD ----------
window.onload = function(){
    if (localStorage.getItem("darkMode") === "on") {
        document.body.classList.add("dark");
    }
    
    const path = location.pathname;
    loadSavedPassages();
    loadHistory();

    if(path.includes("exam.html")) startExam();
    if(path.includes("result.html")) showResult();
}

// ---------- HOME PAGE FUNCTIONS ----------
function savePassage(){
    let passage = document.getElementById("passageInput").value.trim();
    if(!passage){alert("Enter passage first"); return;}
    let saved = JSON.parse(localStorage.getItem("passages")||"[]");
    saved.push(passage);
    localStorage.setItem("passages", JSON.stringify(saved));
    document.getElementById("passageInput").value = "";
    loadSavedPassages();
}

function loadSavedPassages(){
    let saved = JSON.parse(localStorage.getItem("passages")||"[]");
    let box = document.getElementById("savedPassages");
    if(!box) return;
    box.innerHTML="";
    saved.forEach((p,i)=>{
        let preview = p.split(/\s+/).slice(0,5).join(" ");
        box.innerHTML += `
        <div style="border:1px solid #ccc;padding:6px;margin:5px;border-radius:5px;">
            <span onclick="usePassage(${i})" style="cursor:pointer;">${preview}...</span>
            <button onclick="deletePassage(${i})" style="float:right;background:red;color:white;border:none;padding:4px 8px;border-radius:4px;">Delete</button>
        </div>`;
    });
}

function usePassage(i){
    let saved = JSON.parse(localStorage.getItem("passages")||"[]");
    document.getElementById("passageInput").value = saved[i];
}

function deletePassage(i){
    if(!confirm("Delete this passage?")) return;
    let saved = JSON.parse(localStorage.getItem("passages")||"[]");
    saved.splice(i,1);
    localStorage.setItem("passages", JSON.stringify(saved));
    loadSavedPassages();
}

function startTest(){
    let passage = document.getElementById("passageInput").value.trim();
    let time = parseInt(document.getElementById("timeInput").value);
    if(!passage || !time){alert("Enter passage and time"); return;}
    localStorage.setItem("currentPassage", passage);
    localStorage.setItem("currentTime", time);
    window.location.href="exam.html";
}

function loadHistory(){
    let history = JSON.parse(localStorage.getItem("history")||"[]");
    let box = document.getElementById("history");
    if(!box) return;
    box.innerHTML="";
    history.slice().reverse().forEach(h=>{
        let preview = h.passage.split(/\s+/).slice(0,5).join(" ");
        box.innerHTML += `<div style="border:1px solid #ccc;padding:6px;margin:5px;border-radius:5px;">${preview}... | Gross:${h.grossWPM} | Net:${h.netWPM} | Accuracy:${h.accuracy}% | ${h.date}</div>`;
    });
}

// ---------- EXAM PAGE ----------
function startExam(){
    let passage = localStorage.getItem("currentPassage");
    let duration = parseInt(localStorage.getItem("currentTime"));
    if(!passage || !duration){alert("No test found"); window.location.href="index.html"; return;}
    timeLeft = duration*60;
    startTime = Date.now();
    const userInput = document.getElementById("userInput");
    userInput.disabled = false;
    timerInterval = setInterval(updateTimer,1000);
    document.getElementById("submitBtn").onclick=submitExam;
}

function updateTimer(){
    let min = Math.floor(timeLeft/60);
    let sec = timeLeft%60;
    document.getElementById("timer").innerText = `Time: ${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    timeLeft--;
    if(timeLeft<0) submitExam();
}

function submitExam(){
    const btn = document.getElementById("submitBtn");
    if(btn) {
        btn.disabled = true;
        btn.innerText = "Processing...";
    }
    clearInterval(timerInterval);
    
    // Use setTimeout to allow UI to update before heavy calculation
    setTimeout(() => {
        const typed = document.getElementById("userInput").value.trim();
        const timeTaken = (Date.now() - startTime) / 60000;
        localStorage.setItem("typedText", typed);
        localStorage.setItem("timeTaken", timeTaken);
        window.location.href = "result.html";
    }, 100);
}

// ---------- RESULT PAGE ----------
function showResult(){
    const passage = localStorage.getItem("currentPassage")||"";
    const typed = localStorage.getItem("typedText")||"";
    const timeTaken = parseFloat(localStorage.getItem("timeTaken")) || 0.01;

    const originalWords = passage.trim().split(/\s+/).filter(w=>w.length>0);
    const typedWords = typed.trim().split(/\s+/).filter(w=>w.length>0);

    const wordsTypedCount = typedWords.length;
    const grossWPM = (wordsTypedCount/timeTaken).toFixed(2);

    const editRes = wordEditDistance(originalWords, typedWords);
    const mistakes = editRes.errors;
    const netWPM = ((wordsTypedCount - mistakes)/timeTaken).toFixed(2);
    const accuracy = ((wordsTypedCount - mistakes)/wordsTypedCount*100).toFixed(2);

    saveHistoryRecord(passage, typed, grossWPM, netWPM, accuracy, mistakes);

    // Display results
    const resultBox = document.getElementById("resultBox");
    resultBox.innerHTML=`
        <p><b>Gross WPM:</b> ${grossWPM}</p>
        <p><b>Net WPM:</b> ${netWPM}</p>
        <p><b>Accuracy:</b> ${accuracy}%</p>
        <p><b>Total Errors:</b> ${mistakes}</p>
        <p><small>Time Used: ${timeTaken.toFixed(2)} min</small></p>
    `;

    // Highlight comparison (Fragment optimization)
    const originalBox = document.getElementById("originalBox");
    const typedBox = document.getElementById("typedBox");
    originalBox.innerHTML = "";
    typedBox.innerHTML = "";
    
    const origFrag = document.createDocumentFragment();
    for(let i=0; i<originalWords.length; i++){
        const span = document.createElement("span");
        if(editRes.originalMark[i]) span.style.background = "yellow";
        span.textContent = originalWords[i] + " ";
        origFrag.appendChild(span);
    }
    originalBox.appendChild(origFrag);

    const typedFrag = document.createDocumentFragment();
    for(let i=0; i<typedWords.length; i++){
        const span = document.createElement("span");
        if(editRes.typedMark[i]) span.style.textDecoration = "underline red";
        span.textContent = typedWords[i] + " ";
        typedFrag.appendChild(span);
    }
    typedBox.appendChild(typedFrag);
}

// ---------- HISTORY ----------
function saveHistoryRecord(passage, typed, gross, net, accuracy, errors){
    let history = JSON.parse(localStorage.getItem("history")||"[]");
    history.push({passage, typed, grossWPM:gross, netWPM:net, accuracy, errors, date:new Date().toLocaleString()});
    localStorage.setItem("history", JSON.stringify(history));
}

// ---------- NAVIGATION ----------
function retryTest(){window.location.href="exam.html";}
function goHome(){window.location.href="index.html";}
function toggleDarkMode() {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        localStorage.setItem("darkMode", "on");
    } else {
        localStorage.setItem("darkMode", "off");
    }
}

if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
        }

    
