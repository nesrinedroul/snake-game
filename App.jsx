import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './components/GameBoard';
import useGameLoop from './hooks/useGameLoop';
import './App.css'; // We'll create this CSS file

const App = () => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [lastLevelUpScore, setLastLevelUpScore] = useState(0); // Track when we last leveled up

  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5, type: 'normal' });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [obstacles, setObstacles] = useState([]);
  const [specialFood, setSpecialFood] = useState(null);

  // Generate food that doesn't overlap with snake or obstacles
  const generateFood = useCallback((currentSnake = snake, currentObstacles = obstacles) => {
    let newFood;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
        type: 'normal'
      };
      attempts++;
    } while (
      attempts < 100 && (
        currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
        currentObstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y)
      )
    );
    return newFood;
  }, [gridSize]);

  // Generate special food occasionally
  const generateSpecialFood = useCallback(() => {
    if (Math.random() > 0.3 || specialFood || gameOver || !gameStarted) return;
    
    let newFood;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
        type: 'special'
      };
      attempts++;
    } while (
      attempts < 100 && (
        snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
        obstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y) ||
        (food.x === newFood.x && food.y === newFood.y)
      )
    );
    
    setSpecialFood(newFood);
    setTimeout(() => setSpecialFood(null), 5000); // Disappears after 5 seconds
  }, [gridSize, snake, obstacles, food, specialFood, gameOver, gameStarted]);

  // Generate obstacles based on level
  const generateObstacles = useCallback((currentLevel, currentGridSize, currentSnake, currentFood) => {
    if (currentLevel <= 1) return [];
    
    const obstacleCount = Math.min((currentLevel - 1) * 2, Math.floor(currentGridSize * currentGridSize * 0.1));
    const newObstacles = [];
    
    for (let i = 0; i < obstacleCount; i++) {
      let obstacle;
      let attempts = 0;
      do {
        obstacle = {
          x: Math.floor(Math.random() * currentGridSize),
          y: Math.floor(Math.random() * currentGridSize),
        };
        attempts++;
      } while (
        attempts < 100 && (
          currentSnake.some(seg => seg.x === obstacle.x && seg.y === obstacle.y) ||
          (currentFood && currentFood.x === obstacle.x && currentFood.y === obstacle.y) ||
          newObstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y)
        )
      );
      
      if (attempts < 100) {
        newObstacles.push(obstacle);
      }
    }
    
    return newObstacles;
  }, []);

  // Main game movement logic
  const moveSnake = useCallback(() => {
    if (!gameStarted || gameOver || isPaused) return;

    setSnake(currentSnake => {
      const head = { 
        x: currentSnake[0].x + direction.x, 
        y: currentSnake[0].y + direction.y 
      };

      // Check collisions
      if (
        head.x < 0 || head.y < 0 ||
        head.x >= gridSize || head.y >= gridSize ||
        obstacles.some(obs => obs.x === head.x && obs.y === head.y) ||
        currentSnake.some((segment, index) => index > 0 && segment.x === head.x && segment.y === head.y)
      ) {
        setGameOver(true);
        setHighScore(prev => Math.max(prev, score));
        return currentSnake;
      }

      const newSnake = [head, ...currentSnake];
      let foodEaten = false;
      let specialFoodEaten = false;
      let pointsGained = 0;

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        foodEaten = true;
        pointsGained += 1;
        const newFood = generateFood(newSnake, obstacles);
        setFood(newFood);
      } 

      // Check special food collision
      if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
        specialFoodEaten = true;
        pointsGained += 10;
        setSpecialFood(null);
      }

      // Update score and check for level up
      if (pointsGained > 0) {
        setScore(prevScore => {
          const newScore = prevScore + pointsGained;
          
          // Check if we should level up (every 10 points, but only once per threshold)
          const currentLevelThreshold = Math.floor(prevScore / 10);
          const newLevelThreshold = Math.floor(newScore / 10);
          
          if (newLevelThreshold > currentLevelThreshold) {
            const newLevel = newLevelThreshold + 1;
            const newGridSize = Math.min(20 + (newLevel - 1) * 2, 40); // Cap at 40x40
            
            setLevel(newLevel);
            setGridSize(newGridSize);
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 2000);
            
            // Generate new obstacles for the new level
            const newObstacles = generateObstacles(newLevel, newGridSize, newSnake, food);
            setObstacles(newObstacles);
            
            setLastLevelUpScore(newScore);
          }
          
          return newScore;
        });
      }

      // Return snake (grow if food eaten, otherwise maintain size)
      if (!foodEaten && !specialFoodEaten) {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameStarted, gameOver, isPaused, direction, gridSize, obstacles, score, food, specialFood, generateFood, generateObstacles]);

  // Initialize game
  const startGame = () => {
    const initialSnake = [{ x: 10, y: 10 }];
    const initialFood = generateFood(initialSnake, []);
    setFood(initialFood);
    setObstacles([]);
    setGameStarted(true);
  };

  // Restart game
  const restartGame = () => {
    const initialSnake = [{ x: 10, y: 10 }];
    setScore(0);
    setLevel(1);
    setGridSize(20);
    setSnake(initialSnake);
    setDirection({ x: 1, y: 0 });
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
    setLastLevelUpScore(0);
    
    const initialFood = generateFood(initialSnake, []);
    setFood(initialFood);
    setObstacles([]);
    setSpecialFood(null);
  };

  // Game loops
  useGameLoop(moveSnake, gameOver || isPaused || !gameStarted ? null : Math.max(50, 200 - (level * 10)));
  useGameLoop(generateSpecialFood, gameOver || isPaused || !gameStarted ? null : 8000);

  // Keyboard and touch controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        startGame();
        return;
      }

      switch (e.key) {
        case 'ArrowUp': if (direction.y !== 1) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y !== -1) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x !== 1) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x !== -1) setDirection({ x: 1, y: 0 }); break;
        case ' ': 
          e.preventDefault();
          setIsPaused(prev => !prev); 
          break;
        default: break;
      }
    };

    const touchStart = { x: 0, y: 0 };

    const handleTouchStart = (e) => {
      if (!gameStarted) {
        startGame();
        return;
      }

      const touch = e.touches[0];
      touchStart.x = touch.clientX;
      touchStart.y = touch.clientY;
    };

    const handleTouchEnd = (e) => {
      if (!gameStarted) return;
      
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;

      const minSwipeDistance = 30;
      if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction.x !== -1) setDirection({ x: 1, y: 0 });
        else if (dx < 0 && direction.x !== 1) setDirection({ x: -1, y: 0 });
      } else {
        if (dy > 0 && direction.y !== -1) setDirection({ x: 0, y: 1 });
        else if (dy < 0 && direction.y !== 1) setDirection({ x: 0, y: -1 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [direction, gameStarted]);

  return (
    <div className="app-container">
      <div className="game-header">
        <h1 className="game-title">Neon Snake 🐍</h1>
        
        <div className="game-stats">
          <div className="stat-box">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
          
          <div className="stat-box">
            <span className="stat-label">High Score</span>
            <span className="stat-value">{highScore}</span>
          </div>
          
          <div className="stat-box">
            <span className="stat-label">Level</span>
            <span className="stat-value">{level}</span>
          </div>
        </div>
      </div>

      {!gameStarted ? (
        <div className="start-screen">
          <h2>Neon Snake</h2>
          <p>Use arrow keys or swipe to move</p>
          <button className="start-button" onClick={startGame}>
            Start Game
          </button>
          <div className="controls-info">
            <p>Space: Pause</p>
            <p>Eat special food for bonus points!</p>
          </div>
        </div>
      ) : (
        <>
          <div className="game-controls">
            <button 
              className={`control-button ${isPaused ? 'resume' : 'pause'}`}
              onClick={() => setIsPaused(prev => !prev)}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          </div>

          {showLevelUp && (
            <div className="level-up-animation">
              <span>LEVEL UP!</span>
              <span>Level {level}</span>
            </div>
          )}

          {gameOver && (
            <div className="game-over-modal">
              <h2>Game Over!</h2>
              <p>Final Score: {score}</p>
              <p>Level Reached: {level}</p>
              <button className="restart-button" onClick={restartGame}>
                Play Again
              </button>
            </div>
          )}

          <GameBoard 
            snake={snake} 
            food={food} 
            specialFood={specialFood}
            obstacles={obstacles} 
            gridSize={gridSize}
            gameOver={gameOver}
            isPaused={isPaused}
          />
        </>
      )}
    </div>
  );
};

export default App;