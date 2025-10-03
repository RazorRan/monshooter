const board = document.getElementById("board");
    const jet = document.getElementById("jet");
    const pointsDisplay = document.getElementById("points");
    const overlay = document.getElementById("overlay");
    const startBtn = document.getElementById("startBtn");
    const overlaySubtitle = document.getElementById("overlaySubtitle");
    const healthFill = document.getElementById("healthfill");

    let bullets = [],
      rocks = [],
      moveDirection = 0,
      shootingInterval = null,
      rockTimer = null,
      frameId = null;
    let running = false,
      gameOver = false;
    let health = 5,
      maxHealth = 5;

   
    const jetSpeed = 0.02;
    const bulletSpeed = 0.015;

  
    const baseRockSpeed = 0.003;
    let rockSpeed = baseRockSpeed;
    const rockSpeedIncrement = 0.0008; 

    const shootInterval = 300,
     baseinterval = 700;
       let rockInterval =baseinterval;
    const  intervalincrement=100;

    /* Shoot sound */
    const shootSound = new Audio("sounds/shoot.wav");
    shootSound.preload = "auto";
    let audioUnlocked = false;

    function unlockAudio() {
      if (audioUnlocked) return;
      shootSound.volume = 0.09;
      shootSound.currentTime = 0;
      shootSound.play().then(() => {
        shootSound.pause();
        shootSound.currentTime = 0;
        audioUnlocked = true;
      }).catch(() => {});
    }

    function updateHealthBar() {
      healthFill.style.width = `${(health/maxHealth)*100}%`;
      healthFill.style.background = health > 2 ?
        "linear-gradient(90deg,#4caf50,#76ff03)" :
        "linear-gradient(90deg,#ff5722,#ff1744)";
    }

     
    function maybeIncreaseDifficulty() {
      const score = parseInt(pointsDisplay.textContent || "0", 10);
      if (score > 0 && score % 20 === 0) {
        const steps = Math.floor(score / 20);
        rockSpeed = baseRockSpeed + steps * rockSpeedIncrement;
        rockInterval = baseinterval+intervalincrement;
      }
    }

    function resetGame() {
      bullets.forEach(b => b.remove());
      rocks.forEach(r => r.remove());
      bullets = [];
      rocks = [];
      moveDirection = 0;
      if (shootingInterval) clearInterval(shootingInterval);
      if (rockTimer) clearInterval(rockTimer);
      if (frameId) cancelAnimationFrame(frameId);
      pointsDisplay.textContent = "0";
      jet.style.left = "50%";
      jet.style.transform = "translateX(-50%)";
      health = maxHealth;
      updateHealthBar();
      rockSpeed = baseRockSpeed; 
    }

    function startGame() {
      unlockAudio();
      running = true;
      gameOver = false;
      overlay.style.display = "none";
      board.classList.add("running");
      resetGame();
      rockTimer = setInterval(spawnRock, rockInterval);
      frameId = requestAnimationFrame(gameLoop);
    }

    function endGame() {
      running = false;
      gameOver = true;
      if (rockTimer) clearInterval(rockTimer);
      if (frameId) cancelAnimationFrame(frameId);
      overlay.style.display = "grid";
      board.classList.remove("running");
      overlaySubtitle.textContent = `Game Over! Final Score: ${pointsDisplay.textContent}`;
      startBtn.textContent = "Play Again";
    }

    /* ---------- FX helpers ---------- */
    function spawnMuzzleFlash() {
      const flash = document.createElement("div");
      flash.className = "muzzle";
      jet.appendChild(flash);
      flash.addEventListener("animationend", () => flash.remove());
    }

    function spawnExplosionAt(el) {
      const r = el.getBoundingClientRect(),
        b = board.getBoundingClientRect();
      const x = r.left - b.left + r.width / 2,
        y = r.top - b.top + r.height / 2;
      const boom = document.createElement("div");
      boom.className = "explosion";
      boom.style.left = x + "px";
      boom.style.top = y + "px";
      board.appendChild(boom);
      boom.addEventListener("animationend", () => boom.remove());
    }

    /* ---------- Spawners  ---------- */
    function shootBullet() {
      if (!running || gameOver) return;
      const b = document.createElement("div");
      b.classList.add("bullet");

      // size lock
      const bw = board.clientWidth * 0.04;
      b.style.width = bw + "px";
      b.style.height = (bw * 2) + "px";

      // position at jet nose
      const jetRect = jet.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      const x = (jetRect.left - boardRect.left) + (jetRect.width / 2) - (bw / 2);
      const y = (jetRect.top - boardRect.top) + (jetRect.height * 0.85);

      b.style.left = x + "px";
      b.style.bottom = (board.clientHeight - y) + "px";

      board.appendChild(b);
      bullets.push(b);

      spawnMuzzleFlash();
      shootSound.currentTime = 0;
      shootSound.play().catch(() => {});
    }

    function spawnRock() {
  if (!running || gameOver) return;
  const r = document.createElement("div");
  r.classList.add("rock");
  


  const rw = board.clientWidth * 0.12;
  r.style.width = rw + "px";
  r.style.height = rw + "px";

  const rockImages = ["bill.gif","chog.gif","unah.gif", "benads.gif","nini.gif","drake.gif"];
  const randomImg = rockImages[Math.floor(Math.random() * rockImages.length)];
  r.style.background = `url("${randomImg}") center/contain no-repeat`;

  const x = Math.random() * (board.clientWidth - rw);
  r.style.left = x + "px";
  r.style.top = "0px";

  board.appendChild(r);
  rocks.push(r);
}

    
    function isColliding(a, b) {
      const ra = a.getBoundingClientRect(),
        rb = b.getBoundingClientRect();
      return !(ra.top > rb.bottom || ra.bottom < rb.top || ra.left > rb.right || ra.right < rb.left);
    }

    
    function gameLoop() {
      if (!running) return;

      
      if (moveDirection !== 0) {
        let left = jet.offsetLeft + moveDirection * (board.clientWidth * jetSpeed);
        left = Math.max(0, Math.min(board.clientWidth - jet.offsetWidth, left));
        jet.style.left = left + "px";
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let bottom = parseFloat(b.style.bottom || "0");
        bottom += board.clientHeight * bulletSpeed;
        b.style.bottom = bottom + "px";

        if (bottom > board.clientHeight) {
          b.remove();
          bullets.splice(i, 1);
          continue;
        }

      
        for (let j = rocks.length - 1; j >= 0; j--) {
          const r = rocks[j];
          if (isColliding(b, r)) {
            spawnExplosionAt(r);
            b.remove();
            bullets.splice(i, 1);
            r.remove();
            rocks.splice(j, 1);
            pointsDisplay.textContent = (+pointsDisplay.textContent + 1).toString();
            maybeIncreaseDifficulty(); 
            break;
          }
        }
      }

      // Move rocks
      for (let i = rocks.length - 1; i >= 0; i--) {
        const r = rocks[i];
        let top = parseFloat(r.style.top || "0");
        top += board.clientHeight * rockSpeed; 
        r.style.top = top + "px";

        
        if (top + r.offsetHeight >= board.clientHeight) {
          r.remove();
          rocks.splice(i, 1);
          health--;
          updateHealthBar();
          if (health <= 0) {
            endGame();
            return;
          }
        }
      }

      frameId = requestAnimationFrame(gameLoop);
    }

    
    startBtn.addEventListener("click", startGame);
    window.addEventListener("keydown", (e) => {
      if (overlay.style.display !== "none" && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        startGame();
        return;
      }
      if (!running || gameOver) return;
      if (e.key === "ArrowLeft") moveDirection = -1;
      if (e.key === "ArrowRight") moveDirection = 1;
      if (e.key === "ArrowUp" || e.key === " " || e.key === "ArrowLeft" || e.key === "ArrowRight" ) shootBullet();
    });
    window.addEventListener("keyup", (e) => {
      if (!running || gameOver) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") moveDirection = 0;
    });
    board.addEventListener("touchstart", (e) => {
      if (!running || gameOver) return;
      const x = e.touches[0].clientX;
      const rect = board.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      moveDirection = x > mid ? 1 : -1;
      shootBullet();
      if (!shootingInterval) shootingInterval = setInterval(shootBullet, shootInterval);
    });
    board.addEventListener("touchend", () => {
      moveDirection = 0;
      if (shootingInterval) {
        clearInterval(shootingInterval);
        shootingInterval = null;
      }
    });