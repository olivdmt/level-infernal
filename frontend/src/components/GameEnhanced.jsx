import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Skull, Volume2, VolumeX } from 'lucide-react';
import { mockLevels, trollMessages } from '../mock';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from '../hooks/use-toast';
import { date } from 'zod';

/* ===================================
----------- Constantes do Jogo -------
======================================*/
const CANVAS_WIDTH = 1600; // Largura do Canvas.
const CANVAS_HEIGHT = 600; // Altura do Canvas.
const PLAYER_WIDTH = 30;  // Largura do Personagem
const PLAYER_HEIGHT = 40; // Altura do Personagem
const GRAVITY = 0.8; // Força da gravidade aplicada verticalmente
const JUMP_FORCE = -15; // Força inicial do pulo (valor negativo para mover para cima).
const MOVE_SPEED = 6; // Velocidade de movimento horizontal.
const MAX_FALL_SPEED = 15; // Limite máximo para a velocidade de queda.

const Game = () => {
  // --- Referências e States do jogo (Dados) ---
  const canvasRef = useRef(null); // Referencia ao elemento <canva> do DOM
  const [gameState, setGameState] = useState('menu'); // Estado atual: 'menu', 'playing', 'victory'.
  const [currentLevel, setCurrentLevel] = useState(0); // Pindice do nível atual do array mockLevels.
  const [deathCount, setDeathCount] = useState(0);
  const [levelDeaths, setLevelDeaths] = useState(0);
  const [player, setPlayer] = useState(null);
  const [keys, setKeys] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const animationFrameRef = useRef(null);
  const [activeTraps, setActiveTraps] = useState([]);
  const [fallingPlatforms, setFallingPlatforms] = useState([]);
  const [disappearingPlatforms, setDisappearingPlatforms] = useState([]);
  const [movingTraps, setMovingTraps] = useState({});
  const gameTimeRef = useRef(0);
  const [timedTrapsState, setTimedTrapsState] = useState({});
  const [showTrollMessage, setShowTrollMessage] = useState(false);
  const [trollMessage, setTrollMessage] = useState('');

  // Inicia o player
  const initPlayer = useCallback(() => {
    const level = mockLevels[currentLevel];
    // Inicializa os estados das armadilhas que DEVEM começar ativas (ou prontas)
    const initialActivateTraps = [];
    const initialMovingTraps = {};
    // Itera sobre as armadilhas do nível
    level.traps.forEach((trap, idx) => {
      // Armadilhas que ativam por tempo, mas não são cíclicas
      // Se trap.delay for 0, ou se for um tipo que deve estar imediatamente no local (ex: fakeDoor)
      if (trap.type === 'fakeDoor' && (trap.delay === 0 || trap.delay === 'null')) {
        initialActivateTraps.push(idx);
      }
      // Para armadilhas de teto (ceiling), inicializa a posição no ponto de partida
      if (trap.type === 'ceiling') {
        initialMovingTraps[idx] = trap.y; // Configura o teto no topo
      }
    });

    setPlayer({
      x: level.spawnPoint.x,
      y: level.spawnPoint.y,
      velocityX: 0,
      velocityY: 0,
      isGrounded: false,
      isDead: false
    });
    setActiveTraps([]); // RESETA O STATE DE ARMADILHAS ATIVAS
    setFallingPlatforms([]);
    setDisappearingPlatforms([]);
    setMovingTraps({});
    gameTimeRef.current = 0; // RESETA O CONTADOR DE TEMPO
  }, [currentLevel]);

  // Key handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };
    const handleKeyUp = (e) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Collision detection
  const checkCollision = useCallback((rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y;
  }, []);

  // Show troll message on death
  const showTrollMsg = useCallback(() => {
    const msg = trollMessages[Math.floor(Math.random() * trollMessages.length)];
    setTrollMessage(msg);
    setShowTrollMessage(true);
    setTimeout(() => setShowTrollMessage(false), 2000);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing' || !player) return;

    const level = mockLevels[currentLevel];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const currentTime = Date.now();

      level.traps.forEach((trap, idx) => {
        // Lógica para Spikes temporizados (Pulasting)
        if (trap.type === 'spike' && trap.isTimed) {
          let currentState = timedTrapsState[idx];

          // Inicializa o estado se for a primeira vez
          if (!currentState) {
            setTimedTrapsState(prev => ({
              ...prev,
              [idx]: { isVisible: true, lastToogle: currentTime }
            }));
            // É importante retornar aqui para que a colisão não seja checada no mesmo frame em que o estado é inicializado.
            return
          }
          // Verifica se é hora de inverter (toggle)
          if (currentTime - currentState.lastToogle >= trap.delay) {
            setTimedTrapsState(prev => ({
              ...prev,
              [idx]: {
                isVisible: !currentState.isVisible,
                lastToogle: currentTime
              }
            }));
          }
        }
      })

      gameTimeRef.current += 16;

      // Update player
      let newPlayer = { ...player };

      // Horizontal movement
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        newPlayer.velocityX = -MOVE_SPEED;
      } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        newPlayer.velocityX = MOVE_SPEED;
      } else {
        newPlayer.velocityX = 0;
      }

      newPlayer.x += newPlayer.velocityX;

      // Movimento vertical (gravity)
      if (!newPlayer.isGrounded) {
        newPlayer.velocityY += GRAVITY;
        if (newPlayer.velocityY > MAX_FALL_SPEED) {
          newPlayer.velocityY = MAX_FALL_SPEED;
        }
      }

      // Pulo
      if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && newPlayer.isGrounded) {
        newPlayer.velocityY = JUMP_FORCE;
        newPlayer.isGrounded = false;
      }

      newPlayer.y += newPlayer.velocityY;

      // Check platform collisions
      newPlayer.isGrounded = false;
      level.platforms.forEach((platform, idx) => {
        if (fallingPlatforms.includes(idx) || disappearingPlatforms.includes(idx)) return;

        const playerRect = {
          x: newPlayer.x,
          y: newPlayer.y,
          width: PLAYER_WIDTH,
          height: PLAYER_HEIGHT
        };

        if (checkCollision(playerRect, platform)) {
          // Landing on platform from above
          if (player.y + PLAYER_HEIGHT <= platform.y + 10 && newPlayer.velocityY > 0) {
            newPlayer.y = platform.y - PLAYER_HEIGHT;
            newPlayer.velocityY = 0;
            newPlayer.isGrounded = true;

            // Trigger falling platform
            if (platform.fake && !fallingPlatforms.includes(idx)) {
              setTimeout(() => {
                setFallingPlatforms(prev => [...prev, idx]);
              }, 500);
            }

            // Trigger disappearing platform
            if (platform.disappear && platform.delay && gameTimeRef.current > platform.delay && !disappearingPlatforms.includes(idx)) {
              setTimeout(() => {
                setDisappearingPlatforms(prev => [...prev, idx]);
              }, 1000);
            }
          }
          // Hit from below
          else if (player.y >= platform.y + platform.height - 10 && newPlayer.velocityY < 0) {
            newPlayer.y = platform.y + platform.height;
            newPlayer.velocityY = 0;
          }
          // Side collision
          else {
            newPlayer.x = player.x;
          }
        }
      });

      // Activate traps based on time
      level.traps.forEach((trap, idx) => {
        if (trap.delay && gameTimeRef.current > trap.delay && !activeTraps.includes(idx)) {
          if (trap.type === 'spike' && trap.duration) {
            setActiveTraps(prev => [...prev, idx]);
            setTimeout(() => {
              setActiveTraps(prev => prev.filter(i => i !== idx));
            }, trap.duration);
            setTimeout(() => {
              setActiveTraps(prev => [...prev, idx]);
            }, trap.duration * 2);
          } else if (trap.type !== 'fakeDoor') {
            setActiveTraps(prev => [...prev, idx]);
          }
        }
      });

      // Update moving traps (ceiling crushers)
      level.traps.forEach((trap, idx) => {
        if (trap.type === 'ceiling' && activeTraps.includes(idx)) {
          const currentPos = movingTraps[idx] || trap.y;
          const newPos = currentPos + trap.speed;

          setMovingTraps(prev => ({
            ...prev,
            [idx]: newPos
          }));

          // Check collision with moving ceiling
          const ceilingRect = {
            x: trap.x,
            y: newPos,
            width: trap.width,
            height: trap.height
          };

          if (checkCollision({ x: newPlayer.x, y: newPlayer.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, ceilingRect)) {
            newPlayer.isDead = true;
          }

          // Reset ceiling if it goes off screen
          if (newPos > CANVAS_HEIGHT) {
            setMovingTraps(prev => ({
              ...prev,
              [idx]: trap.y
            }));
            setActiveTraps(prev => prev.filter(i => i !== idx));
          }
        } else if (trap.type === 'movingWall') {
          const currentX = movingTraps[idx] || trap.x;
          let newX = currentX;

          // Movimento simples (move para esquerda)
          newX = currentX - trap.speed;
          // Reset simples: Se sair da tela pela esquerda, volta para o canto direito
          if (newX + trap.width < 0) {
            newX = CANVAS_WIDTH;
          }

          setMovingTraps(prev => ({
            ...prev,
            [idx]: newX
          }));
          //Checagem de colisão com a parede movél
          const wallRect = {
            x: newX, // Usa a nova posição X
            y: trap.y,
            width: trap.width,
            height: trap.height
          };
          if (checkCollision({ x: newPlayer.x, y: newPlayer.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, wallRect)) {
            newPlayer.isDead = true;
          }
        }
      });

      // Check trap collisions
      level.traps.forEach((trap, idx) => {
        if (trap.type === 'spike') {
          // unifica a lógica de ativação
          const isSpikeActive = trap.isTimed
            ? (timedTrapsState[idx]?.isVisible ?? false)
            : activeTraps.includes(idx);

          if (isSpikeActive) {
            const trapRect = { x: trap.x, y: trap.y, width: trap.width, height: trap.height };
            if (checkCollision({ x: newPlayer.x, y: newPlayer.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, trapRect)) {
              newPlayer.isDead = true;
            }
          }
        }

        // Check fake door
        if (trap.type === 'fakeDoor') {
          const doorRect = { x: trap.x, y: trap.y, width: trap.width, height: trap.height };
          if (checkCollision({ x: newPlayer.x, y: newPlayer.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, doorRect)) {
            newPlayer.isDead = true;
          }
        }
      });

      // Check death (fall off screen)
      if (newPlayer.y > CANVAS_HEIGHT) {
        newPlayer.isDead = true;
      }

      // Check boundaries
      if (newPlayer.x < 0) newPlayer.x = 0;
      if (newPlayer.x > CANVAS_WIDTH - PLAYER_WIDTH) newPlayer.x = CANVAS_WIDTH - PLAYER_WIDTH;

      // Verifica a porta de saída
      const doorRect = { x: level.exitDoor.x, y: level.exitDoor.y, width: 40, height: 60 };
      if (checkCollision({ x: newPlayer.x, y: newPlayer.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, doorRect)) {
        if (currentLevel < mockLevels.length - 1) {
          setCurrentLevel(prev => prev + 1);
          setGameState('menu');
          setLevelDeaths(0);
        } else {
          setGameState('victory');
        }
        return;
      }

      // Lidar com a morte
      if (newPlayer.isDead && !player.isDead) { // Só conta a morte se ela for nova
        setDeathCount(prev => prev + 1); // Contador total de mortes
        setLevelDeaths(prev => prev + 1); // Contador de mortes por nível
        showTrollMsg();
        setPlayer({ ...newPlayer, isDead: true });
        setTimeout(() => {
          initPlayer();
        }, 1000);
        return; // Para a iteração atual do game loop
      } else if (player.isDead) {
        // Se ele já está morto (esperando o setTimeout), apenas para o loop,
        // Isoo impede que o setDeathCount seja o chamado novamente.
        return;
      }

      setPlayer(newPlayer);

      // Render
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#f5f1e8');
      gradient.addColorStop(1, '#e8e2d5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid pattern
      ctx.strokeStyle = '#d8d2c5';
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_WIDTH, i);
        ctx.stroke();
      }

      // Platforms
      level.platforms.forEach((platform, idx) => {
        let opacity = 1;
        if (fallingPlatforms.includes(idx)) {
          opacity = 0.3;
        } else if (disappearingPlatforms.includes(idx)) {
          opacity = 0;
        }

        ctx.globalAlpha = opacity;
        ctx.fillStyle = platform.fake && !fallingPlatforms.includes(idx) ? '#3a3a3a' : platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        ctx.globalAlpha = 1;
      });

      // Ativação de aramadilhas (Traps)
      level.traps.forEach((trap, idx) => {
        if (trap.type === 'spike') {
          // VERIFICAÇÃO DE VISIBILIDADE: Se for temporizada, usa o estado. Caso contrário, é sempre true.
          const isVisible = trap.isTimed ? (timedTrapsState[idx]?.isVisible ?? true) : true;

          // Lógica de Colisão
          if (isVisible) { /// Só desenha e checa a colisão se estiver visível}
            if (checkCollision({ x: newPlayer.x, y: newPlayer.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, trap)) {
              newPlayer.isDead = true;
            }
          }
          if (isVisible && activeTraps.includes(idx)) {
            ctx.fillStyle = '#dc2626';
            const spikeCount = Math.floor(trap.width / 15);
            for (let i = 0; i < spikeCount; i++) {
              ctx.beginPath();
              ctx.moveTo(trap.x + i * 15, trap.y + trap.height);
              ctx.lineTo(trap.x + i * 15 + 7.5, trap.y);
              ctx.lineTo(trap.x + i * 15 + 15, trap.y + trap.height);
              ctx.closePath();
              ctx.fill();
            }
          }
        } else if (trap.type === 'ceiling' && activeTraps.includes(idx)) {
          const currentY = movingTraps[idx] || trap.y;
          ctx.fillStyle = '#7c2d12';
          ctx.fillRect(trap.x, currentY, trap.width, trap.height);
          ctx.strokeStyle = '#57130b';
          ctx.lineWidth = 3;
          ctx.strokeRect(trap.x, currentY, trap.width, trap.height);

          // Draw warning indicator
          ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
          ctx.fillRect(trap.x, 0, trap.width, currentY);
        } else if (trap.type === 'fakeDoor') {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 3;
          ctx.strokeRect(trap.x, trap.y, trap.width, trap.height);

          // Draw X on fake door
          ctx.strokeStyle = '#450a0a';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(trap.x + 5, trap.y + 5);
          ctx.lineTo(trap.x + trap.width - 5, trap.y + trap.height - 5);
          ctx.moveTo(trap.x + trap.width - 5, trap.y + 5);
          ctx.lineTo(trap.x + 5, trap.y + trap.height - 5);
          ctx.stroke();
        } else if (trap.type === 'movingWall') {
          const currentX = movingTraps[idx] || trap.x;
          ctx.fillStyle = '#94a3b8' // Cor de metal/Parede
          ctx.fillRect(currentX, trap.y, trap.width, trap.height);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.strokeRect(currentX, trap.y, trap.width, trap.height);
        }
      });

      // Exit door
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(level.exitDoor.x, level.exitDoor.y, 40, 60);
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 3;
      ctx.strokeRect(level.exitDoor.x, level.exitDoor.y, 40, 60);

      // Door handle
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(level.exitDoor.x + 30, level.exitDoor.y + 30, 4, 0, Math.PI * 2);
      ctx.fill();

      // Player
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(newPlayer.x, newPlayer.y, PLAYER_WIDTH, PLAYER_HEIGHT);
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2;
      ctx.strokeRect(newPlayer.x, newPlayer.y, PLAYER_WIDTH, PLAYER_HEIGHT);

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(newPlayer.x + 8, newPlayer.y + 10, 6, 6);
      ctx.fillRect(newPlayer.x + 18, newPlayer.y + 10, 6, 6);

      // Pupils
      ctx.fillStyle = '#000000';
      const eyeDir = newPlayer.velocityX > 0 ? 2 : newPlayer.velocityX < 0 ? -2 : 0;
      ctx.fillRect(newPlayer.x + 10 + eyeDir, newPlayer.y + 12, 3, 3);
      ctx.fillRect(newPlayer.x + 20 + eyeDir, newPlayer.y + 12, 3, 3);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, player, keys, currentLevel, activeTraps, fallingPlatforms, disappearingPlatforms, movingTraps, checkCollision, initPlayer, showTrollMsg]);

  const startGame = () => {
    initPlayer();
    setGameState('playing');
  };

  const resetLevel = () => {
    setLevelDeaths(0);
    initPlayer();
  };

  const backToMenu = () => {
    setGameState('menu');
    setCurrentLevel(0);
    setDeathCount(0);
    setLevelDeaths(0);
  };

  if (gameState === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900 flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-lg border-yellow-500 p-12">
          <div className="text-center space-y-8">
            <Trophy className="w-32 h-32 mx-auto text-yellow-400" />
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
              CONGRATULATIONS!
            </h1>
            <p className="text-2xl text-slate-200 font-medium">
              You survived Level Infernal!
            </p>

            <div className="space-y-4 text-slate-300">
              <div className="flex items-center justify-center gap-4 text-2xl">
                <Skull className="w-8 h-8 text-red-400" />
                <span className="font-bold">{deathCount} Total Deaths</span>
              </div>
              <p className="text-lg">You've mastered all 10 levels of betrayal!</p>
            </div>

            <Button
              onClick={backToMenu}
              size="lg"
              className="w-full text-xl py-6 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold shadow-lg"
            >
              Play Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-lg border-slate-700 p-12">
          <div className="text-center space-y-8">
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">
              LEVEL INFERNAL
            </h1>
            <p className="text-xl text-slate-300 font-medium">
              Uma Experiência de Troll em Plataforma 2D
            </p>

            {currentLevel > 0 && (
              <div className="flex items-center justify-center gap-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Level {currentLevel + 1} / {mockLevels.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Skull className="w-5 h-5 text-red-500" />
                  <span>{deathCount} Mortes</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">
                Level {currentLevel + 1}: {mockLevels[currentLevel].name}
              </h2>
              <p className="text-lg text-slate-400 italic">
                "{mockLevels[currentLevel].hint}"
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={startGame}
                size="lg"
                className="w-full text-xl py-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold shadow-lg transition-all duration-300"
              >
                <Play className="w-6 h-6 mr-2" />
                {currentLevel === 0 ? 'Inicar Jogo' : 'Continue'}
              </Button>

              {currentLevel > 0 && (
                <Button
                  onClick={backToMenu}
                  variant="outline"
                  size="lg"
                  className="w-full text-lg py-4 border-slate-600 text-slate-300 hover:bg-slate-700 transition-all duration-300"
                >
                  Reiniciar para o Level 1
                </Button>
              )}
            </div>

            <div className="text-sm text-slate-500 space-y-2 pt-4">
              <p className="font-semibold text-slate-400">Controles:</p>
              <p>Teclas de seta ou WASD para se mover</p>
              <p>Espaço ou seta para Cima para pular</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold text-white">Level {currentLevel + 1} / {mockLevels.length}</h2>
            <div className="flex items-center gap-2 text-red-500">
              <Skull className="w-5 h-5" />
              <span className="text-xl font-bold">{levelDeaths}</span>
              <span className="text-sm text-slate-400">({deathCount} total)</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="outline"
              size="icon"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              onClick={resetLevel}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
            <Button
              onClick={backToMenu}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 transition-all duration-300"
            >
              Menu
            </Button>
          </div>
        </div>

        {/* Troll Message */}
        {showTrollMessage && (
          <div className="bg-red-600/90 backdrop-blur-lg border-2 border-red-400 rounded-lg p-4 text-center animate-bounce">
            <p className="text-2xl font-bold text-white">{trollMessage}</p>
          </div>
        )}

        {/* Game Canvas */}
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full border-2 border-slate-600 rounded"
          />
        </div>

        {/* Level Hint */}
        <div className="text-center bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-3">
          <p className="text-lg text-slate-400 italic">
            "{mockLevels[currentLevel].hint}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Game;