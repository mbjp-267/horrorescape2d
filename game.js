// Load gambar player
const playerImg = new Image();
playerImg.src = "assets/img/player.png";

// Load gambar musuh
const ghostImgs = [
  new Image(),
  new Image(),
  new Image()
];
ghostImgs[0].src = "assets/img/ghost1.png";
ghostImgs[1].src = "assets/img/ghost2.png";
ghostImgs[2].src = "assets/img/ghost3.png";

// Ambil elemen container dan canvas dari HTML
const gameContainer = document.getElementById("game-container");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Ukuran petak map (40x40px)
const tileSize = 40;

// Map game: 0 = jalan, 1 = tembok, 2 = tujuan (keluar)
const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,0,1,0,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,1,0,1,1,0,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,0,1,0,0,1,1,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1],
  [2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1],
  [1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Inisialisasi ukuran canvas berdasarkan map
const rows = map.length;
const cols = map[0].length;

// Atur ukuran canvas mengikuti ukuran map
canvas.width = cols * tileSize;
canvas.height = rows * tileSize;

// posisi awal player
const startPos = { x: 1, y: 1 };
let playerPos = { ...startPos };

// posisi awal dan status musuh masing2
let ghosts = [
  { x: 18, y: 1, active: true, chasingLineOfSight: false },
  { x: 1, y: 13, active: true, chasingLineOfSight: false },
  { x: 18, y: 13, active: true, chasingLineOfSight: false }
];

let lives = 3;                    //jumlah nyawa
let paused = false;               //status pause
let pauseOverlay = null;          //tampilan pause
let gameOverFlashing = false;     //efek flashing saat mati
let flashAlpha = 0;               //transparansi efek flash
let ghostInterval;                //interval gerakan musuh
let currentGhostSpeed = 1000;     //kecepatan musuh sekarang
const ghostSpeedNormal = 1000;    //kecepatan normal
const ghostSpeedChase = 400;      //kecepatan saat mengejar

function stopGhosts() {
  clearInterval(ghostInterval);   //berhenti gerak ghost
}

//bgm langkah kaki
const footstepSounds = [
  new Audio("assets/audio/step 1.mp3"),
  new Audio("assets/audio/step 2.mp3")
];
footstepSounds.forEach(s => {
  s.volume = 0.9;
});

//bgm musuh saat menyerang player
const ghostAttackSounds = [
  new Audio("assets/audio/pocong-attack.mp3"),
  new Audio("assets/audio/genderuwo-attack.mp3"),
  new Audio("assets/audio/kunti-attack.mp3")
];

// Atur volume dan karakter suara masing-masing ghost
ghostAttackSounds[0].volume = 1.0;
ghostAttackSounds[0].playbackRate = 1.05; // Pocong - agak cepat

ghostAttackSounds[1].volume = 1.0;
ghostAttackSounds[1].playbackRate = 0.9;  // Genderuwo - lebih berat

ghostAttackSounds[2].volume = 1.0;
ghostAttackSounds[2].playbackRate = 1.2;  // Kunti - tajam & tinggi

//suara scream tiap musuh melihat player (fallback)
const scream = new Audio("assets/audio/ghost-attack.mp3");
scream.volume = 1.0;

//bgm in-game
const bgm = new Audio("assets/audio/bg-horror.mp3");
bgm.loop = true;
bgm.volume = 1.0;

//bgm di front screen
const startScreenMusic = new Audio("assets/audio/opening.mp3");
startScreenMusic.loop = true;
startScreenMusic.volume = 0.9;

//bgm player menyerang musuh
const throwSound = new Audio("assets/audio/throw.mp3");
throwSound.volume = 0.8;

//sambil takbir
const gruntSound = new Audio("assets/audio/allahuakbar.mp3");
gruntSound.volume = 0.9;

//bgm musuh terkena serangan
const ghostHitSounds = [
  new Audio("assets/audio/pocong-hit.mp3"),
  new Audio("assets/audio/genderuwo-hit.mp3"),
  new Audio("assets/audio/kunti-hit.mp3")
];
ghostHitSounds.forEach(s => s.volume = 1.0);

//bgm ketika lolos
const winSound = new Audio("assets/audio/win.mp3");
winSound.volume = 0.8;

//sambil ucap hamdalah
const cheerSound = new Audio("assets/audio/alhamdulillah.mp3");
cheerSound.volume = 1.0;

//bgm quit screen
const quitSound = new Audio("assets/audio/quit-sound.mp3");
quitSound.volume = 1.0;

//langkah kaki
let stepIndex = 0; //index langkah kaki
let lastStepTime = 0; //langkah terakhir untuk jeda antar suara
const footstepCooldown = 300; //jarak waktu (ms) 
let started = false;          //musuh bergerak ketika start
let recentlyAttacked = false; //terkena hit 1x

//menampilkan pesan di tengah layar.
function showMessage(text, options = {}) {
  const messageDiv = document.createElement("div");
  messageDiv.innerText = text;
  messageDiv.style.position = "absolute";
  messageDiv.style.top = "50%";
  messageDiv.style.left = "50%";
  messageDiv.style.transform = "translate(-50%, -50%)";
  messageDiv.style.padding = "20px 40px";
  messageDiv.style.background = "rgba(0, 0, 0, 0.8)";
  messageDiv.style.color = "white";
  messageDiv.style.fontSize = "32px";
  messageDiv.style.fontFamily = options.fontFamily || "sans-serif";
  messageDiv.style.zIndex = 10;
  messageDiv.style.borderRadius = "12px";
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 2000);
}
// peluru/lempar jumrah
let projectiles = [];
let lastDirection = { dx: 0, dy: -1 }; // default arah awal ke atas

