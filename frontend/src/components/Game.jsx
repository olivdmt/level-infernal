import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Skull } from 'lucide-react';
import { mockLevels } from '../mock';
import { Button } from './ui/button';
import { Card } from './ui/card';

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 40;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const MOVE_SPEED = 5;
const MAX_FALL_SPEED = 15;

const Game = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused
  const [currentLevel, setCurrentLevel] = useState(0);
  const [deathCount, setDeathCount] = useState(0);
  const [player, setPlayer] = useState(null);
  const [keys, setKeys] = useState({});
  const animationFrameRef = useRef(null);
  const [activeTraps, setActiveTraps] = useState([]);
  const [fallingPlatforms, setFallingPlatforms] = useState([]);
  const gameTimeRef = useRef(0);

  // Initialize player
  const initPlayer = useCallback(() => {
    const level = mockLevels[currentLevel];
    setPlayer({
      x: level.spawnPoint.x,
      y: level.spawnPoint.y,
      velocityX: 0,
      velocityY: 0,
      isGrounded: false,
      isDead: false
    });
    setActiveTraps([]);
    setFallingPlatforms([]);
    gameTimeRef.current = 0;
  }, [currentLevel]);

  // Key handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
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

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing' || !player) return;

    const level = mockLevels[currentLevel];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      gameTimeRef.current += 16;
      
      // Update player
      let newPlayer = { ...player };

      // Horizontal movement
      if (keys['ArrowLeft'] || keys['a']) {
        newPlayer.velocityX = -MOVE_SPEED;
      } else if (keys['ArrowRight'] || keys['d']) {
        newPlayer.velocityX = MOVE_SPEED;
      } else {
        newPlayer.velocityX = 0;
      }

      newPlayer.x += newPlayer.velocityX;

      // Vertical movement (gravity)
      if (!newPlayer.isGrounded) {
        newPlayer.velocityY += GRAVITY;
        if (newPlayer.velocityY > MAX_FALL_SPEED) {
          newPlayer.velocityY = MAX_FALL_SPEED;
        }
      }

      // Jump
      if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && newPlayer.isGrounded) {
        newPlayer.velocityY = JUMP_FORCE;
        newPlayer.isGrounded = false;
      }

      newPlayer.y += newPlayer.velocityY;

      // Check platform collisions
      newPlayer.isGrounded = false;
      level.platforms.forEach((platform, idx) => {
        if (fallingPlatforms.includes(idx)) return;

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
          setActiveTraps(prev => [...prev, idx]);
        }
      });

      // Check trap collisions
      level.traps.forEach((trap, idx) => {
        if (trap.type === 'spike' && activeTraps.includes(idx)) {
          const trapRect = { x: trap.x, y: trap.y, width: trap.width, height: trap.height };
          if (checkCollision({ x: newPlayer.x, y: newPlayer.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, trapRect)) {
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

      // Check exit door
      const doorRect = { x: level.exitDoor.x, y: level.exitDoor.y, width: 40, height: 60 };
      if (checkCollision({ x: newPlayer.x, y: newPlayer.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, doorRect)) {
        if (currentLevel < mockLevels.length - 1) {
          setCurrentLevel(prev => prev + 1);
          setGameState('menu');
        } else {
          setGameState('menu');
          alert('Congratulations! You completed all levels!');
        }
        return;
      }

      // Handle death
      if (newPlayer.isDead) {
        setDeathCount(prev => prev + 1);
        initPlayer();
        return;
      }

      setPlayer(newPlayer);

      // Render
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      ctx.fillStyle = '#f5f1e8';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid pattern
      ctx.strokeStyle = '#e8e2d5';
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
        if (fallingPlatforms.includes(idx)) {
          ctx.globalAlpha = 0.3;
        }
        ctx.fillStyle = platform.fake && !fallingPlatforms.includes(idx) ? '#3a3a3a' : platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        ctx.globalAlpha = 1;
      });

      // Traps
      level.traps.forEach((trap, idx) => {
        if (trap.type === 'spike') {
          if (activeTraps.includes(idx)) {
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
        }
      });

      // Exit door
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(level.exitDoor.x, level.exitDoor.y, 40, 60);
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 3;
      ctx.strokeRect(level.exitDoor.x, level.exitDoor.y, 40, 60);

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

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, player, keys, currentLevel, activeTraps, fallingPlatforms, checkCollision, initPlayer]);

  const startGame = () => {
    initPlayer();
    setGameState('playing');
  };

  const resetLevel = () => {
    initPlayer();
  };

  const backToMenu = () => {
    setGameState('menu');
    setCurrentLevel(0);
    setDeathCount(0);
  };

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
                  <span>Level {currentLevel + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Skull className="w-5 h-5 text-red-500" />
                  <span>{deathCount} Mortes</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">
                {mockLevels[currentLevel].name}
              </h2>
              <p className="text-lg text-slate-400 italic">
                "{mockLevels[currentLevel].hint}"
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={startGame}
                size="lg"
                className="w-full text-xl py-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold shadow-lg"
              >
                <Play className="w-6 h-6 mr-2" />
                {currentLevel === 0 ? 'Start Game' : 'Continue'}
              </Button>

              {currentLevel > 0 && (
                <Button 
                  onClick={backToMenu}
                  variant="outline"
                  size="lg"
                  className="w-full text-lg py-4 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Reiniciar para o Level 1
                </Button>
              )}
            </div>

            <div className="text-sm text-slate-500 space-y-2 pt-4">
              <p className="font-semibold text-slate-400">Controles:</p>
              <p>Teclas de seta ou WASD para se mover</p>
              <p>Spaço ou seta para Cima para pular</p>
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
            <h2 className="text-2xl font-bold text-white">Level {currentLevel + 1}</h2>
            <div className="flex items-center gap-2 text-red-500">
              <Skull className="w-5 h-5" />
              <span className="text-xl font-bold">{deathCount}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={resetLevel}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reinciar
            </Button>
            <Button 
              onClick={backToMenu}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Menu
            </Button>
          </div>
        </div>

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
        <div className="text-center">
          <p className="text-lg text-slate-400 italic">
            "{mockLevels[currentLevel].hint}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Game;