import { BoardSquare, Game, Piece, Player } from './classes';
import { boardHeight, opostiteColorMapping } from './constants';
import {
  columnIndexTopieceTypesToMapping,
  directionToSearchFunctionMapping,
  oppositeDirections,
} from './constants/directions';
import {
  colIndexToLetterMapping,
  colorToImageUrlMapping,
  lettertoColIndexMapping,
  notationToPieceMapping,
  piecesToNotationMapping,
} from './constants/pieces';
import {
  Board,
  Directions,
  colors,
  coordinates,
  pieceNotation,
  pieceTypes,
} from './interfaces';

const createPieceImageUrl = (piece: pieceTypes, color: colors) => {
  return (
    '/images/' +
    piecesToNotationMapping[piece] +
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

  if (
    (!piece && onlyAttack) ||
    (piece && noAttack) ||
    piece?.type === pieceTypes.king
  )
    return !withoutPrevious
      ? getPreviousCoordinates(coordinates, direction)
      : null;

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

const calculateMoveCount = (player: Player): number => {
  return player
    ?.findAllPieces()
    .map(({ coordinates }) =>
      player?.getLegalMoves(coordinates.row, coordinates.col)
    )
    .reduce((acc, curr) => (curr ? acc + curr?.length : acc), 0);
};

const moveToChessNotationMapping = (
  { row: oldRow, col: oldCol }: coordinates,
  piece: Piece,
  gameState: Board,
  takes: boolean,
  isCheck: boolean,
  isMate: boolean,
  isLongCastle: boolean,
  isShortCastle: boolean,
  isPromotion: boolean
) => {
  if (isLongCastle) return 'O-O-O';

  if (isShortCastle) return 'O-O';

  if (isPromotion) {
    const { row, col } = piece.coordinates;
    return `${piecesToNotationMapping[piece.type]}${
      colIndexToLetterMapping[col]
    }${row - 1}`;
  }

  let result = '';

  if (isCheck) result += '+';
  else if (isMate) result += '#';

  if (!piece) return '';

  const pieceTypeNotation =
    piece.type !== pieceTypes.pawn
      ? piecesToNotationMapping[piece.type]
      : takes
      ? colIndexToLetterMapping[oldCol]
      : '';

  result += pieceTypeNotation;

  const { row: newRow, col: newCol } = piece.coordinates;

  const squareAttackersOfSameType = getSquareAttackers(
    newRow,
    newCol,
    opostiteColorMapping[piece.color],
    gameState
  ).filter((attacker) => attacker.type === piece.type);

  if (squareAttackersOfSameType.length && piece.type !== pieceTypes.pawn) {
    const sameCol = squareAttackersOfSameType.some(
      (piece) => piece.coordinates.col === oldCol
    );

    const sameRow = squareAttackersOfSameType.some(
      (piece) => piece.coordinates.row === oldRow
    );
    if (sameRow || (!sameCol && !sameRow))
      result += colIndexToLetterMapping[oldCol];

    if (sameCol) result += `${oldRow + 1}`;
  }

  if (takes) result += 'x';

  const destinationColLetter = colIndexToLetterMapping[newCol];

  const destinationRowNumber = newRow + 1;

  result += `${destinationColLetter}${destinationRowNumber}`;

  return result;
};

const chessNotationSequenceToMovesMapping = (moves: string[]): Board => {
  const newGame = new Game();

  const players: { [key in colors]: Player } = {
    [colors.white]: new Player(newGame, colors.white),
    [colors.black]: new Player(newGame, colors.black),
  };

  newGame.addPlayers(players.white, players.black);

  moves.forEach((currentMove, index) => {
    const turnColor = index % 2 === 0 ? colors.white : colors.black;
    const currentMoveLength = currentMove.length;

    if (currentMove.includes('O-O')) {
      const isLongCastle = currentMoveLength > 3;

      const kingCol = players[turnColor].kingColIndex;

      const kingRow = players[turnColor].kingRowIndex;

      const newCol = isLongCastle ? kingCol - 2 : kingCol + 2;

      players[turnColor].move(kingRow, kingCol, kingRow, newCol);

      return;
    }

    const isCheckmate = currentMove[currentMoveLength - 1] === '#';

    const isPawnPromotion = !isCharNumber(currentMove[currentMoveLength - 1]);

    if (isPawnPromotion) {
      const destinationColIndex = lettertoColIndexMapping[currentMove[0]];

      const startColIndex = lettertoColIndexMapping[currentMove[0]];

      const destinationRowIndex = +currentMove[1] - 1;

      const startRowIndex =
        turnColor === colors.white
          ? destinationRowIndex - 1
          : destinationRowIndex + 1;

      players[turnColor].move(
        startRowIndex,
        startColIndex,
        destinationRowIndex,
        destinationColIndex
      );

      return;
    }

    const isTake = currentMove.includes('x');

    const endOfDestinationIndex = !isCheckmate
      ? currentMoveLength - 1
      : currentMoveLength - 2;

    const destinationRowIndex = +currentMove[endOfDestinationIndex] - 1;

    const destinationColIndex =
      lettertoColIndexMapping[currentMove[endOfDestinationIndex - 1]];

    const pieceType =
      currentMove[0] in pieceNotation
        ? notationToPieceMapping[currentMove[0] as pieceNotation]
        : pieceTypes.pawn;

    let disambiguationColumn: undefined | number;

    let disambiguationRow: undefined | number;

    if (pieceType === pieceTypes.pawn) {
      if (isTake)
        disambiguationColumn = lettertoColIndexMapping[currentMove[0]];
    } else {
      const fistDisambiguationIndex = currentMove
        .split('')
        .findIndex(
          (letter, index) =>
            index < endOfDestinationIndex - 1 &&
            index > 0 &&
            letter !== 'x' &&
            letter !== '+'
        );

      if (isCharNumber(currentMove[fistDisambiguationIndex]))
        disambiguationRow = +currentMove[fistDisambiguationIndex] - 1;
      else
        disambiguationColumn =
          lettertoColIndexMapping[currentMove[fistDisambiguationIndex]];
    }

    const possiblePieces = getSquareAttackers(
      destinationRowIndex,
      destinationColIndex,
      turnColor,
      newGame.board
    ).filter((piece) => piece.type === pieceType);

    const piece = (
      possiblePieces.length > 1
        ? possiblePieces.find((piece) => {
            const { row, col } = piece.coordinates;

            const hasRow = disambiguationRow !== undefined;

            const hasCol = disambiguationColumn !== undefined;

            if (!hasCol && !hasRow) return true;

            if (hasRow && hasCol)
              return row === disambiguationRow && col === disambiguationColumn;

            if (hasRow) return row === disambiguationRow;
            else return col === disambiguationColumn;
          })
        : possiblePieces[1]
    ) as Piece;

    players[turnColor].move(
      piece.coordinates.row,
      piece.coordinates.col,
      destinationRowIndex,
      destinationColIndex
    );
  });

  return newGame.board;
};

const isCharNumber = (c: string) => {
  return c.length === 1 && c >= '0' && c <= '9';
};

const serializeBoard = (game: Game): string => {
  let castle = '';
  const enpassandCoordinates = game.enPassantCoordinates?.row
    ? `|-enpassant-${game.enPassantCoordinates.row}-${game.enPassantCoordinates.col}`
    : '';

  return (
    game.board.reduce((acc, currentRow, rowIndex) => {
      return (
        acc +
        currentRow.reduce((accumulator, currentSquare) => {
          const piece = currentSquare.piece;

          if (!piece) return accumulator + (rowIndex === 0 ? '' : '-') + '|';

          let result =
            piece.color[0] + '-' + piecesToNotationMapping[piece.type];

          if (piece.checkCastle(game.board, true))
            castle += '-' + piece.color[0] + '-' + 'castle-long-|';

          if (piece.checkCastle(game.board, false))
            castle += '-' + piece.color[0] + '-' + 'castle-short-|';

          return accumulator + result + '|';
        }, '')
      );
    }, '') +
    castle +
    enpassandCoordinates
  );
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
  getCoordinatesRelation,
  oppositeDirections,
  checkCoordinatesEquality,
  getSquareAttackers,
  calculateMoveCount,
  moveToChessNotationMapping,
  chessNotationSequenceToMovesMapping,
  serializeBoard,
};