//gerakan player
function movePlayer(dx, dy) {
  const newX = playerPos.x + dx;
  const newY = playerPos.y + dy;

  //cek apakah posisi baru valid (tidak tembok)
  if (
    newY >= 0 && newY < rows &&
    newX >= 0 && newX < cols &&
    map[newY][newX] !== 1
  ) {
    playerPos.x = newX;
    playerPos.y = newY;

    //Memutar bgm footsteps
  const now = Date.now();
    if (now - lastStepTime > footstepCooldown) {
    const footstep = footstepSounds[stepIndex];
    footstep.currentTime = 0;
    footstep.play();
    lastStepTime = now;
    stepIndex = (stepIndex + 1) % footstepSounds.length;
  }
  
  //jika player mencapai pintu keluar
  if (map[playerPos.y][playerPos.x] === 2) {
      stopGhosts();
      bgm.pause();
      cheerSound.currentTime = 0; //bgm hamdalah
      cheerSound.play();
      setTimeout(() => winSound.play(), 300); //setelah 300ms putar bgm win
      winSound.currentTime = 0; //reset waktu bgm win
      winSound.play();
      showEndScreen("yoU MaNaGeD tO eSCaPe!");
      return;
    }

    lastDirection = { dx, dy }; //Jika tidak menang, simpan arah terakhir gerakan player
    drawMap(); //Gambar ulang map setelah player bergerak
  }
}

// Keyboard event untuk gerakan dan serangan
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    //player melempar jumrah
    if (!paused) {
      throwSound.currentTime = 0; //suara lempar
      throwSound.play();
      gruntSound.currentTime = 0; //suara takbir
      gruntSound.play();

      projectiles.push({
        x: playerPos.x,         //posisi awal x peluru
        y: playerPos.y,         //posisi awal y peluru
        dx: lastDirection.dx,   //Arah gerakan X peluru berdasarkan arah terakhir player bergerak
        dy: lastDirection.dy,   //Arah gerakan Y peluru berdasarkan arah terakhir player bergerak
      });
    }
    return;
  }

  //tombol pause (p)
  if (e.key.toLowerCase() === "p") {
    togglePause(); //tombol pause
    return;
  }

  if (paused) return;

  //menggerakan player (w,a,s,d)
  switch (e.key.toLowerCase()) {
    case 'w': movePlayer(0, -1); break;
    case 's': movePlayer(0, 1); break;
    case 'a': movePlayer(-1, 0); break;
    case 'd': movePlayer(1, 0); break;
  }
});

// Event listener untuk mendeteksi saat tombol dilepas (keyup)
document.addEventListener("keyup", (e) => {
  if (["w", "a", "s", "d"].includes(e.key.toLowerCase())) {
    //Hentikan semua suara langkah
    footstepSounds.forEach(s => s.pause());
  }
});

