const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML 엘리먼트 가져오기
const nameInputScreen = document.getElementById("nameInputScreen");
const playerNameInput = document.getElementById("playerName");
const leaderboardScreen = document.getElementById("leaderboardScreen");
const leaderboardList = document.getElementById("leaderboardList");
const btnStart = document.getElementById("btn-start");
const btnRank = document.getElementById("btn-rank");
const buttonContainer = document.querySelector(".button-container");

// 1. 공룡 데이터
const dino = {
    x: 50,
    y: 300,
    width: 40,
    height: 50,
    dy: 0,
    jumpForce: 12,
    gravity: 0.65,
    isJumping: false
};

// 2. 게임 상태 데이터
let obstacles = [];
let score = 0;
let gameState = "START_MENU"; 

let obstacleTimer = 0;
let nextObstacleTime = 40; 
let gameSpeed = 6;         

// 처음 실행 시 메뉴 그리기
drawMenu();

// --- [기능] 점수 저장 및 불러오기 ---
function saveScore(name, score) {
    let currentRank = JSON.parse(localStorage.getItem("dinoScores")) || [];
    currentRank.push({ name: name, score: score });
    currentRank.sort((a, b) => b.score - a.score);
    currentRank = currentRank.slice(0, 5);
    localStorage.setItem("dinoScores", JSON.stringify(currentRank));
}

function showLeaderboard() {
    if (gameState === "GAME_OVER") {
        gameState = "RANKING_FROM_GAMEOVER";
    } else {
        gameState = "RANKING";
    }

    leaderboardList.innerHTML = "";
    let currentRank = JSON.parse(localStorage.getItem("dinoScores")) || [];
    
    if (currentRank.length === 0) {
        leaderboardList.innerHTML = "<li>등록된 기록이 없습니다!</li>";
    } else {
        currentRank.forEach((item, index) => {
            let medalClass = "";
            let medalNumber = index + 1;

            if (medalNumber === 1) medalClass = "medal medal-1";
            else if (medalNumber === 2) medalClass = "medal medal-2";
            else if (medalNumber === 3) medalClass = "medal medal-3";
            else medalClass = "medal medal-etc";

            leaderboardList.innerHTML += `
                <li>
                    <span class="${medalClass}">${medalNumber}</span>
                    <strong>${item.name}</strong> &nbsp;—&nbsp; ${item.score}점
                </li>
            `;
        });
    }
    leaderboardScreen.classList.remove("hidden");
}

function hideLeaderboard() {
    leaderboardScreen.classList.add("hidden");
    
    if (gameState === "RANKING_FROM_GAMEOVER") {
        gameState = "GAME_OVER";
        buttonContainer.classList.remove("hidden-btn");
        drawGameOver();
    } else {
        gameState = "START_MENU";
        buttonContainer.classList.remove("hidden-btn");
        drawMenu();
    }
}

// --- [기능] 게임 리셋 및 시작 ---
function startGame() {
    score = 0;
    obstacles = [];
    obstacleTimer = 0;
    nextObstacleTime = 40;
    dino.y = 300;
    dino.dy = 0;
    dino.isJumping = false;
    document.getElementById("score").innerText = "Score: 0";
    
    nameInputScreen.classList.add("hidden");
    leaderboardScreen.classList.add("hidden");
    buttonContainer.classList.add("hidden-btn");
    
    gameState = "PLAYING";
    update();
}

function backToMenu() {
    score = 0;
    obstacles = [];
    obstacleTimer = 0;
    dino.y = 300;
    dino.dy = 0;
    dino.isJumping = false;
    document.getElementById("score").innerText = "Score: 0";

    nameInputScreen.classList.add("hidden");
    leaderboardScreen.classList.add("hidden");
    buttonContainer.classList.remove("hidden-btn");

    gameState = "START_MENU";
    drawMenu();
}

