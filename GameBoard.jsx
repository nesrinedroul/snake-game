import React from 'react';
import '../styles/GameBoard.css';

const GameBoard = ({ snake, food, obstacles, gridSize }) => {
  const rows = Array.from({ length: gridSize }, (_, rowIndex) => {
    return (
      <div key={rowIndex} className="row">
        {Array.from({ length: gridSize }, (_, colIndex) => {
          const isSnake = snake.some(segment => segment.x === colIndex && segment.y === rowIndex);
          const isFood = food.x === colIndex && food.y === rowIndex;
          const isObstacle = obstacles.some(obs => obs.x === colIndex && obs.y === rowIndex);

          let className = 'cell';
          if (isSnake) className += ' snake';
          else if (isFood) className += ' food';
          else if (isObstacle) className += ' obstacle';

          return <div key={colIndex} className={className}></div>;
        })}
      </div>
    );
  });

  return <div className="game-board">{rows}</div>;
};

export default GameBoard;