function findPath(start, end) {
  const open = [start]; // Daftar node yang akan diperiksa (open list)
  const cameFrom = {};  // Objek untuk menyimpan node asal dari tiap node (digunakan saat rekonstruksi jalur)
  const gScore = {};    // Biaya sebenarnya dari start ke node saat ini
  const fScore = {};    // Perkiraan total biaya dari start ke end melewati node ini

  const key = (pos) => `${pos.x},${pos.y}`; // Fungsi untuk membuat key unik berdasarkan koordinat
  gScore[key(start)] = 0;                   // Biaya awal (gScore) ke titik start adalah 0
  fScore[key(start)] = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);  // fScore awal menggunakan estimasi jarak Manhattan ke tujuan

  while (open.length > 0) {   // Selama masih ada node di daftar open (yang belum diperiksa)
    open.sort((a, b) => (fScore[key(a)] || Infinity) - (fScore[key(b)] || Infinity)); // Urutkan node berdasarkan fScore terendah
    const current = open.shift(); // Ambil node dengan fScore terendah
    if (current.x === end.x && current.y === end.y) { // Jika sudah sampai ke tujuan
      // Bangun kembali path dari start ke end
      let path = [];
      let currKey = key(current);
      while (cameFrom[currKey]) {
        path.unshift(current);
        current = cameFrom[currKey];
        currKey = key(current);
      }
      return path;
    }

    // Arah pergerakan (atas, bawah, kiri, kanan)
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    for (let dir of dirs) {
      const neighbor = { x: current.x + dir.dx, y: current.y + dir.dy };  // Tentukan posisi tetangga

      // Lewati jika di luar batas map atau kena tembok
      if (
        neighbor.x < 0 || neighbor.y < 0 ||
        neighbor.x >= cols || neighbor.y >= rows ||
        map[neighbor.y][neighbor.x] === 1
      ) continue;

      // Hitung biaya dari start ke neighbor via current
      const tentativeG = (gScore[key(current)] || Infinity) + 1;

      // Jika biaya ini lebih baik dari sebelumnya, simpan jalurnya
      if (tentativeG < (gScore[key(neighbor)] || Infinity)) {
        cameFrom[key(neighbor)] = current;
        gScore[key(neighbor)] = tentativeG;

        // Perkiraan total biaya ke tujuan
        fScore[key(neighbor)] = tentativeG + Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);

        // Jika neighbor belum ada di daftar open, tambahkan
        if (!open.find(p => p.x === neighbor.x && p.y === neighbor.y)) {
          open.push(neighbor);
        }
      }
    }
  }

  return null;
}

//jumpscare ringan
function showJumpscare(index, callback) {
  const overlay = document.getElementById("jumpscare-overlay");

  const bgImages = [
    "assets/img/pocong.jpg",
    "assets/img/genderuwo.jpg",
    "assets/img/kuntilanak.jpg"
  ];

  overlay.style.backgroundImage = `url(${bgImages[index]})`;
  overlay.style.display = "block";

   //Suara ghost attack langsung dimainkan
  if (ghostAttackSounds[index]) {
    ghostAttackSounds[index].currentTime = 0;
    ghostAttackSounds[index].play();
  } else {
    scream.play();
  }

  setTimeout(() => {
    overlay.style.display = "none";
    if (callback) callback();
  }, 1300);
}


