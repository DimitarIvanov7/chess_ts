import { BoardSquareImpl, PieceImpl } from './classes';
import {
  AvailiableMovementDirections,
  Board,
  BoardSquare,
  Directions,
  MovementTypes,
  Piece,
  PieceWithCoordinates,
  colors,
  coordinates,
  pieceTypes,
} from './interfaces';

const opositeDirections: {
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
    row: coordinates.row - 1,
  }),

  [Directions.downLeft]: (coordinates) => ({
    col: coordinates.col - 1,
    row: coordinates.row - 1,
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
    row: coordinates.row + 1,
  }),

  [Directions.upRight]: (coordinates) => ({
    col: coordinates.col + 1,
    row: coordinates.row + 1,
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

const pieceToImageUrlMapping: { [key in pieceTypes]: string } = {
  [pieceTypes.king]: 'k',
  [pieceTypes.queen]: 'q',
  [pieceTypes.bishop]: 'b',
  [pieceTypes.knight]: 'n',
  [pieceTypes.rook]: 'r',
  [pieceTypes.pawn]: 'p',
};

const colorToImageUrlMapping: { [key in colors]: string } = {
  [colors.white]: 'l',
  [colors.black]: 'd',
};

const createPieceImageUrl = (piece: pieceTypes, color: colors) => {
  return (
    '/images/' +
    pieceToImageUrlMapping[piece] +
    colorToImageUrlMapping[color] +
    't60.png'
  );
};

const isEven = (index: number) => index % 2 === 0;

const createInitialBoard = () => {
  const board: Board = [];

  for (let i = 0; i < 8; i++) {
    const row: BoardSquare[] = [];

    for (let k = 0; k < 8; k++) {
      const currentPiece = createPiece(i, k);

      const squareColor = isEven(i)
        ? isEven(k)
          ? colors.black
          : colors.white
        : isEven(k)
        ? colors.white
        : colors.black;

      const currentSquare: BoardSquare = new BoardSquareImpl(
        squareColor,
        currentPiece?.type !== pieceTypes.pawn ? currentPiece : null
      );

      //TODO: remove that, it is for dev testing

      row.push(currentSquare);
    }

    board.push(row);
  }

  return board;
};

const createPiece = (rowIndex: number, colIndex: number) => {
  let currentPiece: PieceImpl | null = null;

  let pieceColor =
    rowIndex < 2 ? colors.white : rowIndex > 5 ? colors.black : null;

  if (rowIndex === 1 || rowIndex === 6) {
    currentPiece = new PieceImpl(pieceColor!, pieceTypes.pawn);
  }

  if (rowIndex === 0 || rowIndex === 7) {
    currentPiece = new PieceImpl(
      pieceColor!,
      columnIndexTopieceTypesToMapping[colIndex]
    );
  }

  return currentPiece;
};

const getSquareByCoordinates = (
  gameState: Board,
  coordinates: coordinates
): BoardSquare | null => {
  const { row, col } = coordinates;

  if (!areCoordinatesInBounds(coordinates)) return null;

  return gameState[row][col];
};

const getPieceByCoordinates = (
  gameState: Board,
  coordinates: coordinates
): Piece | null => {
  const square = getSquareByCoordinates(gameState, coordinates);
  return square ? square.piece : null;
};

const areCoordinatesInBounds = ({ row, col }: coordinates) =>
  row >= 0 && row < 8 && col >= 0 && col < 8;

const searchForPiece = (
  gameState: Board,
  row: number,
  col: number,
  direction: Directions
): coordinates => {
  let currentPiece: Piece | null = null;

  let coordinates = directionToSearchFunctionMapping[direction]({
    row,
    col,
  });

  while (!currentPiece && areCoordinatesInBounds(coordinates)) {
    currentPiece = getPieceByCoordinates(gameState, coordinates);

    if (!currentPiece)
      coordinates = directionToSearchFunctionMapping[direction](coordinates);
  }

  return coordinates;
};

const getCoordinatesPathArray = (
  startCoordinates: coordinates,
  direction: Directions,
  endCoordinates: coordinates
): coordinates[] => {
  const result: coordinates[] = [];

  let { col, row } = startCoordinates;

  while (!(col === endCoordinates.col && row === endCoordinates.row)) {
    const newCoordinates = directionToSearchFunctionMapping[direction]({
      col,
      row,
    });

    col = newCoordinates.col;
    row = newCoordinates.row;

    if (!areCoordinatesInBounds(newCoordinates)) break;

    result.push(newCoordinates);
  }

  return result;
};

const getPreviousCoordinates = (
  coordinates: coordinates,
  direction: Directions
): coordinates =>
  directionToSearchFunctionMapping[opositeDirections[direction]](coordinates);

const getVisiblePiecesCoordinates = (
  gameState: Board,
  directions: Directions[],
  coordinates: coordinates
): coordinates[] =>
  directions.map((direction) =>
    searchForPiece(gameState, coordinates.row, coordinates.col, direction)
  );

const getAvaiableSquare = (
  gameState: Board,
  coordinates: coordinates | null,
  direction: Directions,
  color: colors,
  withoutPrevious = false,
  onlyAttack = false
): coordinates | null => {
  if (!coordinates) return null;
  const piece = getPieceByCoordinates(gameState, coordinates);

  if (!piece && onlyAttack) return null;

  if (piece && !onlyAttack) return null;

  return piece?.color === color
    ? !withoutPrevious
      ? getPreviousCoordinates(coordinates, direction)
      : null
    : coordinates;
};

const getCoordinatesByDirection = (
  row: number,
  col: number,
  direction: Directions,
  distance: number
): coordinates => {
  let result = { row, col };

  for (let i = 0; i < distance; i++) {
    result = directionToSearchFunctionMapping[direction](result);
  }

  return result;
};

const getCoordinatesByPath = (
  row: number,
  col: number,
  path: Directions[]
): coordinates | null => {
  for (let i = 0; i < path.length; i++) {
    const newCoordinates = directionToSearchFunctionMapping[path[i]]({
      row,
      col,
    });
    row = newCoordinates.row;
    col = newCoordinates.col;

    if (!areCoordinatesInBounds({ row, col })) return null;
  }

  return { row, col };
};

export {
  createInitialBoard,
  createPieceImageUrl,
  createPiece,
  columnIndexTopieceTypesToMapping,
  getPieceByCoordinates,
  searchForPiece,
  getPreviousCoordinates,
  getAvaiableSquare,
  getVisiblePiecesCoordinates,
  getCoordinatesPathArray,
  getCoordinatesByDirection,
  getSquareByCoordinates,
  getCoordinatesByPath,
  directionToKnightPositionMapping,
};
