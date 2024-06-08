import React, { useState } from 'react';
import { GameImpl, PlayerImlp } from '../classes';
import { colors, coordinates } from '../interfaces';

const colIndexToLetterMapping: { [key: number]: string } = {
  7: 'h',
  6: 'g',
  5: 'f',
  4: 'e',
  3: 'd',
  2: 'c',
  1: 'b',
  0: 'a',
};

const newGame = new GameImpl();

const players: { [key in colors]: PlayerImlp } = {
  [colors.white]: new PlayerImlp(newGame, colors.white),
  [colors.black]: new PlayerImlp(newGame, colors.black),
};

newGame.addPlayers(players.white, players.black);

const Board = () => {
  const [turnColor, setTurnColor] = useState<colors>(newGame.turn);

  const [gameState, setGameState] = useState(newGame.state);

  const [legalMoves, setLegalMoves] = useState<coordinates[]>([]);

  const [selectedPieceCoordinates, setselectedPieceCoordinates] =
    useState<coordinates | null>(null);

  const handleSelectPiece = (rowIndex: number, colIndex: number) => {
    const clickedPiece = gameState[rowIndex][colIndex];

    if (clickedPiece?.piece?.color !== turnColor) return;

    const player = players[turnColor];

    const legalMoves = player.selectPiece(rowIndex, colIndex);

    setselectedPieceCoordinates({ row: rowIndex, col: colIndex });

    setLegalMoves(legalMoves);
  };

  const handleMovePiece = (rowIndex: number, colIndex: number) => {
    if (!selectedPieceCoordinates) return;
    if (
      !legalMoves.find(({ col, row }) => rowIndex === row && col === colIndex)
    ) {
      return;
    }

    const player = players[turnColor];

    player.move(
      selectedPieceCoordinates.row,
      selectedPieceCoordinates.col,
      rowIndex,
      colIndex
    );

    const newState = newGame.state;

    setGameState(newState);
    setTurnColor((prevColor) =>
      prevColor === colors.white ? colors.black : colors.white
    );
    setLegalMoves([]);
    setselectedPieceCoordinates(null);
  };

  const handleSquareClick = (rowIndex: number, colIndex: number) => {
    const clickedPiece = gameState[rowIndex][colIndex].piece;

    if (!clickedPiece) {
      if (selectedPieceCoordinates) handleMovePiece(rowIndex, colIndex);
      return;
    }

    if (selectedPieceCoordinates) {
      if (clickedPiece.color === turnColor) {
        handleSelectPiece(rowIndex, colIndex);
      } else {
        handleMovePiece(rowIndex, colIndex);
      }
    } else handleSelectPiece(rowIndex, colIndex);
  };

  return (
    <div
      className={`my-auto flex  
      ${turnColor === colors.black ? 'flex-col' : 'flex-col'}
        
        `}
    >
      {gameState.map((squareRow, rowIndex) => (
        <div className="flex " key={rowIndex}>
          {squareRow.map((square, colIndex) => {
            const isInLegalMoves = legalMoves.some(
              (coords) => coords.col === colIndex && coords.row === rowIndex
            );
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`h-20 w-20 flex relative ${
                  square.color === colors.white ? 'bg-white' : 'bg-green-700'
                } ${isInLegalMoves ? 'bg-opacity-30 cursor-pointer' : ''}`}
                onClick={() => {
                  handleSquareClick(rowIndex, colIndex);
                }}
              >
                {colIndex === 0 && (
                  <p
                    className={`absolute left-2 top-0 ${
                      square.color === colors.white
                        ? 'text-green-700'
                        : 'text-white'
                    }`}
                  >
                    {rowIndex + 1}
                  </p>
                )}

                {rowIndex === 0 && (
                  <p
                    className={`absolute right-2 bottom-0 ${
                      square.color === colors.white
                        ? 'text-green-700'
                        : 'text-white'
                    }`}
                  >
                    {colIndexToLetterMapping[colIndex]}
                  </p>
                )}
                {square.piece && (
                  <img className="cursor-pointer" src={square.piece.imgUrl} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Board;