//fungsi AI musuh: gerak musuh (ghost)
function moveGhosts() {
  if (recentlyAttacked) return; //cegah serangan berulang

  let anyChasing = false; //mengejar player

  for (let ghost of ghosts) { //Loop untuk setiap ghost yang ada dalam array `ghosts`
  let moved = false;  // Penanda apakah ghost ini berhasil bergerak di langkah ini
  let chasing = false;  // Penanda apakah ghost ini sedang mengejar player karena melihatnya langsung (dalam satu garis)

  //cek garis lurus horizontal
  if (playerPos.y === ghost.y) {
    const [minX, maxX] = [ghost.x, playerPos.x].sort((a, b) => a - b);
    let clear = true;
    for (let x = minX + 1; x < maxX; x++) {
      if (map[ghost.y][x] !== 0) {
        clear = false;
        break;
      }
    }
    if (clear) {
      if (!ghost.chasingLineOfSight) {
        scream.pause();
        scream.currentTime = 0;
        scream.play();
        ghost.chasingLineOfSight = true;
      }

      chasing = true;
      ghost.x += playerPos.x > ghost.x ? 1 : -1;
      moved = true;
    }
  }

  //cek garis lurus vertikal
  if (!moved && playerPos.x === ghost.x) {
    const [minY, maxY] = [ghost.y, playerPos.y].sort((a, b) => a - b);
    let clear = true;
    for (let y = minY + 1; y < maxY; y++) {
      if (map[y][ghost.x] !== 0) {
        clear = false;
        break;
      }
    }
    if (clear) {
      chasing = true;
      ghost.y += playerPos.y > ghost.y ? 1 : -1;
      moved = true;
    }
  }

  //jika ghost tidak bisa melihat langsung, gunakan pathfinding
if (!moved) {
  const path = findPath({ x: ghost.x, y: ghost.y }, playerPos);

  if (path && path.length > 0) {
    const nextStep = path[0];
    ghost.x = nextStep.x;
    ghost.y = nextStep.y;
    chasing = true;
    moved = true;
  } else {
    // Fallback gerakan acak
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    for (let dir of dirs.sort(() => Math.random() - 0.5)) {
      const nx = ghost.x + dir.dx;
      const ny = ghost.y + dir.dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && map[ny][nx] === 0) {
        ghost.x = nx;
        ghost.y = ny;
        break;
      }
    }
  }
}

  //serang player jika posisi 1 lane
  if (ghost.x === playerPos.x && ghost.y === playerPos.y) {
    recentlyAttacked = true;
    const index = ghosts.indexOf(ghost);
    
  showJumpscare(index, () => { //menampilkan jumpscare ringan
  lives--;
    
    if (lives <= 0) {
      stopGhosts();
      flashRed(() => {
        showEndScreen("YoU dIeD!!!"); //game over screen
      });
    } else {
      flashPurple(() => {
        showMessage(`yOu aRE AttAcKeD! rEMAiNiNg LiVes: ${lives}`, { //pesan peringatan jika diserang ghost namun masih punya nyawa
          fontFamily: "'Rubik Wet Paint', system-ui"
        });
        playerPos = { ...startPos };
        drawMap();
        startGhostMovement(currentGhostSpeed);
      });
    }

    setTimeout(() => {
      recentlyAttacked = false;
  }, 1000);
  });

    return;
}

  if (chasing) anyChasing = true;     // Set variabel global menjadi true (digunakan untuk mempercepat semua ghost)
  if (!chasing) ghost.chasingLineOfSight = false;     // Reset status pengejaran langsung (agar scream bisa diputar lagi saat terlihat)
  }

  //atur kecepatan musuh (ghost)
  if (anyChasing && currentGhostSpeed !== ghostSpeedChase) {
    currentGhostSpeed = ghostSpeedChase;
    if (started) startGhostMovement(ghostSpeedChase);
  } else if (!anyChasing && currentGhostSpeed !== ghostSpeedNormal) {
    currentGhostSpeed = ghostSpeedNormal;
    if (started) startGhostMovement(ghostSpeedNormal);
  }
  
  drawMap();
}

