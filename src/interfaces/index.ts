import { CountdownTimer } from '../classes';

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

type DirectionWithSteps =
  | {
      direction: Directions;
      movementType: MovementTypes.steps;
      steps: number;
      onlyAttack?: boolean;
      noAttack?: boolean;
    }
  | {
      direction: Directions;
      movementType: MovementTypes.mulitpleSquares | MovementTypes.singleSquare;
      onlyAttack?: boolean;
      noAttack?: boolean;
    };

type AvailiableMovementDirections =
  | {
      directions: Directions[];
      movementType: MovementTypes.steps;
      stepCount: number;
    }
  | {
      directions: Directions[];
      movementType: MovementTypes.mulitpleSquares | MovementTypes.singleSquare;
    };

type coordinates = {
  row: number;
  col: number;
};

enum colors {
  'black' = 'black',
  'white' = 'white',
}

interface Piece {
  id: string;
  type: pieceTypes;
  color: colors;
  isMoved: boolean;

  isTaken: boolean;

  imgUrl: string;

  getAvailiableMovementDirections(
    type?: pieceTypes,
    isAttack?: boolean
  ): AvailiableMovementDirections;

  getLegalMoves(
    rowIndex: number,
    colIndex: number,
    gameState: Board,
    isAttack?: boolean,
    type?: pieceTypes
  ): coordinates[];
}

interface PieceWithCoordinates {
  piece: Piece | null;
  coordinates: coordinates;
}

type BoardSquare = {
  color: colors;
  piece: Piece | null;
};

type Board = BoardSquare[][];

interface Player {
  id: string;
  color: colors;

  isMated: boolean;
  isInCheck: boolean;
  game: Game;

  kingRowIndex: number;
  kingColIndex: number;

  attackers: {
    coordinate: coordinates;
    type: pieceTypes;
  }[];

  getLegalMoves(
    rowIndex: number,
    colIndex: number,
    type: pieceTypes
  ): coordinates[];

  move(
    prevRowIndex: number,
    prevColIndex: number,
    rowIndex: number,
    colIndex: number
  ): void;

  updateGame(game: Game): void;

  selectPiece(rowIndex: number, colIndex: number): coordinates[];

  getKingAttackers(): {
    coordinate: coordinates;
    type: pieceTypes;
  }[];
}

interface Game {
  turn: colors;
  running: boolean;
  winnerId: string | null;
  isDraw: boolean;
  timerWhite: CountdownTimer;
  timerBlack: CountdownTimer;
  blackPlayer: Player | null;
  whitePlayer: Player | null;
  moveCount: number;
  state: Board;

  previousGameStates: Board[];

  updateGameState(
    prevRowIndex: number,
    prevColIndex: number,
    newRowIndex: number,
    newColIndex: number
  ): void;

  notifyStateChange(): void;

  addPlayers(whitePlayer: Player, blackPlayer: Player): void;

  startGame(): void;

  stopGame(): void;
}

export {
  Piece,
  Game,
  Player,
  colors,
  pieceTypes,
  Board,
  BoardSquare,
  coordinates,
  PieceWithCoordinates,
  Directions,
  DirectionWithSteps,
  MovementTypes,
  AvailiableMovementDirections,
};
