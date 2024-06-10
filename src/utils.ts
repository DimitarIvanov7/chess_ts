import { BoardSquare, Piece } from './classes';
import { boardHeight } from './constants';
import {
  Board,
  Directions,
  colors,
  coordinates,
  pieceTypes,
} from './interfaces';

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

      const currentSquare: BoardSquare = new BoardSquare(
        squareColor,

        currentPiece

        // currentPiece?.type !== pieceTypes.pawn ? currentPiece : null
        // currentPiece?.type === pieceTypes.king ||
        // currentPiece?.type === pieceTypes.rook
        //   ? currentPiece
        //   : null
      );

      //TODO: remove that, it is for dev testing

      row.push(currentSquare);
    }

    board.push(row);
  }

  return board;
};

const createPiece = (rowIndex: number, colIndex: number) => {
  let currentPiece: Piece | null = null;

  let pieceColor =
    rowIndex < 2
      ? colors.white
      : rowIndex > boardHeight - 3
      ? colors.black
      : null;

  if (rowIndex === 1 || rowIndex === boardHeight - 2) {
    currentPiece = new Piece(pieceColor!, pieceTypes.pawn, {
      row: rowIndex,
      col: colIndex,
    });
  }

  if (rowIndex === 0 || rowIndex === boardHeight - 1) {
    currentPiece = new Piece(
      pieceColor!,
      columnIndexTopieceTypesToMapping[colIndex],
      { row: rowIndex, col: colIndex }
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

const searchForPieceCoordinates = (
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
  endCoordinates: coordinates,
  direction: Directions
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
  directionToSearchFunctionMapping[oppositeDirections[direction]](coordinates);

const getVisiblePiecesCoordinates = (
  gameState: Board,
  directions: Directions[],
  coordinates: coordinates
): coordinates[] =>
  directions.map((direction) =>
    searchForPieceCoordinates(
      gameState,
      coordinates.row,
      coordinates.col,
      direction
    )
  );

const getAvaiableSquare = (
  gameState: Board,
  coordinates: coordinates | null,
  direction: Directions,
  color: colors,
  withoutPrevious = false,
  onlyAttack = false,
  noAttack = false
): coordinates | null => {
  if (!coordinates) return null;
  const piece = getPieceByCoordinates(gameState, coordinates);

  if (!piece && onlyAttack) return null;

  if (piece && noAttack) return null;

  if (piece?.type === pieceTypes.king) return null;

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

const getCoordinatesRelation = (
  startCoordinates: coordinates,
  endCoordinates: coordinates
): Directions | null => {
  const rowDifference = startCoordinates.row - endCoordinates.row;
  const colDifference = startCoordinates.col - endCoordinates.col;

  if (Math.abs(rowDifference) === Math.abs(colDifference)) {
    if (rowDifference > 0) {
      return colDifference > 0 ? Directions.upLeft : Directions.upRight;
    }

    return colDifference > 0 ? Directions.downLeft : Directions.downRight;
  }

  if (rowDifference === 0 && colDifference === 0) return null;

  if (rowDifference !== 0 && colDifference !== 0) return null;

  if (rowDifference === 0 && colDifference !== 0)
    return colDifference > 0 ? Directions.left : Directions.right;

  return rowDifference > 0 ? Directions.down : Directions.up;
};

const checkCoordinatesEquality = (
  startCoordinates: coordinates,
  endCoordinates: coordinates
) => {
  return (
    startCoordinates.row === endCoordinates.row &&
    startCoordinates.col === endCoordinates.col
  );
};

const getSquareAttackers = (
  row: number,
  col: number,
  color: colors,
  gameState: Board
): Piece[] => {
  const attackingPieceTypes: pieceTypes[] = Object.values(pieceTypes);

  const attackers: Piece[] = attackingPieceTypes
    .map((pieceType) => ({
      coordinates: Piece.getLegalMovesByType(
        row,
        col,
        gameState,
        pieceType,
        color,
        true
      ),
      type: pieceType,
    }))
    .map(({ coordinates, type }) =>
      coordinates.map((coordinate) => ({
        piece: getPieceByCoordinates(gameState, coordinate),
        type,
      }))
    )
    .filter((piecesWithType) =>
      piecesWithType.find(({ piece, type }) => {
        return !!piece && piece.color !== color && piece.type === type;
      })
    )
    .map((piecesWithType) => {
      const pieceWithType = piecesWithType.find(
        ({ piece, type }) => piece?.type === type
      );
      return pieceWithType?.piece as Piece;
    });

  return attackers;
};

export {
  createInitialBoard,
  createPieceImageUrl,
  createPiece,
  columnIndexTopieceTypesToMapping,
  getPieceByCoordinates,
  searchForPieceCoordinates,
  getPreviousCoordinates,
  getAvaiableSquare,
  getVisiblePiecesCoordinates,
  getCoordinatesPathArray,
  getCoordinatesByDirection,
  getSquareByCoordinates,
  getCoordinatesByPath,
  directionToKnightPositionMapping,
  getCoordinatesRelation,
  oppositeDirections,
  checkCoordinatesEquality,
  getSquareAttackers,
};