// --- [그리기 함수들] ---
function drawMenu() {
    // 시작 메뉴는 항상 기본 밝은 테마로 리셋
    canvas.style.backgroundColor = "#ffffff"; 
    document.getElementById("score").style.color = "#535353";
    leaderboardScreen.classList.remove("dark-theme");
    nameInputScreen.classList.remove("dark-theme");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#333";
    ctx.font = "bold 35px Arial";
    ctx.fillText("장애물 피하기", canvas.width / 2 - 95, canvas.height / 2 - 20);
    
    ctx.font = "14px Arial";
    ctx.fillStyle = "#7f8c8d";
    ctx.fillText("게임 시작(S) / 역대 점수 확인(A)", canvas.width / 2 - 100, canvas.height / 2 + 30);
    
    btnStart.innerText = "게임시작 (S)";
    btnRank.innerText = "역대 점수 확인 (A)";
}

function drawGameOver() {
    let currentStage = Math.floor(score / 100);
    let isDarkTheme = (currentStage % 2 === 1);
    
    ctx.fillStyle = isDarkTheme ? "#ff7675" : "red"; 
    ctx.font = "bold 35px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2 - 20);
    
    ctx.fillStyle = isDarkTheme ? "#ffffff" : "#535353";
    ctx.font = "14px Arial";
    ctx.fillText("시작화면 메뉴 이동: [ESC] 또는 블록 버튼 터치", canvas.width / 2 - 130, canvas.height / 2 + 30);

    btnStart.innerText = "다시하기 (S)";
    btnRank.innerText = "역대 점수 확인 (A)";
}

// --- [메인 게임 루프] ---
function update(){
    if (gameState !== "PLAYING") return;

    let currentStage = Math.floor(score / 100);
    let isDarkTheme = (currentStage % 2 === 1); 

    // ★ [실시간 테마 감지] 배경 테마에 맞춰 캔버스, 점수판 UI의 색상을 스왑합니다.
    if (isDarkTheme) {
        canvas.style.backgroundColor = "#2c3e50"; 
        document.getElementById("score").style.color = "#ffffff"; 
        leaderboardScreen.classList.add("dark-theme");  // 점수판 밤 모드 On
        nameInputScreen.classList.add("dark-theme");     // 이름 입력창 밤 모드 On
    } else {
        canvas.style.backgroundColor = "#ffffff"; 
        document.getElementById("score").style.color = "#535353"; 
        leaderboardScreen.classList.remove("dark-theme"); // 점수판 낮 모드 Off
        nameInputScreen.classList.remove("dark-theme");    // 이름 입력창 낮 모드 Off
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let currentSpeed = gameSpeed + (score * 0.15); 

    // 공룡 움직임
    dino.dy += dino.gravity;
    dino.y += dino.dy;
    if (dino.y > 300){ dino.y = 300; dino.dy = 0; dino.isJumping = false; }
    
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

    // 장애물 생성 타이머
    obstacleTimer++;
    if (obstacleTimer >= nextObstacleTime) {
        
        if (score >= 30 && Math.random() < 0.25) {
            obstacles.push({ x: 800, y: 220, width: 30, height: 20, speed: currentSpeed, type: "bird" });
        } else {
            let rand = Math.random();

            if (score >= 100) {
                if (rand < 0.2) { createCactus(800, currentSpeed); }
                else if (rand < 0.4) { createCactus(800, currentSpeed); createCactus(830, currentSpeed); }
                else if (rand < 0.6) { createCactus(800, currentSpeed); createCactus(830, currentSpeed); createCactus(860, currentSpeed); }
                else if (rand < 0.8) { createCactus(800, currentSpeed); createCactus(830, currentSpeed); createCactus(860, currentSpeed); createCactus(890, currentSpeed); }
                else { createCactus(800, currentSpeed); createCactus(830, currentSpeed); createCactus(860, currentSpeed); createCactus(890, currentSpeed); createCactus(920, currentSpeed); } 
            }
            else if (score >= 50) {
                if (rand < 0.33) { createCactus(800, currentSpeed); }
                else if (rand < 0.66) { createCactus(800, currentSpeed); createCactus(830, currentSpeed); }
                else { createCactus(800, currentSpeed); createCactus(830, currentSpeed); createCactus(860, currentSpeed); }
            } 
            else if (score >= 10) {
                if (rand < 0.5) { createCactus(800, currentSpeed); }
                else { createCactus(800, currentSpeed); createCactus(830, currentSpeed); }
            } 
            else {
                createCactus(800, currentSpeed);
            }
        }
        obstacleTimer = 0;
        
        let minGap = Math.max(25, 45 - Math.floor(score * 0.1));
        nextObstacleTime = Math.floor(Math.random() * 35) + minGap;
    }

    // 장애물 처리 및 그리기
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= obs.speed; 

        if (isDarkTheme) {
            ctx.fillStyle = "#ffffff"; 
        } else {
            ctx.fillStyle = (obs.type === "bird") ? "#3498db" : "#e74c3c"; 
        }
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // 충돌 시
        if (dino.x < obs.x + obs.width && dino.x + dino.width > obs.x && dino.y < obs.y + obs.height && dino.y + dino.height > obs.y) {
            gameState = "NAME_INPUT";
            buttonContainer.classList.remove("hidden-btn"); 
            drawGameOver();
            nameInputScreen.classList.remove("hidden"); 
            playerNameInput.value = "";
            playerNameInput.focus(); 
            return;
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1); i--; score++;
            document.getElementById("score").innerText = "Score: " + score;
        }
    }
    requestAnimationFrame(update);
}

