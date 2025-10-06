/*================================================== 
 - Mock data para os níveis do jogo Level Infernal -
==================================================*/

/* --- ARMADILHAS ---
Spike: Espinhos
Ceiling: triturador de teto
Falling: Platafora cadente
fakeDoor: Porta Falsa
movingWall: Parede Movel 
-------------------------------
fake: plataforma Falsa
disappear: Desaparece
isTimed: true
Delay  */


export const mockLevels = [
  {
    id: 1, // Levels
    name: "Confie no chão",
    hint: "Moleza... ou será que não?",
    platforms: [
      { x: 0, y: 550, width: 300, height: 50, color: "#2c2c2c" },
      { x: 400, y: 500, width: 200, height: 50, color: "#2c2c2c" },
      { x: 700, y: 450, width: 200, height: 50, color: "#2c2c2c" },
      { x: 1000, y: 400, width: 300, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "spike", x: 400, y: 480, width: 50, height: 20, active: false, delay: 1000 },
      { type: "falling", x: 700, y: 450, width: 200, height: 50, delay: 500 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 1150, y: 340 }
  },
  {
    id: 2,
    name: "Cuidado com o vão",
    hint: "Pulo com cuidado!",
    platforms: [
      { x: 0, y: 550, width: 250, height: 50, color: "#2c2c2c" },
      { x: 350, y: 550, width: 150, height: 50, color: "#2c2c2c", fake: true, delay: 1000 },
      { x: 600, y: 500, width: 200, height: 50, color: "#2c2c2c" },
      { x: 900, y: 450, width: 200, height: 50, color: "#2c2c2c" },
      { x: 1200, y: 400, width: 300, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "spike", x: 600, y: 480, width: 50, height: 20, active: false, delay: 1500 },
      { type: "spike", x: 900, y: 430, width: 50, height: 20, active: false, delay: 1000 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 1350, y: 340 }
  },
  {
    id: 3,
    name: "A traição",
    hint: "Tudo está bem...",
    platforms: [
      { x: 0, y: 550, width: 200, height: 50, color: "#2c2c2c" },
      { x: 300, y: 500, width: 150, height: 50, color: "#2c2c2c" },
      { x: 550, y: 450, width: 150, height: 50, color: "#2c2c2c", fake: true },
      { x: 800, y: 400, width: 200, height: 50, color: "#2c2c2c" },
      { x: 1100, y: 350, width: 400, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "spike", x: 300, y: 480, width: 150, height: 20, active: false , isTimed: true, delay: 500},
      { type: "movingWall", x: 1000, y: 200, width: 50, height: 200, direction: "down", speed: 6 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 1400, y: 290 }
  },
  {
    id: 4,
    name: "Ato de Desaparecimento",
    hint: "Não fique parado por muito tempo...",
    platforms: [
      { x: 0, y: 550, width: 200, height: 50, color: "#2c2c2c" },
      { x: 300, y: 500, width: 150, height: 50, color: "#2c2c2c", disappear: true, delay: 1000 },
      { x: 550, y: 450, width: 150, height: 50, color: "#2c2c2c", disappear: true, delay: 2000 },
      { x: 800, y: 400, width: 150, height: 50, color: "#2c2c2c", disappear: true, delay: 3000 },
      { x: 1050, y: 350, width: 150, height: 50, color: "#2c2c2c" },
      { x: 1300, y: 300, width: 250, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "spike", x: 1050, y: 340, width: 80, height: 20, active: false, delay: 3000 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 1450, y: 250 }
  },
  {
    id: 5,
    name: "The Crusher",
    hint: "Look up sometimes!",
    platforms: [
      { x: 0, y: 550, width: 250, height: 50, color: "#2c2c2c" },
      { x: 350, y: 500, width: 300, height: 50, color: "#2c2c2c" },
      { x: 750, y: 450, width: 250, height: 50, color: "#2c2c2c" },
      { x: 1100, y: 400, width: 400, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "ceiling", x: 350, y: 0, width: 300, height: 50, delay: 100, speed: 8 },
      { type: "spike", x: 750, y: 440, width: 100, height: 20, active: false, delay: 1000 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 1400, y: 350 }
  },
  {
    id: 6,
    name: "False Hope",
    hint: "The door is... wait, where?",
    platforms: [
      { x: 0, y: 550, width: 200, height: 50, color: "#2c2c2c" },
      { x: 300, y: 500, width: 200, height: 50, color: "#2c2c2c" },
      { x: 600, y: 450, width: 200, height: 50, color: "#2c2c2c" },
      { x: 900, y: 400, width: 200, height: 50, color: "#2c2c2c" },
      { x: 1200, y: 350, width: 300, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "spike", x: 300, y: 490, width: 200, height: 20, active: false, delay: 2500 },
      { type: "fakeDoor", x: 1250, y: 290, width: 40, height: 60, delay: 0 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 100, y: 450 }
  },
  {
    id: 7,
    name: "Spike Hell",
    hint: "Timing is everything!",
    platforms: [
      { x: 0, y: 550, width: 200, height: 50, color: "#2c2c2c" },
      { x: 300, y: 500, width: 150, height: 50, color: "#2c2c2c" },
      { x: 550, y: 450, width: 150, height: 50, color: "#2c2c2c" },
      { x: 800, y: 400, width: 150, height: 50, color: "#2c2c2c" },
      { x: 1050, y: 350, width: 150, height: 50, color: "#2c2c2c" },
      { x: 1300, y: 300, width: 250, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "spike", x: 250, y: 540, width: 50, height: 20, active: false, delay: 1000, duration: 1000 },
      { type: "spike", x: 500, y: 490, width: 50, height: 20, active: false, delay: 1500, duration: 1000 },
      { type: "spike", x: 750, y: 440, width: 50, height: 20, active: false, delay: 2000, duration: 1000 },
      { type: "spike", x: 1000, y: 390, width: 50, height: 20, active: false, delay: 2500, duration: 1000 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 1450, y: 250 }
  },
  {
    id: 8,
    name: "Betrayal Squared",
    hint: "Trust nothing!",
    platforms: [
      { x: 0, y: 550, width: 200, height: 50, color: "#2c2c2c" },
      { x: 300, y: 500, width: 150, height: 50, color: "#2c2c2c", fake: true },
      { x: 300, y: 450, width: 150, height: 50, color: "#2c2c2c" },
      { x: 550, y: 400, width: 200, height: 50, color: "#2c2c2c", disappear: true, delay: 3000 },
      { x: 850, y: 350, width: 200, height: 50, color: "#2c2c2c" },
      { x: 1150, y: 300, width: 400, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "spike", x: 850, y: 340, width: 200, height: 20, active: false, delay: 4000 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 1450, y: 250 }
  },
  {
    id: 9,
    name: "The Gauntlet",
    hint: "Speed is key!",
    platforms: [
      { x: 0, y: 550, width: 150, height: 50, color: "#2c2c2c" },
      { x: 250, y: 500, width: 100, height: 50, color: "#2c2c2c" },
      { x: 450, y: 450, width: 100, height: 50, color: "#2c2c2c" },
      { x: 650, y: 400, width: 100, height: 50, color: "#2c2c2c" },
      { x: 850, y: 350, width: 100, height: 50, color: "#2c2c2c" },
      { x: 1050, y: 300, width: 100, height: 50, color: "#2c2c2c" },
      { x: 1250, y: 250, width: 300, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "ceiling", x: 250, y: 0, width: 100, height: 50, delay: 1000, speed: 10 },
      { type: "ceiling", x: 650, y: 0, width: 100, height: 50, delay: 2000, speed: 10 },
      { type: "ceiling", x: 1050, y: 0, width: 100, height: 50, delay: 3000, speed: 10 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 1450, y: 200 }
  },
  {
    id: 10,
    name: "Final Betrayal",
    hint: "You thought you mastered this?",
    platforms: [
      { x: 0, y: 550, width: 200, height: 50, color: "#2c2c2c" },
      { x: 300, y: 500, width: 150, height: 50, color: "#2c2c2c", fake: true },
      { x: 300, y: 400, width: 150, height: 50, color: "#2c2c2c", disappear: true, delay: 2000 },
      { x: 550, y: 350, width: 150, height: 50, color: "#2c2c2c" },
      { x: 800, y: 300, width: 150, height: 50, color: "#2c2c2c", fake: true },
      { x: 800, y: 250, width: 150, height: 50, color: "#2c2c2c" },
      { x: 1050, y: 200, width: 150, height: 50, color: "#2c2c2c" },
      { x: 1300, y: 150, width: 250, height: 50, color: "#2c2c2c" }
    ],
    traps: [
      { type: "spike", x: 550, y: 340, width: 150, height: 20, active: false, delay: 3000 },
      { type: "ceiling", x: 1050, y: 0, width: 150, height: 50, delay: 4000, speed: 12 },
      { type: "fakeDoor", x: 1350, y: 90, width: 40, height: 60, delay: 0 }
    ],
    spawnPoint: { x: 50, y: 500 },
    exitDoor: { x: 1100, y: 140 }
  }
];

export const mockSounds = {
  jump: "jump.wav",
  death: "death.wav",
  complete: "complete.wav",
  trap: "trap.wav"
};

// Mensagens de troll mostradas na morte
export const trollMessages = [
  "Ops! Tente novamente... ou não 😏",
  "Isso foi ruim!",
  "Você viu isso acontecer?",
  "Muitos problemas de confiança?",
  "Talvez na próxima vez!",
  "O chão é lava... ou será que é?",
  "Surpresaaaaa! 🎉",
  "Mais sorte da próxima vez! hahahah",
  "Você quase conseguiu! Quase....",
  "A gravidade funciona, confirmadissmo 😂",
  "Aquela espigão tinha o seu nome nele!",
  "Depois volte para buscar o couro que você deixou nos espinhos!",
  "Dica profissional: Não morra!",
  "Você já tentou... não tocar nas armadilhas?",
  "Fisica: 1, Você: 0",
  "Está difícil? Não se preocupe, vai piorar."
];