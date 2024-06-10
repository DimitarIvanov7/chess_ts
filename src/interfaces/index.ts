import { BoardSquare, CountdownTimer, Game, Piece } from '../classes';

enum pieceTypes {
  'pawn' = 'pawn',
  'knight' = 'knight',
  'bishop' = 'bishop',
  'rook' = 'rook',
  'queen' = 'queen',
  'king' = 'king',
}

enum Directions {
  'up' = 'up',
  'down' = 'down',
  'left' = 'left',
  'right' = 'right',
  'upLeft' = 'upLeft',
  'downLeft' = 'downLeft',
  'upRight' = 'upRight',
  'downRight' = 'downRight',
}

enum MovementTypes {
  'steps' = 'steps',
  'mulitpleSquares' = 'mulitpleSquares',
  'singleSquare' = 'singleSquare',
}

type AvailiableMovementDirections = {
  directions: Directions[];
  movementType: MovementTypes;
};

type coordinates = {
  row: number;
  col: number;
};

enum colors {
  'black' = 'black',
  'white' = 'white',
}

type Board = BoardSquare[][];

export {
  colors,
  pieceTypes,
  Board,
  coordinates,
  Directions,
  MovementTypes,
  AvailiableMovementDirections,
};