function drawMap(flashColor = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //gambar map
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (map[y][x] === 1) {
        ctx.fillStyle = "#323232"; //tembok
      } else if (map[y][x] === 2) {
        ctx.fillStyle = "white"; //pintu
      } else {
        ctx.fillStyle = "#655f5b"; //jalanan
      }
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // gambar player
  ctx.fillStyle = "#cb9676";
  ctx.fillRect(playerPos.x * tileSize, playerPos.y * tileSize, tileSize, tileSize);
  ctx.drawImage(playerImg, playerPos.x * tileSize, playerPos.y * tileSize, tileSize, tileSize);

  // gambar musuh
  ghosts.forEach((ghost, index) => {
    if (!ghost.active) return;
    if (index === 0) ctx.fillStyle = "#e32227";
    else if (index === 1) ctx.fillStyle = "#6d16e1";
    else if (index === 2) ctx.fillStyle = "#fffb00";
    ctx.fillRect(ghost.x * tileSize, ghost.y * tileSize, tileSize, tileSize);
    ctx.drawImage(ghostImgs[index], ghost.x * tileSize, ghost.y * tileSize, tileSize, tileSize);
    });
    
    //gambar jumrah
  ctx.fillStyle = "white";
    projectiles.forEach(p => {
  ctx.beginPath();
  ctx.arc(p.x * tileSize + tileSize/2, p.y * tileSize + tileSize/2, tileSize / 4, 0, Math.PI * 2);
  ctx.fill();
});

//gambar nyawa
  ctx.fillStyle = "white";
  ctx.font = "26px 'Shadows Into Light', cursive";
  ctx.fillText("❤️ x" + lives, 10, 25);

  //layar merah kedip-kedip ketika diserang 3 kali
  if (gameOverFlashing && flashColor) {
    ctx.fillStyle = `rgba(${flashColor === "red" ? "255, 0, 0" : "200, 0, 255"}, ${flashAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

//jika game sedang di pause
if (paused) {
  stopGhosts();            //hentikan gerakan ghost
  showPauseScreen();      //menampilkan overlay pause
  bgm.pause();            //jeda bgm in-game
}

drawMap();

// fungsi layar merah kedap-kedip (game over)
function flashRed(callback) {
  let flashCount = 0;
  gameOverFlashing = true;

  const flashInterval = setInterval(() => {
    flashAlpha = flashAlpha === 0 ? 0.4 : 0;
    drawMap("red");

    flashCount++;
    if (flashCount >= 6) { //6 kedipan
      clearInterval(flashInterval); //nonaktif mode flashing
      gameOverFlashing = false;
      flashAlpha = 0;
      drawMap();
      callback();   //menjalankan fungsi lanjutan (menampilkan endscreen)
    }
  }, 150); // Ulangi setiap 150ms
}

//fungsi layar ungu kedap-kedip
function flashPurple(callback) {
  let flashCount = 0;
  gameOverFlashing = true;

  const flashInterval = setInterval(() => {
    flashAlpha = flashAlpha === 0 ? 0.4 : 0;
    drawMap("purple");

    flashCount++;
    if (flashCount >= 6) {
      clearInterval(flashInterval);
      gameOverFlashing = false;
      flashAlpha = 0;
      drawMap();
      callback();
    }
  }, 150);
}

function startGhostMovement(speed) {
  clearInterval(ghostInterval);     //Hentikan interval ghost sebelumnya (jika ada)
  ghostInterval = setInterval(moveGhosts, speed);     // Mulai ulang interval pergerakan ghost berdasarkan kecepatan yang diberikan
}

//Fungsi update peluru dan deteksi tabrakan
function updateProjectiles() {
  // Loop dari belakang array projectiles agar bisa hapus aman saat iterasi
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];

    // Gerakkan peluru sesuai arah (dx, dy)
    p.x += p.dx;
    p.y += p.dy;

    // Jika menabrak dinding
    if (
      p.x < 0 || p.y < 0 || p.x >= cols || p.y >= rows ||
      map[p.y][p.x] === 1 // tile 1 = tembok
    ) {
      projectiles.splice(i, 1); // hapus peluru dari array
      continue;
    }

    // Jika mengenai ghost
    for (let g = 0; g < ghosts.length; g++) {
    const ghost = ghosts[g];

    // Lewati jika ghost tidak aktif (posisinya -1 atau belum respawn)
    if (ghost.x === -1 || ghost.y === -1) continue;

      // Ghost "mati", respawn 5 detik kemudian
      if (ghost.active && ghost.x === p.x && ghost.y === p.y) {
        
        //memutar suara ghost-attack
        if (ghostHitSounds[g]) {
      ghostHitSounds[g].currentTime = 0;
      ghostHitSounds[g].play();
    }


    // Tentukan posisi spawn ulang ghost berdasarkan index
        const ghostStart = [
          { x: 18, y: 1 },
          { x: 1, y: 13 },
          { x: 18, y: 13 }
        ][g];

        // "Matikan" ghost: sembunyikan dari map sementara
        ghosts[g].x = -1;
        ghosts[g].y = -1;
        ghosts[g].active = false;

        // Setelah 5 detik, respawn ghost ke posisi awal
        setTimeout(() => {
          ghosts[g].x = ghostStart.x;
          ghosts[g].y = ghostStart.y;
          ghosts[g].active = true;
        }, 5000);

        // Hapus peluru yang mengenai ghost
        projectiles.splice(i, 1);
        break;  // keluar dari loop ghost karena peluru hanya bisa mengenai satu
      }
    }
  }
}

setInterval(() => {
  if (!paused) {      //Jalankan hanya jika game tidak dalam keadaan pause
    updateProjectiles();  // Perbarui posisi semua peluru dan cek apakah ada yang menabrak tembok atau mengenai musuh
    drawMap();
  }
}, 100);

//menampilkan layar akhir
function showEndScreen(message) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = 999;
  overlay.style.backgroundSize = "cover";
  overlay.style.backgroundPosition = "center";
  overlay.style.backgroundRepeat = "no-repeat";

  const msg = document.createElement("div");
  msg.innerText = message;
  msg.style.fontSize = "32px";
  msg.style.marginBottom = "20px";
  msg.style.fontFamily = "Rubik Wet Paint, system-ui";
  msg.style.textShadow = "2px 2px 4px #000";

  const lower = message.toLowerCase();
  if (lower.includes("escape") || lower.includes("win") || lower.includes("berhasil")) {
  overlay.style.backgroundImage = "url('assets/img/win-screen.jpg')";
  msg.style.color = "#00ff99";
} else if (lower.includes("died") || lower.includes("mati")) {
  overlay.style.backgroundImage = "url('assets/img/lose-screen.jpg')";
  msg.style.color = "#ff3333";
} else {
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
}

//tombol restart ke menu
  const btn = document.createElement("button");
  btn.id = "restart-button";
  btn.innerText = "BaCK tO mEnU";
  btn.style.padding = "10px 20px";
  btn.style.fontSize = "20px";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.cursor = "pointer";
  btn.style.fontFamily = "'Rubik Wet Paint', system-ui";

  btn.onclick = () => {
  const overlay = btn.parentElement; // Ambil div overlay win/lose
  fadeOutAndHide(overlay, () => {
    overlay.remove(); // Hapus overlay dari DOM

    // Tampilkan kembali layar start
    fadeInAndShow(startScreen);
    startScreenMusic.play();
    gameContainer.classList.add("hidden");

    // Reset state game
    lives = 3;
    playerPos = { ...startPos };

    // Reset ghost
    ghosts.forEach((g, i) => {
      const ghostStart = [
        { x: 18, y: 1 },
        { x: 1, y: 13 },
        { x: 18, y: 13 }
      ][i];
      g.x = ghostStart.x;
      g.y = ghostStart.y;
      g.active = true;
    });

    drawMap();
  });
};

  overlay.appendChild(msg);
  overlay.appendChild(btn);
  document.body.appendChild(overlay);
}

//menampilkan layar pause
function showPauseScreen() {
  pauseOverlay = document.createElement("div");
  pauseOverlay.id = "pause-screen";
  pauseOverlay.style.position = "fixed";
  pauseOverlay.style.top = 0;
  pauseOverlay.style.left = 0;
  pauseOverlay.style.width = "100vw";
  pauseOverlay.style.height = "100vh";
  pauseOverlay.style.backgroundImage = "url('assets/img/pause-screen.jpg')";
  pauseOverlay.style.backgroundSize = "cover";
  pauseOverlay.style.backgroundPosition = "center";
  pauseOverlay.style.backgroundRepeat = "no-repeat";
  pauseOverlay.style.display = "flex";
  pauseOverlay.style.flexDirection = "column";
  pauseOverlay.style.justifyContent = "center";
  pauseOverlay.style.alignItems = "center";
  pauseOverlay.style.zIndex = 999;

  const msg = document.createElement("div");
  msg.innerText = "PauSeD";
  msg.style.color = "#fbff00";
  msg.style.fontSize = "36px";
  msg.style.marginBottom = "20px";
  msg.style.fontFamily = "Rubik Wet Paint, system-ui";
  msg.style.textShadow = "2px 2px 4px black";

  //tombol continue
  const btnContinue = document.createElement("button");
  btnContinue.innerText = "conTINue";
  btnContinue.style.fontSize = "20px";
  btnContinue.style.padding = "10px 20px";
  btnContinue.style.borderRadius = "8px";
  btnContinue.style.border = "none";
  btnContinue.style.cursor = "pointer";
  btnContinue.style.fontFamily = "Rubik Wet Paint, system-ui";
  btnContinue.style.margin = "10px";
  btnContinue.onclick = () => togglePause();

  //tombol ke frontscreen
  const btnMenu = document.createElement("button");
  btnMenu.innerText = "BACk To mEnu";
  btnMenu.style.fontSize = "20px";
  btnMenu.style.padding = "10px 20px";
  btnMenu.style.borderRadius = "8px";
  btnMenu.style.border = "none";
  btnMenu.style.cursor = "pointer";
  btnMenu.style.fontFamily = "Rubik Wet Paint, system-ui";
  btnMenu.style.margin = "10px";
  btnMenu.onclick = () => {
    stopGhosts();
    paused = true;
    bgm.pause();
    hidePauseScreen();
    document.getElementById("start-screen").style.display = "flex";
  };

  pauseOverlay.appendChild(msg);
  pauseOverlay.appendChild(btnContinue);
  pauseOverlay.appendChild(btnMenu);
  document.body.appendChild(pauseOverlay);
}

function hidePauseScreen() {
  if (pauseOverlay) {
    pauseOverlay.remove();
    pauseOverlay = null;
  }
}

function togglePause() {
  paused = !paused;
  if (paused) {
    clearInterval(ghostInterval);
    showPauseScreen();
    bgm.pause();
  } else {
    hidePauseScreen();
    startGhostMovement(currentGhostSpeed);
    bgm.play();
  }
}

//Transisi antar layar
function fadeOutAndHide(element, callback) {
  element.classList.remove("fade-in");
  element.classList.add("fade-out");
  setTimeout(() => {
    element.style.display = "none";
    element.classList.remove("fade-out");
    if (callback) callback();
  }, 600);
}

function fadeInAndShow(element, display = "flex") {
  element.style.display = display;
  element.classList.remove("fade-out");
  element.classList.add("fade-in");
}

const startScreen = document.getElementById("start-screen");    // Ambil elemen HTML dengan id "start-screen" untuk digunakan sebagai layar awal game
const quitScreen = document.getElementById("quit-screen");      // Ambil elemen HTML dengan id "quit-screen" untuk digunakan sebagai layar keluar/quit

//event tombol Start dan Quit di menu screen
document.getElementById("start-button").addEventListener("click", () => {
  fadeOutAndHide(startScreen, () => {
    triggerStartJumpscare(() => {
      gameContainer.classList.remove("hidden");
      startScreen.style.display = "none";
      startScreenMusic.pause();
      startScreenMusic.currentTime = 0;

      // Reset posisi sebelum Start
      lives = 3;
      playerPos = { ...startPos };
      ghosts.forEach((g, i) => {
        const ghostStart = [
          { x: 18, y: 1 },
          { x: 1, y: 13 },
          { x: 18, y: 13 }
        ][i];
        g.x = ghostStart.x;
        g.y = ghostStart.y;
        g.active = true;
      });
      
      bgm.play();
      started = true;
      drawMap();
      startGhostMovement(currentGhostSpeed);
    });
  });
});

document.getElementById("quit-button").addEventListener("click", () => {
  gameContainer.classList.add("hidden");
  startScreen.style.display = "none";
    quitScreen.style.display = "flex";
    startScreenMusic.pause();
    startScreenMusic.currentTime = 0;
    bgm.pause();
  quitSound.currentTime = 0;
  quitSound.play();
});

//event kembali ke menu
document.getElementById("back-to-menu").addEventListener("click", () => {
  quitSound.pause();
  quitSound.currentTime = 0;
  quitScreen.style.display = "none";
  startScreen.style.display = "flex";
  startScreenMusic.play();
});

//reaksi tombol quit diklik
document.getElementById("quit-button").addEventListener("click", () => {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quit-screen").style.display = "flex";
  
  // Saat tombol "Exit Game" diklik
  document.getElementById("exit-game").addEventListener("click", () => {
    window.close();
    window.location.href = "https://google.com";
  });
});

// Ketika halaman HTML selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  startScreenMusic.play();                    //mainkan bgm opening
  gameContainer.classList.add("hidden");      //sembunyikan canvas sebelum dimulai
});

//menampilkan jumpscare saat memulai
function triggerStartJumpscare(callback) {
  const jumpscare = document.getElementById("start-jumpscare");
  const scream = document.getElementById("start-scream");

  jumpscare.style.display = "block";

  scream.currentTime = 0;
  scream.volume = 1.0;
  scream.play();

  setTimeout(() => {
    jumpscare.style.display = "none";
    if (callback) callback(); // lanjut ke start game
  }, 1500); // tampil selama 1.5 detik
}