function createCactus(xPosition, speed) {
    obstacles.push({ x: xPosition, y: 310, width: 20, height: 40, speed: speed, type: "cactus" });
}

// --- 📱 화면 터치 및 버튼 누르기 제어 ---
function handleJumpAction() {
    if (gameState === "PLAYING" && !dino.isJumping) {
        dino.dy = -dino.jumpForce;
        dino.isJumping = true;
    }
}
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); 
    handleJumpAction();
});
canvas.addEventListener("mousedown", () => {
    handleJumpAction(); 
});

leaderboardScreen.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (gameState === "RANKING" || gameState === "RANKING_FROM_GAMEOVER") hideLeaderboard();
});
leaderboardScreen.addEventListener("click", () => {
    if (gameState === "RANKING" || gameState === "RANKING_FROM_GAMEOVER") hideLeaderboard();
});

function handleStartBlock() {
    if (gameState === "START_MENU" || gameState === "GAME_OVER") {
        startGame();
    }
}
btnStart.addEventListener("click", handleStartBlock);
btnStart.addEventListener("touchstart", (e) => { e.preventDefault(); handleStartBlock(); });

function handleRankBlock() {
    if (gameState === "START_MENU" || gameState === "GAME_OVER") {
        showLeaderboard();
    }
}
btnRank.addEventListener("click", handleRankBlock);
btnRank.addEventListener("touchstart", (e) => { e.preventDefault(); handleRankBlock(); });

// --- ⌨️ 키보드 제어 ---
window.addEventListener("keydown", (e) => {
    if (gameState === "PLAYING") {
        if (e.code === "Space") handleJumpAction();
    }
    else if (gameState === "NAME_INPUT") {
        if (e.code === "Enter") {
            let name = playerNameInput.value.trim() || "무명공룡";
            saveScore(name, score); 
            nameInputScreen.classList.add("hidden"); 
            gameState = "GAME_OVER"; 
            drawGameOver(); 
        }
    }
    else if (gameState === "GAME_OVER" || gameState === "START_MENU") {
        if (e.code === "KeyS") {
            startGame();
        } else if (e.code === "KeyA") {
            showLeaderboard(); 
        } else if (e.code === "Escape" && gameState === "GAME_OVER") {
            backToMenu();      
        }
    }
    else if (gameState === "RANKING" || gameState === "RANKING_FROM_GAMEOVER") {
        hideLeaderboard();
    }
});