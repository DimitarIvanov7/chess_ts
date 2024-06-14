import { Directions, coordinates, pieceTypes } from '../interfaces';

const oppositeDirections: {
  [key in Directions]: Directions;
} = {
  [Directions.down]: Directions.up,
  [Directions.up]: Directions.down,
  [Directions.left]: Directions.right,
  [Directions.right]: Directions.left,
  [Directions.upRight]: Directions.downLeft,
  [Directions.upLeft]: Directions.downRight,
  [Directions.downRight]: Directions.upLeft,
  [Directions.downLeft]: Directions.upRight,
};

const directionToSearchFunctionMapping: {
  [key in Directions]: (coordinates: coordinates) => coordinates;
} = {
  [Directions.down]: (coordinates) => ({
    ...coordinates,
    row: coordinates.row - 1,
  }),
  [Directions.downRight]: (coordinates) => ({
    col: coordinates.col + 1,
    row: coordinates.row + 1,
  }),

  [Directions.downLeft]: (coordinates) => ({
    col: coordinates.col - 1,
    row: coordinates.row + 1,
  }),

  [Directions.left]: (coordinates) => ({
    ...coordinates,
    col: coordinates.col - 1,
  }),

  [Directions.right]: (coordinates) => ({
    ...coordinates,
    col: coordinates.col + 1,
  }),

  [Directions.up]: (coordinates) => ({
    ...coordinates,
    row: coordinates.row + 1,
  }),
  [Directions.upLeft]: (coordinates) => ({
    col: coordinates.col - 1,
    row: coordinates.row - 1,
  }),

  [Directions.upRight]: (coordinates) => ({
    col: coordinates.col + 1,
    row: coordinates.row - 1,
  }),
};

const columnIndexTopieceTypesToMapping: { [key: number]: pieceTypes } = {
  0: pieceTypes.rook,
  1: pieceTypes.knight,
  2: pieceTypes.bishop,
  3: pieceTypes.queen,
  4: pieceTypes.king,
  5: pieceTypes.bishop,
  6: pieceTypes.knight,
  7: pieceTypes.rook,
};

const directionToKnightPositionMapping: { [key in Directions]: Directions[] } =
  {
    [Directions.down]: [Directions.down, Directions.left, Directions.left],

    [Directions.up]: [Directions.up, Directions.left, Directions.left],

    [Directions.left]: [Directions.left, Directions.down, Directions.down],

    [Directions.right]: [Directions.right, Directions.down, Directions.down],

    [Directions.downRight]: [
      Directions.down,
      Directions.right,
      Directions.right,
    ],

    [Directions.downLeft]: [Directions.left, Directions.up, Directions.up],

    [Directions.upRight]: [Directions.up, Directions.right, Directions.right],

    [Directions.upLeft]: [Directions.right, Directions.up, Directions.up],
  };

export {
  directionToKnightPositionMapping,
  columnIndexTopieceTypesToMapping,
  directionToSearchFunctionMapping,
  oppositeDirections,
};
