"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";
import p5 from "p5";
import { Volume2, VolumeX } from 'lucide-react';

interface GameProps {
  selectedShip: { src: string; alt: string };
}

const Game: React.FC<GameProps> = ({ selectedShip }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  const spaceshipRef = useRef<p5.Image | null>(null);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [backgroundMusic, setBackgroundMusic] = useState<HTMLAudioElement | null>(null);
  const [shootSound, setShootSound] = useState<HTMLAudioElement | null>(null);
  const [gameOverSound, setGameOverSound] = useState<HTMLAudioElement | null>(null);

  const toggleSound = useCallback(() => {
    setIsSoundOn((prevIsSoundOn) => {
      const newIsSoundOn = !prevIsSoundOn;
      if (backgroundMusic) {
        if (newIsSoundOn) {
          backgroundMusic.play();
        } else {
          backgroundMusic.pause();
        }
      }
      return newIsSoundOn;
    });
  }, [backgroundMusic]);

  const sketch = useCallback(
    (p: p5) => {
      p5Ref.current = p;
      // Only add key listeners in the browser
      const isClient = typeof window !== "undefined";
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === "ArrowLeft") changeLane(-1);
        if (event.key === "ArrowRight") changeLane(1);
        if (event.key === " ") {
          if (gameOver) resetGame();
          else shoot();
        }
      };

      if (isClient) {
        window.addEventListener("keydown", handleKeyPress);
      }

      let spaceshipLaneIndex = 1; // Start in the center lane
      const lanes = [100, 200, 300, 400]; // X positions for 3 lanes
      const baseSpeed = 2; // Initial speed of obstacles and enemies
      let speedMultiplier = 1; // Speed multiplier for increasing difficulty
      const MAX_BULLET_SPEED = 20; // Maximum speed for bullets
      const BASE_ENEMY_SHOOT_INTERVAL = 120; // Base interval for enemy shooting (in frames)
      const MIN_ENEMY_SHOOT_INTERVAL = 60; // Minimum interval for enemy shooting (in frames)
      let obstacles: { x: number; y: number; type: string }[] = [];
      let bullets: { x: number; y: number; isEnemy: boolean }[] = [];
      let enemySpaceships: { x: number; y: number; lane: number }[] = [];
      let explosions: { x: number; y: number; frame: number; size: number }[] = [];
      spaceshipRef.current = null;
      let enemySpaceshipImg: p5.Image;
      let explosionImg: p5.Image;
      let asteroidImg: p5.Image;
      let powerUpImg: p5.Image; // Add this line
      let retroFont: p5.Font;
      let points = 0;
      let gameOver = false;
      let shootCooldown = 0;
      let stars: { x: number; y: number; speed: number }[] = [];
      let lastSpeedIncreaseScore = 0;
      let touchStartX = 0;

      // New state variables for power-ups
      let powerUps: { x: number; y: number; type: string }[] = [];
      let activePowerUp: string | null = null;
      let powerUpDuration = 0;

      p.preload = () => {
        spaceshipRef.current = p.loadImage(selectedShip.src);
        enemySpaceshipImg = p.loadImage("/enemy.gif");
        explosionImg = p.loadImage("/explosion.png");
        asteroidImg = p.loadImage("asteroid.png");
        powerUpImg = p.loadImage("/powerup.png"); // Add this line
        retroFont = p.loadFont("/PressStart2P.ttf");
      };

      p.setup = () => {
        p.createCanvas(500, p.windowHeight);
        p.imageMode(p.CENTER);
        p.textFont(retroFont);
        createStars();
      };

      const createStars = () => {
        for (let i = 0; i < 100; i++) {
          stars.push({
            x: p.random(p.width),
            y: p.random(p.height),
            speed: p.random(1, 3),
          });
        }
      };

      // New function to create power-ups
      const createPowerUp = () => {
        if (p.random(1) < 0.05) { // 5% chance to spawn a power-up
          const laneIndex = p.floor(p.random(0, lanes.length));
          const powerUpType = p.random(['slow', 'multiplier', 'shield']);
          powerUps.push({
            x: lanes[laneIndex],
            y: 0,
            type: powerUpType,
          });
        }
      };

      const updateStars = () => {
        stars.forEach((star) => {
          star.y += star.speed * speedMultiplier;
          if (star.y > p.height) {
            star.y = 0;
            star.x = p.random(p.width);
          }
        });
      };

      const drawStars = () => {
        p.fill(255, 255, 255, 128); // Semi-transparent white
        p.noStroke();
        stars.forEach((star) => {
          const size = star.speed * 0.8; // Smaller stars
          p.ellipse(star.x, star.y, size, size);
        });
      };

      const checkAndUpdateGameSpeed = () => {
        const scoreThresholds = [100, 200, 500, 1000, 2500, 9000];
        const currentThreshold = scoreThresholds.find(
          (threshold) =>
            points >= threshold && threshold > lastSpeedIncreaseScore
        );

        if (currentThreshold) {
          speedMultiplier *= 1.5;
          lastSpeedIncreaseScore = currentThreshold;
          console.log(
            `Speed increased at score ${currentThreshold}. New multiplier: ${speedMultiplier}`
          );
        }
      };

      p.draw = () => {
        drawBackground();
        updateStars();
        drawStars();
        drawSpaceship();
        handleObstacles();
        // New power-up handling
        handlePowerUps();
        handleEnemySpaceships();
        handleBullets();
        handleExplosions();
        updateAndDrawHUD();

        // Gradually increase score over time
        points += 0.01 * speedMultiplier;

        // Check and update game speed based on score
        checkAndUpdateGameSpeed();
      };

      const drawBackground = () => {
        p.background(10, 10, 15); // Very dark blue-black color
      };

      const drawSpaceship = () => {
        if (spaceshipRef.current) {
          p.image(spaceshipRef.current, lanes[spaceshipLaneIndex], p.height - 50, 80, 100);
        }
      };

      const checkCollision = (
        obj1: { x: number; y: number },
        obj2: { x: number; y: number },
        distance: number
      ): boolean => {
        return p.dist(obj1.x, obj1.y, obj2.x, obj2.y) < distance;
      };

      const handleObstacles = () => {
        // Generate asteroids
        if (p.frameCount % 90 === 0) {
          const laneIndex = p.floor(p.random(0, lanes.length));
          const newAsteroid = {
            x: lanes[laneIndex],
            y: 0,
            type: "asteroid" as const,
          };

          // Check if the new asteroid overlaps with existing obstacles or enemy spaceships
          const isOverlapping = [...obstacles, ...enemySpaceships].some((obj) =>
            checkCollision(newAsteroid, obj, 80)
          );

          if (!isOverlapping) {
            obstacles.push(newAsteroid);
          }
        }

        // Move and draw obstacles
        obstacles.forEach((obstacle, index) => {
          if (obstacle.type === "asteroid") {
            p.image(asteroidImg, obstacle.x, obstacle.y, 30, 30);
          }
          obstacle.y += baseSpeed * speedMultiplier * 0.5;

          // Collision detection
          if (
            obstacle.y > p.height - 70 &&
            obstacle.y < p.height - 30 &&
            obstacle.x === lanes[spaceshipLaneIndex]
          ) {
            if (obstacle.type === "asteroid") {
              if (activePowerUp === 'shield') {
                createExplosion(obstacle.x, obstacle.y);
                obstacles.splice(index, 1);
                deactivatePowerUp();
              } else {
                createExplosion(obstacle.x, p.height - 50); // Create explosion at collision point
                gameOver = true;
                if (gameOverSound && isSoundOn) {
                  gameOverSound.play();
                }
                p.noLoop();
              }
            }
          }
        });

        // Remove obstacles that are out of view
        obstacles = obstacles.filter((obstacle) => obstacle.y < p.height);
      };

      // New function to handle power-ups
      const handlePowerUps = () => {
        // Generate power-ups
        if (p.frameCount % 300 === 0) {
          createPowerUp();
        }

        // Move and draw power-ups
        powerUps.forEach((powerUp, index) => {
          p.image(powerUpImg, powerUp.x, powerUp.y, 30, 30); // Updated line
          powerUp.y += baseSpeed * speedMultiplier * 0.5;

          // Collision detection with player
          if (
            powerUp.y > p.height - 70 &&
            powerUp.y < p.height - 30 &&
            powerUp.x === lanes[spaceshipLaneIndex]
          ) {
            activatePowerUp(powerUp.type);
            powerUps.splice(index, 1);
          }
        });

        // Remove power-ups that are out of view
        powerUps = powerUps.filter((powerUp) => powerUp.y < p.height);

        // Handle active power-up duration
        if (activePowerUp) {
          powerUpDuration--;
          if (powerUpDuration <= 0) {
            deactivatePowerUp();
          }
        }
      };

      const handleEnemySpaceships = () => {
        // Generate enemy spaceships
        if (p.frameCount % 120 === 0 && enemySpaceships.length === 0) {
          const availableLanes = [0, 1, 2].filter(
            (lane) => !enemySpaceships.some((enemy) => enemy.lane === lane)
          );

          if (availableLanes.length > 0) {
            const laneIndex =
              availableLanes[Math.floor(p.random(0, availableLanes.length))];
            const newEnemy = { x: lanes[laneIndex], y: 0, lane: laneIndex };

            // Check if the new enemy overlaps with existing obstacles
            const isOverlapping = obstacles.some((obj) =>
              checkCollision(newEnemy, obj, 80)
            );

            if (!isOverlapping) {
              enemySpaceships.push(newEnemy);
            }
          }
        }

        enemySpaceships.forEach((enemy, index) => {
          p.image(enemySpaceshipImg, enemy.x, enemy.y, 60, 60);
          enemy.y += baseSpeed * speedMultiplier * 0.5;

          // Enemy shooting
          if (p.frameCount % BASE_ENEMY_SHOOT_INTERVAL === 0) {
            bullets.push({ x: enemy.x, y: enemy.y + 20, isEnemy: true });
          }

          // Collision detection with player
          if (
            enemy.y > p.height - 70 &&
            enemy.y < p.height - 30 &&
            enemy.x === lanes[spaceshipLaneIndex]
          ) {
            createExplosion(enemy.x, enemy.y);
            enemySpaceships.splice(index, 1);
            gameOver = true;
            if (gameOverSound && isSoundOn) {
              gameOverSound.play();
            }
            p.noLoop();
          }
        });

        // Remove enemy spaceships that are out of view
        enemySpaceships = enemySpaceships.filter((enemy) => enemy.y < p.height);
      };

      const handleBullets = () => {
        bullets.forEach((bullet, index) => {
          p.fill(bullet.isEnemy ? 255 : 0, bullet.isEnemy ? 0 : 255, 0);
          p.rect(bullet.x - 2, bullet.y, 4, 10);
          const bulletSpeed = Math.min((bullet.isEnemy ? 5 : -10) * Math.sqrt(speedMultiplier), MAX_BULLET_SPEED);
          bullet.y += bulletSpeed;

          if (!bullet.isEnemy) {
            // Check for collision with enemy spaceships
            enemySpaceships.forEach((enemy, enemyIndex) => {
              if (p.dist(bullet.x, bullet.y, enemy.x, enemy.y) < 30) {
                createExplosion(enemy.x, enemy.y);
                enemySpaceships.splice(enemyIndex, 1);
                bullets.splice(index, 1);
                points += 20; // Increase score only when destroying an enemy spaceship
              }
            });

            // Check for collision with asteroids
            obstacles.forEach((obstacle) => {
              if (
                obstacle.type === "asteroid" &&
                p.dist(bullet.x, bullet.y, obstacle.x, obstacle.y) < 15
              ) {
                bullets.splice(index, 1);
              }
            });
          } else {
            // Check for collision with player
            if (
              bullet.y > p.height - 70 &&
              bullet.y < p.height - 30 &&
              bullet.x === lanes[spaceshipLaneIndex]
            ) {
              createExplosion(bullet.x, p.height - 50);
              bullets.splice(index, 1);
              gameOver = true;
              if (gameOverSound && isSoundOn) {
                gameOverSound.play();
              }
              p.noLoop();
            }
          }
        });

        // Remove bullets that are out of view
        bullets = bullets.filter(
          (bullet) => bullet.y > 0 && bullet.y < p.height
        );

        // Decrease shoot cooldown
        if (shootCooldown > 0) shootCooldown--;
      };

      const createExplosion = (x: number, y: number) => {
        explosions.push({
          x: x,
          y: y,
          frame: 0,
          size: 60,
        });
      };

      const handleExplosions = () => {
        explosions.forEach((explosion, index) => {
          const alpha = p.map(explosion.frame, 0, 30, 255, 0);
          p.tint(255, alpha);
          p.image(
            explosionImg,
            explosion.x,
            explosion.y,
            explosion.size,
            explosion.size
          );
          p.noTint();
          explosion.frame++;
          if (explosion.frame > 30) {
            explosions.splice(index, 1);
          }
        });
      };

      // New functions to activate and deactivate power-ups
      const activatePowerUp = (type: string) => {
        activePowerUp = type;
        powerUpDuration = 600; // 5 seconds (60 frames per second)
        switch (type) {
          case 'slow':
            speedMultiplier *= 0.5;
            break;
          case 'multiplier':
            // The score multiplier effect is handled in updateAndDrawHUD
            break;
          case 'shield':
            // The shield effect is handled in collision detection
            break;
        }
      };

      const deactivatePowerUp = () => {
        switch (activePowerUp) {
          case 'slow':
            speedMultiplier *= 2; // Revert the speed
            break;
          // No need to handle 'multiplier' and 'shield' here
        }
        activePowerUp = null;
      };

      const updateAndDrawHUD = () => {
        p.fill(255);
        p.textSize(24);
        p.textAlign(p.LEFT, p.TOP);
        const scoreMultiplier = activePowerUp === 'multiplier' ? 2 : 1;
        const score = Math.floor(points * scoreMultiplier).toString().padStart(10, '0');
        p.text(score, 10, 10);
        
        // Draw sound icon
        p.textAlign(p.RIGHT, p.TOP);
        p.noStroke();
        p.fill(255);
        const iconSize = 30;
        const iconX = p.width - iconSize - 10;
        const iconY = 10;
        
        if (isSoundOn) {
          // Draw sound on icon
          p.rect(iconX + 5, iconY + 10, 5, 10);
          p.rect(iconX + 15, iconY + 5, 5, 20);
          p.arc(iconX + 15, iconY + 15, 20, 20, -p.QUARTER_PI, p.QUARTER_PI);
        } else {
          // Draw sound off icon
          p.rect(iconX + 5, iconY + 10, 5, 10);
          p.rect(iconX + 15, iconY + 5, 5, 20);
          p.line(iconX + 25, iconY + 5, iconX + 5, iconY + 25);
        }
      };

      // Updated mousePressed function
      p.mousePressed = () => {
        const iconSize = 30;
        const iconX = p.width - iconSize - 10;
        const iconY = 10;
        if (
          p.mouseX > iconX &&
          p.mouseX < iconX + iconSize &&
          p.mouseY > iconY &&
          p.mouseY < iconY + iconSize
        ) {
          toggleSound();
        }
      };

      const changeLane = (direction: number) => {
        spaceshipLaneIndex = p.constrain(
          spaceshipLaneIndex + direction,
          0,
          lanes.length - 1
        );
      };

      const shoot = () => {
        if (shootCooldown === 0) {
          bullets.push({
            x: lanes[spaceshipLaneIndex],
            y: p.height - 70,
            isEnemy: false,
          });
          shootCooldown = 15; // Set cooldown to prevent rapid firing
          if (shootSound && isSoundOn) {
            shootSound.currentTime = 0; // Reset the audio to the beginning
            shootSound.play();
          }
        }
      };

      const resetGame = () => {
        spaceshipLaneIndex = 1;
        speedMultiplier = 1;
        obstacles = [];
        bullets = [];
        enemySpaceships = [];
        explosions = [];
        points = 0;
        gameOver = false;
        shootCooldown = 0;
        lastSpeedIncreaseScore = 0;
        // Reset power-ups
        powerUps = [];
        activePowerUp = null;
        powerUpDuration = 0;
        p.loop();
      };

      // Touch events for mobile swipe gestures
      p.touchStarted = (event: TouchEvent) => {
        if (event.touches && event.touches[0]) {
          touchStartX = event.touches[0].clientX;
        }
        return false;
      };

      p.touchEnded = (event: TouchEvent) => {
        if (event.changedTouches && event.changedTouches[0]) {
          const touchEndX = event.changedTouches[0].clientX;
          const swipeDistance = touchEndX - touchStartX;

          if (swipeDistance > 50) {
            changeLane(1); // Move spaceship to the right
          } else if (swipeDistance < -50) {
            changeLane(-1); // Move spaceship to the left
          } else {
            shoot(); // Tap to shoot
          }
        }
        return false;
      };

      // Cleanup the event listener on component unmount
      return () => {
        if (isClient) {
          window.removeEventListener("keydown", handleKeyPress);
        }
      };
    },
    [selectedShip, isSoundOn, toggleSound] // Added toggleSound to dependencies
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/background-track.mp3');
      audio.loop = true;
      setBackgroundMusic(audio);
    }
  }, []);

  useEffect(() => {
    if (backgroundMusic) {
      if (isSoundOn) {
        backgroundMusic.play();
      } else {
        backgroundMusic.pause();
      }
    }
  }, [isSoundOn, backgroundMusic]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShootSound(new Audio('/shoot.mp3'));
      setGameOverSound(new Audio('/game-over.mp3'));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p5Instance = new p5(sketch, gameRef.current!);

      return () => {
        p5Instance.remove(); // Cleanup on unmount
      };
    }
  }, [sketch]);

  return (
    <div
      ref={gameRef}
      className="w-full h-screen flex items-center justify-center relative"
    >
      <button
        className="absolute top-4 right-4 z-10"
        onClick={toggleSound}
        aria-label={isSoundOn ? "Mute sound" : "Unmute sound"}
      >
        {isSoundOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </div>
  );
};

export default Game;

