"use client"; // Ensure this component is treated as a client component

import React, { useRef, useEffect, useCallback } from "react";
import p5 from "p5";

interface GameProps {
  selectedShip: { src: string; alt: string };
}

const Game: React.FC<GameProps> = ({ selectedShip }) => {
  const gameRef = useRef<HTMLDivElement>(null);

  const sketch = useCallback(
    (p: p5) => {
      let spaceshipLaneIndex = 1; // Start in the center lane
      const lanes = [100, 200, 300]; // X positions for 3 lanes
      const baseSpeed = 2; // Initial speed of obstacles and enemies
      let speedMultiplier = 1; // Speed multiplier for increasing difficulty
      let obstacles: { x: number; y: number; type: string }[] = [];
      let bullets: { x: number; y: number; isEnemy: boolean }[] = [];
      let enemySpaceships: { x: number; y: number; lane: number }[] = [];
      let explosions: { x: number; y: number; frame: number }[] = [];
      let spaceship: p5.Image;
      let enemySpaceshipImg: p5.Image;
      let powerupSlowImg: p5.Image;
      let explosionImg: p5.Image;
      let asteroidImg: p5.Image;
      let retroFont: p5.Font;
      let points = 0;
      let gameOver = false;
      let level = 1;
      let shootCooldown = 0;
      let powerupActive = false;
      let powerupTimer = 0;
      let lastPowerupTime = 0;
      let stars: { x: number; y: number; speed: number }[] = [];
      let lastSpeedIncreaseScore = 0;
      let touchStartX = 0;

      // p.preload = () => {
      //   console.log("Preloading images...");
      //   spaceship = p.loadImage(selectedShip.src); // Load selected ship image
      //   console.log("Loaded spaceship:", selectedShip.src);
      //   // Load other images...
      // };

      p.preload = () => {
        spaceship = p.loadImage(selectedShip.src); // Load selected ship image
        enemySpaceshipImg = p.loadImage("/enemy-spaceship.png");
        powerupSlowImg = p.loadImage("/powerup.png");
        explosionImg = p.loadImage("/explosion.png");
        asteroidImg = p.loadImage("/asteroid.png");
        retroFont = p.loadFont("/PressStart2P.ttf");
      };

      p.setup = () => {
        p.createCanvas(400, 600);
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
        p.fill(255);
        p.noStroke();
        stars.forEach((star) => {
          p.ellipse(star.x, star.y, 2, 2);
        });
      };

      const checkAndUpdateGameSpeed = () => {
        const scoreThresholds = [500, 1000, 2000, 2500, 3000, 4000];
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
        if (gameOver) {
          drawGameOver();
          return;
        }

        drawBackground();
        updateStars();
        drawStars();
        drawLanes();
        drawSpaceship();
        handleObstacles();
        handleEnemySpaceships();
        handleBullets();
        handleExplosions();
        handlePowerup();
        updateAndDrawHUD();

        // Increase difficulty over time
        if (p.frameCount % 600 === 0) {
          level++;
          speedMultiplier += 0.1;
        }

        // Gradually increase score over time
        points += 0.01 * speedMultiplier;

        // Check and update game speed based on score
        checkAndUpdateGameSpeed();
      };

      const drawBackground = () => {
        p.background(0);
      };

      const drawLanes = () => {
        p.stroke(100);
        p.strokeWeight(2);
        lanes.forEach((x) => p.line(x, 0, x, p.height));
      };

      const drawSpaceship = () => {
        p.image(spaceship, lanes[spaceshipLaneIndex], p.height - 50, 40, 40);
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

        // Generate powerups every 2 minutes
        if (p.frameCount - lastPowerupTime >= 7200) {
          // 7200 frames = 2 minutes at 60 fps
          const laneIndex = p.floor(p.random(0, lanes.length));
          obstacles.push({ x: lanes[laneIndex], y: 0, type: "powerup-slow" });
          lastPowerupTime = p.frameCount;
        }

        // Move and draw obstacles
        obstacles.forEach((obstacle, index) => {
          if (obstacle.type === "powerup-slow") {
            p.image(powerupSlowImg, obstacle.x, obstacle.y, 30, 30);
          } else if (obstacle.type === "asteroid") {
            p.image(asteroidImg, obstacle.x, obstacle.y, 30, 30);
          }
          obstacle.y += baseSpeed * speedMultiplier * 0.5;

          // Collision detection
          if (
            obstacle.y > p.height - 70 &&
            obstacle.y < p.height - 30 &&
            obstacle.x === lanes[spaceshipLaneIndex]
          ) {
            if (obstacle.type === "powerup-slow") {
              activatePowerup(obstacle.type);
              obstacles.splice(index, 1);
            } else if (obstacle.type === "asteroid") {
              gameOver = true;
              p.noLoop();
            }
          }
        });

        // Remove obstacles that are out of view
        obstacles = obstacles.filter((obstacle) => obstacle.y < p.height);
      };

      const handleEnemySpaceships = () => {
        // Generate enemy spaceships
        if (p.frameCount % 120 === 0) {
          const laneIndex = p.floor(p.random(0, lanes.length));
          const newEnemy = { x: lanes[laneIndex], y: 0, lane: laneIndex };

          // Check if the new enemy overlaps with existing obstacles or enemy spaceships
          const isOverlapping = [...obstacles, ...enemySpaceships].some((obj) =>
            checkCollision(newEnemy, obj, 80)
          );

          if (!isOverlapping) {
            enemySpaceships.push(newEnemy);
          }
        }

        enemySpaceships.forEach((enemy, index) => {
          p.image(enemySpaceshipImg, enemy.x, enemy.y, 40, 40);
          enemy.y += baseSpeed * speedMultiplier * 0.5;

          // Enemy shooting
          if (p.frameCount % 60 === 0 && p.random() > 0.7) {
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
          bullet.y += bullet.isEnemy ? 5 : -10;

          if (!bullet.isEnemy) {
            // Check for collision with enemy spaceships
            enemySpaceships.forEach((enemy, enemyIndex) => {
              if (p.dist(bullet.x, bullet.y, enemy.x, enemy.y) < 20) {
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
        explosions.push({ x, y, frame: 0 });
      };

      const handleExplosions = () => {
        explosions.forEach((explosion, index) => {
          p.image(explosionImg, explosion.x, explosion.y, 60, 60);
          explosion.frame++;
          if (explosion.frame > 30) {
            explosions.splice(index, 1);
          }
        });
      };

      const handlePowerup = () => {
        if (powerupActive) {
          powerupTimer--;
          if (powerupTimer <= 0) {
            powerupActive = false;
            speedMultiplier = 1;
          }
        }
      };

      const activatePowerup = (type: string) => {
        powerupActive = true;
        powerupTimer = 300; // 5 seconds at 60 fps
        if (type === "powerup-slow") {
          speedMultiplier = 0.5; // Slow down obstacles and enemies
        }
      };

      const updateAndDrawHUD = () => {
        p.fill(255);
        p.textSize(16);
        p.text(`SCORE: ${Math.floor(points)}`, 10, 20);
        p.text(`LEVEL: ${level}`, 10, 40);

        if (powerupActive) {
          p.fill(0, 255, 0);
          p.text("SLOW-DOWN ACTIVE!", p.width / 2 - 80, 20);
        }
      };

      const drawGameOver = () => {
        p.background(0);
        drawStars();
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(32);
        p.text("GAME OVER", p.width / 2, p.height / 2 - 40);
        p.textSize(16);
        p.text(`FINAL SCORE: ${Math.floor(points)}`, p.width / 2, p.height / 2);
        p.text(`LEVEL REACHED: ${level}`, p.width / 2, p.height / 2 + 30);
        p.text("PRESS SPACE TO RESTART", p.width / 2, p.height / 2 + 60);
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
          // Remove this line: points += 5 // Add extra points for shooting
        }
      };

      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === "ArrowLeft") changeLane(-1);
        if (event.key === "ArrowRight") changeLane(1);
        if (event.key === " ") {
          if (gameOver) {
            // Restart game
            resetGame();
          } else {
            shoot();
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
        level = 1;
        shootCooldown = 0;
        powerupActive = false;
        powerupTimer = 0;
        lastPowerupTime = 0;
        lastSpeedIncreaseScore = 0;
        p.loop();
      };

      p.touchStarted = (event: TouchEvent) => {};

      p.touchEnded = (event: TouchEvent) => {};

      // Attach event listener for keyboard controls
      window.addEventListener("keydown", handleKeyPress);

      // Cleanup the event listener on component unmount
      return () => {
        window.removeEventListener("keydown", handleKeyPress);
      };
    },
    [selectedShip]
  ); // Dependency on selectedShip

  useEffect(() => {
    const p5Instance = new p5(sketch, gameRef.current!);

    return () => {
      p5Instance.remove(); // Cleanup on unmount
    };
  }, [sketch]);

  return (
    <div
      ref={gameRef}
      className="w-full h-screen flex items-center justify-center"
    ></div>
  );
};

export default Game;
