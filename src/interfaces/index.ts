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

enum playStateTypes {
  'running' = 'running',
  'drawOffer' = 'drawOffer',
  'promotionMenu' = 'promotionMenu',
  'pause' = 'pause',
  'draw' = 'draw',
  'winner' = 'winner',
}

enum winTypes {
  'checkmate' = 'checkmate',
  'zeitNot' = 'zeitNot',
  'resignation' = 'resignation',
}

enum drawTypes {
  'stalemate' = 'stalemate',
  'agreement' = 'agreement',
  'repetition' = 'repetition',
  'fiftyMove' = 'fiftyMove',
  'insufficientMaterial' = 'insufficientMaterial',
}

type playState =
  | {
      type: playStateTypes.draw | playStateTypes.winner;
      subType: drawTypes | winTypes;
    }
  | {
      type: playStateTypes.drawOffer;
      initializedBy: colors;
    }
  | {
      type:
        | playStateTypes.running
        | playStateTypes.pause
        | playStateTypes.promotionMenu;
    };

enum pieceNotation {
  'k' = 'k',
  'q' = 'q',
  'b' = 'b',
  'n' = 'n',
  'r' = 'r',
  'p' = 'p',
}

export {
  colors,
  pieceTypes,
  Board,
  coordinates,
  Directions,
  MovementTypes,
  AvailiableMovementDirections,
  winTypes,
  drawTypes,
  playState,
  playStateTypes,
  pieceNotation,
};
