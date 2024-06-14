import {
  AvailiableMovementDirections,
  Board,
  Directions,
  MovementTypes,
  colors,
  coordinates,
  drawTypes,
  pieceTypes,
  playState,
  playStateTypes,
  winTypes,
} from '../interfaces';
import { v4 as uuidv4 } from 'uuid';
import {
  calculateMoveCount,
  createInitialBoard,
  createPieceImageUrl,
  getAvaiableSquare,
  getCoordinatesByDirection,
  getCoordinatesByPath,
  getCoordinatesPathArray,
  getCoordinatesRelation,
  getPieceByCoordinates,
  getSquareAttackers,
  moveToChessNotationMapping,
  oppositeDirections,
  searchForPieceCoordinates,
  serializeBoard,
} from '../utils';
import { boardHeight, boardWidth, opostiteColorMapping } from '../constants';
import { directionToKnightPositionMapping } from '../constants/directions';
import { sufficientMaterialTypes } from '../constants/pieces';

class BoardSquare {
  color: colors;
  piece: Piece | null;

  constructor(color: colors, piece: Piece | null) {
    this.color = color;
    this.piece = piece;
  }
}

class Player {
  game: Game;
  id: string;
  color: colors;
  isInCheck: boolean;
  kingRowIndex: number;
  kingColIndex: number;
  attackers: Piece[];
  timer: CountdownTimer;

  constructor(game: Game, color: colors) {
    this.game = game;
    this.color = color;
    this.id = uuidv4();
    this.isInCheck = false;
    this.kingRowIndex = color === colors.white ? 0 : boardHeight - 1;
    this.kingColIndex = 4;
    this.attackers = [];
    this.timer = new CountdownTimer(120);
  }

  getLegalMoves(row: number, col: number): coordinates[] {
    if (this.game.playState.type !== playStateTypes.running) return [];

    const selectedPiece = getPieceByCoordinates(this.game.board, {
      row,
      col,
    });

    if (!selectedPiece) return [];

    const type = selectedPiece.type;

    if (this.attackers.length > 1 && type !== pieceTypes.king) return [];

    let legalMoves = selectedPiece.getLegalMoves(this.game);

    if (this.attackers.length) {
      const attackingCoordinatesPath: coordinates[] = [];

      const kingCoordinates: coordinates = {
        row: this.kingRowIndex,
        col: this.kingColIndex,
      };

      const attackerCoordinates: coordinates = this.attackers[0].coordinates;

      const attackerDirection = getCoordinatesRelation(
        kingCoordinates,
        attackerCoordinates
      );

      if (!attackerDirection) {
        attackingCoordinatesPath.push(this.attackers[0].coordinates);
      } else {
        attackingCoordinatesPath.push(
          ...getCoordinatesPathArray(
            kingCoordinates,
            attackerCoordinates,
            attackerDirection
          )
        );
      }

      if (type !== pieceTypes.king) {
        //moves that can take the attacker or block the attack
        legalMoves = legalMoves.filter(({ row, col }) =>
          attackingCoordinatesPath.find(
            (attackerCoordinates) =>
              attackerCoordinates.row === row && attackerCoordinates.col === col
          )
        );
      } else {
        legalMoves = legalMoves.filter((coordinate) => {
          const kingToAttackerRelation = getCoordinatesRelation(
            selectedPiece.coordinates,
            this.attackers[0].coordinates
          );

          const kingToLegalMoveRelation = getCoordinatesRelation(
            selectedPiece.coordinates,
            coordinate
          ) as Directions;

          return kingToAttackerRelation
            ? kingToLegalMoveRelation !==
                oppositeDirections[kingToAttackerRelation]
            : true;
        });
      }
    }

    //checks for pinned pieces
    if (type !== pieceTypes.king) {
      const kingAttacker = this.getPossibleKingAttacker(selectedPiece);

      const kingDirection = getCoordinatesRelation(selectedPiece.coordinates, {
        row: this.kingRowIndex,
        col: this.kingColIndex,
      });

      const attackingSquares =
        kingAttacker && kingDirection
          ? getCoordinatesPathArray(
              { col: this.kingColIndex, row: this.kingRowIndex },
              kingAttacker.coordinates,
              oppositeDirections[kingDirection]
            ).filter(
              ({ col, row }) =>
                !(
                  col === selectedPiece.coordinates.col &&
                  row === selectedPiece.coordinates.row
                )
            )
          : [];

      legalMoves = attackingSquares.length
        ? legalMoves.filter(({ row, col }) =>
            attackingSquares.find(
              (attackerCoordinates) =>
                attackerCoordinates.row === row &&
                attackerCoordinates.col === col
            )
          )
        : legalMoves;
    }
    //checks for protected squares
    else {
      legalMoves = legalMoves.filter(({ row, col }) => {
        const possibleAttackers = getSquareAttackers(
          row,
          col,
          this.color,
          this.game.board
        );

        return possibleAttackers.length === 0;
      });
    }

    return legalMoves;
  }

  selectPiece(rowIndex: number, colIndex: number): coordinates[] {
    if (this.game.playState.type !== playStateTypes.running) return [];

    const clickedPiece = getPieceByCoordinates(this.game.board, {
      row: rowIndex,
      col: colIndex,
    });

    if (!clickedPiece) return [];

    return this.getLegalMoves(rowIndex, colIndex);
  }

  move(
    prevRowIndex: number,
    prevColIndex: number,
    rowIndex: number,
    colIndex: number
  ): void {
    if (this.game.playState.type !== playStateTypes.running) return;

    const selectedPiece = getPieceByCoordinates(this.game.board, {
      row: prevRowIndex,
      col: prevColIndex,
    });

    if (!selectedPiece) return;

    selectedPiece.coordinates = { row: rowIndex, col: colIndex };

    if (selectedPiece.type === pieceTypes.king) {
      this.kingColIndex = colIndex;
      this.kingRowIndex = rowIndex;
    }

    selectedPiece.isMoved = true;

    const directionRelation = getCoordinatesRelation(
      { row: prevRowIndex, col: prevColIndex },
      { row: rowIndex, col: colIndex }
    );

    const isVerticalMovement =
      directionRelation === Directions.down ||
      directionRelation === Directions.up;

    const isEnPassantMove =
      selectedPiece.type === pieceTypes.pawn &&
      isVerticalMovement &&
      Math.abs(rowIndex - prevRowIndex) == 2;

    const isEnPassantTake =
      selectedPiece.type === pieceTypes.pawn &&
      !isVerticalMovement &&
      this.game.enPassantCoordinates?.col === colIndex &&
      this.game.enPassantCoordinates.row === rowIndex;

    const isCastleShort = false;
    const isCasteLong = false;

    this.game.updateGameState(
      prevRowIndex,
      prevColIndex,
      rowIndex,
      colIndex,
      isEnPassantMove,
      isEnPassantTake
    );
  }

  updateGame(game: Game): void {
    this.game = game;

    const attackers = getSquareAttackers(
      this.kingRowIndex,
      this.kingColIndex,
      this.color,
      this.game.board
    );

    if (attackers.length > 0) {
      this.attackers = attackers;
      this.isInCheck = true;
    } else {
      this.attackers = [];
      this.isInCheck = false;
    }
  }

  getPossibleKingAttacker(selectedPiece: Piece): Piece | null {
    const gameState = this.game.board;
    const kingDirection = getCoordinatesRelation(selectedPiece.coordinates, {
      row: this.kingRowIndex,
      col: this.kingColIndex,
    });

    if (!kingDirection) return null;

    const closesPieceInKingDirection = getPieceByCoordinates(
      gameState,
      searchForPieceCoordinates(
        gameState,
        selectedPiece.coordinates.row,
        selectedPiece.coordinates.col,
        kingDirection
      )
    );

    if (!closesPieceInKingDirection) return null;

    const isKingBehind =
      closesPieceInKingDirection.type === pieceTypes.king &&
      closesPieceInKingDirection.color === this.color;

    if (!isKingBehind) return null;

    const closestPieceInOppositeDirection = getPieceByCoordinates(
      gameState,
      searchForPieceCoordinates(
        gameState,
        selectedPiece.coordinates.row,
        selectedPiece.coordinates.col,
        oppositeDirections[kingDirection]
      )
    );

    if (
      !closestPieceInOppositeDirection ||
      closestPieceInOppositeDirection.color === this.color
    )
      return null;

    const isAttacker =
      closestPieceInOppositeDirection
        ?.getAvailiableMovementDirections()
        .directions.includes(kingDirection) &&
      closestPieceInOppositeDirection.getAvailiableMovementDirections()
        .movementType === MovementTypes.mulitpleSquares;

    return isAttacker ? closestPieceInOppositeDirection : null;
  }

  findAllPieces(): Piece[] {
    const initialValue: Piece[] = [];
    const pieces = this.game.board.reduce((acc, currRow) => {
      const rowPiecespieces = currRow
        .filter((square) => square.piece?.color === this.color)
        .map((square) => square.piece as Piece);
      return [...acc, ...rowPiecespieces];
    }, initialValue);

    return pieces;
  }

  offerDraw(): void {
    if (this.game.playState.type !== playStateTypes.running) return;

    this.game.playState = {
      type: playStateTypes.drawOffer,
      initializedBy: this.color,
    };
  }

  answerDrawOffer(accept: boolean): void {
    if (this.game.playState.type !== playStateTypes.drawOffer) return;

    if (accept)
      this.game.playState = {
        type: playStateTypes.draw,
        subType: drawTypes.agreement,
      };
    else this.game.playState = { type: playStateTypes.running };
  }

  resign(): void {
    if (this.game.playState.type !== playStateTypes.running) return;

    this.game.stopGame(
      { type: playStateTypes.winner, subType: winTypes.resignation },
      opostiteColorMapping[this.color]
    );
  }

  promote(pieceType: pieceTypes): void {
    if (this.game.playState.type !== playStateTypes.promotionMenu) return;

    const piece = this.game.promotionPiece;

    if (!piece) return;

    piece.promote(pieceType);

    this.game.playState = { type: playStateTypes.running };
    this.game.promotionPiece = null;
  }
}

class Game {
  blackPlayer: Player | null;
  whitePlayer: Player | null;
  moveSequence: string[];
  board: Board;
  previousGameStates: Board[];
  winnerColor: colors | null;

  turn: colors;
  enPassantCoordinates: coordinates | null;
  promotionPiece: Piece | null;

  playState: playState;
  lastPawnMove: number;
  boardSeriliazations: string[];

  constructor() {
    this.blackPlayer = null;
    this.whitePlayer = null;
    this.moveSequence = [];
    this.board = createInitialBoard();
    this.previousGameStates = [];
    this.winnerColor = null;

    this.turn = colors.white;
    this.enPassantCoordinates = null;
    this.promotionPiece = null;
    this.playState = { type: playStateTypes.pause };
    this.lastPawnMove = 0;
    this.boardSeriliazations = [];
  }

  addPlayers(whitePlayer: Player, blackPlayer: Player): void {
    this.blackPlayer = blackPlayer;
    this.whitePlayer = whitePlayer;
  }

  notifyStateChange(): void {
    this.blackPlayer?.updateGame(this);
    this.whitePlayer?.updateGame(this);
  }

  updateGameState(
    prevRowIndex: number,
    prevColIndex: number,
    newRowIndex: number,
    newColIndex: number,
    isEnPassantMove: boolean,
    isEnPassantTake: boolean
  ): void {
    if (this.turn === colors.white) {
      this.whitePlayer?.timer.stop();
      this.blackPlayer?.timer.start();
    } else {
      this.blackPlayer?.timer.stop();
      this.whitePlayer?.timer.start();
    }

    this.turn = opostiteColorMapping[this.turn];

    let isTakeMove = false;

    const piece = this.board[prevRowIndex][prevColIndex].piece;

    if (!piece) return;

    if (this.board[newRowIndex][newColIndex].piece) isTakeMove = true;

    this.board[newRowIndex][newColIndex].piece = piece;

    this.board[prevRowIndex][prevColIndex].piece = null;

    if (isEnPassantTake && this.enPassantCoordinates) {
      const { row, col } = this.enPassantCoordinates;

      const enPassantRow = this.turn === colors.white ? row + 1 : row - 1;
      this.board[enPassantRow][col].piece = null;
    }

    if (isEnPassantMove) {
      this.enPassantCoordinates = {
        row: this.turn === colors.white ? newRowIndex + 1 : newRowIndex - 1,
        col: newColIndex,
      };
    } else {
      this.enPassantCoordinates = null;
    }

    const isClastle =
      piece.type === pieceTypes.king &&
      Math.abs(newColIndex - prevColIndex) === 2;

    let isCastleLong = false;

    if (isClastle) {
      const rookLeftCoordinates = searchForPieceCoordinates(
        this.board,
        newRowIndex,
        newColIndex,
        Directions.left
      );

      const rookRightCoordinates = searchForPieceCoordinates(
        this.board,
        newRowIndex,
        newColIndex,
        Directions.right
      );

      isCastleLong =
        Math.abs(newColIndex - rookLeftCoordinates.col) <
        Math.abs(newColIndex - rookRightCoordinates.col);

      const { row: closerRookRow, col: closerRookCol } = isCastleLong
        ? rookLeftCoordinates
        : rookRightCoordinates;

      const rook = this.board[closerRookRow][closerRookCol].piece as Piece;

      this.board[closerRookRow][closerRookCol].piece = null;

      if (isCastleLong) {
        this.board[newRowIndex][newColIndex + 1].piece = rook;

        rook.coordinates = { row: newRowIndex, col: newColIndex + 1 };
      } else {
        this.board[newRowIndex][newColIndex - 1].piece = rook;
        rook.coordinates = { row: newRowIndex, col: newColIndex - 1 };
      }
    }

    const isPawnPromotion =
      piece.type === pieceTypes.pawn &&
      (newRowIndex === boardHeight - 1 || newRowIndex === 0);

    if (isPawnPromotion) {
      this.playState = { type: playStateTypes.promotionMenu };
      this.promotionPiece = piece;
    }

    this.notifyStateChange();

    const isCheck = this.blackPlayer?.isInCheck || this.whitePlayer?.isInCheck;

    this.moveSequence.push(
      moveToChessNotationMapping(
        { row: prevRowIndex, col: prevColIndex },
        piece,
        this.board,
        isTakeMove || isEnPassantTake,
        !!isCheck,
        false,
        isCastleLong,
        isClastle && !isCastleLong,
        isPawnPromotion
      )
    );

    if (piece.type === pieceTypes.pawn)
      this.lastPawnMove = this.moveSequence.length;

    const seriliazation = serializeBoard(this);

    isClastle || piece.type === pieceTypes.pawn || isTakeMove
      ? (this.boardSeriliazations = [seriliazation])
      : this.boardSeriliazations.push(seriliazation);

    this.checkGameOver();
  }

  startGame(): void {
    this.playState = { type: playStateTypes.running };
    this.whitePlayer?.timer.start();
  }

  stopGame(state: playState, winner?: colors): void {
    this.playState = state;
    this.whitePlayer?.timer.stop();
    this.whitePlayer?.timer.stop();
    this.winnerColor = winner ? winner : null;
  }

  checkGameOver(): void {
    //no legal moves
    const legalMovesWhiteCount =
      this.whitePlayer && calculateMoveCount(this.whitePlayer);

    if (legalMovesWhiteCount === 0) {
      if (this.whitePlayer?.isInCheck) {
        this.stopGame(
          { type: playStateTypes.winner, subType: winTypes.checkmate },
          colors.black
        );
      } else
        this.stopGame({
          type: playStateTypes.draw,
          subType: drawTypes.stalemate,
        });

      return;
    }

    const legalMovesBlackCount =
      this.blackPlayer && calculateMoveCount(this.blackPlayer);

    if (legalMovesBlackCount === 0) {
      if (this.blackPlayer?.isInCheck) {
        this.stopGame(
          { type: playStateTypes.winner, subType: winTypes.checkmate },
          colors.white
        );
      } else
        this.stopGame({
          type: playStateTypes.draw,
          subType: drawTypes.stalemate,
        });

      return;
    }

    //fifty move rule
    const moveCount = this.moveSequence.length;

    const fiftyMoveRule =
      moveCount - this.lastPawnMove >= 50 &&
      this.moveSequence.slice(-50).find((move) => move.includes('x'));

    if (fiftyMoveRule) {
      this.stopGame({
        type: playStateTypes.draw,
        subType: drawTypes.fiftyMove,
      });
      return;
    }
    //insufficient material
    const whitePlayerPieces = this.whitePlayer?.findAllPieces() as Piece[];

    const blackPlayerPieces = this.blackPlayer?.findAllPieces() as Piece[];

    if (whitePlayerPieces?.length <= 3 && blackPlayerPieces?.length <= 3) {
      if (
        !whitePlayerPieces.some(
          (piece) => piece.type in sufficientMaterialTypes
        ) &&
        !blackPlayerPieces.some(
          (piece) => piece.type in sufficientMaterialTypes
        )
      ) {
        this.stopGame({
          type: playStateTypes.draw,
          subType: drawTypes.insufficientMaterial,
        });

        return;
      }
    }

    //repetition rule
    if (
      this.boardSeriliazations.length -
        new Set(this.boardSeriliazations).size >=
      3
    ) {
      this.stopGame({
        type: playStateTypes.draw,
        subType: drawTypes.repetition,
      });

      return;
    }

    //no time left
    if (this.whitePlayer?.timer.currentTime === 0) {
      this.stopGame(
        {
          type: playStateTypes.winner,
          subType: winTypes.zeitNot,
        },
        colors.black
      );

      return;
    }

    if (this.blackPlayer?.timer.currentTime === 0) {
      this.stopGame(
        {
          type: playStateTypes.winner,
          subType: winTypes.zeitNot,
        },
        colors.white
      );

      return;
    }
  }
}

class Piece {
  color: colors;
  id: string;
  type: pieceTypes;
  imgUrl: string;
  isMoved: boolean;

  coordinates: coordinates;

  constructor(color: colors, type: pieceTypes, coordinates: coordinates) {
    this.id = uuidv4();

    this.color = color;
    this.type = type;
    this.isMoved = false;

    this.imgUrl = createPieceImageUrl(type, color);

    this.coordinates = coordinates;
  }

  public static getAvailiableMovementDirectionsStatic = (
    type: pieceTypes,
    color: colors,
    onlyAttack: boolean
  ): AvailiableMovementDirections => {
    let availiableDirections: AvailiableMovementDirections;

    switch (type) {
      case pieceTypes.pawn:
        availiableDirections = {
          directions: [
            color === colors.white ? Directions.downLeft : Directions.upLeft,

            color === colors.white ? Directions.downRight : Directions.upRight,
          ],
          movementType: MovementTypes.steps,
        };
        if (!onlyAttack)
          availiableDirections.directions.push(
            color === colors.white ? Directions.up : Directions.down
          );

        break;

      case pieceTypes.rook:
        availiableDirections = {
          directions: [
            Directions.down,
            Directions.up,
            Directions.left,
            Directions.right,
          ],
          movementType: MovementTypes.mulitpleSquares,
        };

        break;

      case pieceTypes.knight:
        availiableDirections = {
          directions: [
            Directions.down,
            Directions.up,
            Directions.left,
            Directions.right,
            Directions.upLeft,
            Directions.upRight,
            Directions.downLeft,
            Directions.downRight,
          ],
          movementType: MovementTypes.singleSquare,
        };

        break;

      case pieceTypes.bishop:
        availiableDirections = {
          directions: [
            Directions.upLeft,
            Directions.upRight,
            Directions.downLeft,
            Directions.downRight,
          ],
          movementType: MovementTypes.mulitpleSquares,
        };

        break;

      case pieceTypes.queen:
        availiableDirections = {
          directions: [
            Directions.down,
            Directions.up,
            Directions.left,
            Directions.right,
            Directions.upLeft,
            Directions.upRight,
            Directions.downLeft,
            Directions.downRight,
          ],
          movementType: MovementTypes.mulitpleSquares,
        };

        break;

      case pieceTypes.king:
        availiableDirections = {
          directions: [
            Directions.down,
            Directions.up,
            Directions.left,
            Directions.right,
            Directions.upLeft,
            Directions.upRight,
            Directions.downLeft,
            Directions.downRight,
          ],
          movementType: MovementTypes.steps,
        };
        break;
    }

    return availiableDirections;
  };

  public static getLegalMovesByType(
    row: number,
    col: number,
    gameState: Board,
    type: pieceTypes,
    color: colors,
    onlyAttack: boolean
  ): coordinates[] {
    const availiableDirections = this.getAvailiableMovementDirectionsStatic(
      type,
      color,
      onlyAttack
    );

    const initialValue: coordinates[] = [];

    return availiableDirections.directions.reduce((acc, direction) => {
      let destinationSquare: coordinates | null;

      const isPawn = type === pieceTypes.pawn;

      const isVerticalMovement =
        direction === Directions.down || direction === Directions.up;

      //if the direction is no horizontal and if it is a pawn: if there no en passant on the piece - invalidate the square

      switch (availiableDirections.movementType) {
        case MovementTypes.steps:
          destinationSquare = getCoordinatesByDirection(row, col, direction, 1);
          break;

        case MovementTypes.mulitpleSquares:
          destinationSquare = searchForPieceCoordinates(
            gameState,
            row,
            col,
            direction
          );
          break;

        case MovementTypes.singleSquare:
          destinationSquare = getCoordinatesByPath(
            row,
            col,
            directionToKnightPositionMapping[direction]
          );
          break;
      }

      const availiableSquareCoordinates = getAvaiableSquare(
        gameState,
        destinationSquare,
        direction,
        color,
        availiableDirections.movementType === MovementTypes.singleSquare,
        isPawn && !isVerticalMovement,
        isPawn && isVerticalMovement
      );

      if (!availiableSquareCoordinates) return acc;

      let coordinatesArray: coordinates[] = [];

      if (availiableDirections.movementType !== MovementTypes.singleSquare) {
        coordinatesArray = getCoordinatesPathArray(
          { row, col },
          availiableSquareCoordinates,
          direction
        );
      } else {
        coordinatesArray = [availiableSquareCoordinates];
      }

      return [...acc, ...coordinatesArray];
    }, initialValue);
  }

  public getAvailiableMovementDirections = (): AvailiableMovementDirections => {
    let availiableDirections: AvailiableMovementDirections;

    switch (this.type) {
      case pieceTypes.pawn:
        availiableDirections = {
          directions: [
            this.color === colors.white ? Directions.up : Directions.down,
            this.color === colors.white
              ? Directions.downLeft
              : Directions.upLeft,

            this.color === colors.white
              ? Directions.downRight
              : Directions.upRight,
          ],
          movementType: MovementTypes.steps,
        };

        break;

      case pieceTypes.rook:
        availiableDirections = {
          directions: [
            Directions.down,
            Directions.up,
            Directions.left,
            Directions.right,
          ],
          movementType: MovementTypes.mulitpleSquares,
        };

        break;

      case pieceTypes.knight:
        availiableDirections = {
          directions: [
            Directions.down,
            Directions.up,
            Directions.left,
            Directions.right,
            Directions.upLeft,
            Directions.upRight,
            Directions.downLeft,
            Directions.downRight,
          ],
          movementType: MovementTypes.singleSquare,
        };

        break;

      case pieceTypes.bishop:
        availiableDirections = {
          directions: [
            Directions.upLeft,
            Directions.upRight,
            Directions.downLeft,
            Directions.downRight,
          ],
          movementType: MovementTypes.mulitpleSquares,
        };

        break;

      case pieceTypes.queen:
        availiableDirections = {
          directions: [
            Directions.down,
            Directions.up,
            Directions.left,
            Directions.right,
            Directions.upLeft,
            Directions.upRight,
            Directions.downLeft,
            Directions.downRight,
          ],
          movementType: MovementTypes.mulitpleSquares,
        };

        break;

      case pieceTypes.king:
        availiableDirections = {
          directions: [
            Directions.down,
            Directions.up,
            Directions.left,
            Directions.right,
            Directions.upLeft,
            Directions.upRight,
            Directions.downLeft,
            Directions.downRight,
          ],
          movementType: MovementTypes.steps,
        };
        break;
    }

    return availiableDirections;
  };

  public getLegalMoves(game: Game): coordinates[] {
    const { row, col } = this.coordinates;

    const gameState = game.board;

    const availiableDirections = this.getAvailiableMovementDirections();

    const initialValue: coordinates[] = [];

    const canCastleShort = this.checkCastle(gameState, false);

    const canCastleLong = this.checkCastle(gameState, true);

    return availiableDirections.directions.reduce((acc, direction) => {
      let destinationCoordinates: coordinates | null;

      const isPawn = this.type === pieceTypes.pawn;

      const isKing = this.type === pieceTypes.king;

      const isVerticalMovement =
        direction === Directions.down || direction === Directions.up;

      switch (availiableDirections.movementType) {
        case MovementTypes.steps:
          let stepDistance = 1;

          if (isPawn && isVerticalMovement && !this.isMoved) stepDistance = 2;

          if (direction === Directions.left || direction === Directions.right) {
            if (isKing && canCastleLong) {
              stepDistance = direction === Directions.left ? 2 : 1;
            }

            if (isKing && canCastleShort) {
              stepDistance =
                direction === Directions.right ? 2 : canCastleLong ? 2 : 1;
            }
          }

          destinationCoordinates = getCoordinatesByDirection(
            row,
            col,
            direction,
            stepDistance
          );
          break;

        case MovementTypes.mulitpleSquares:
          destinationCoordinates = searchForPieceCoordinates(
            gameState,
            row,
            col,
            direction
          );
          break;

        case MovementTypes.singleSquare:
          destinationCoordinates = getCoordinatesByPath(
            row,
            col,
            directionToKnightPositionMapping[direction]
          );
          break;
      }

      const isEnpassantTakeMove =
        game.enPassantCoordinates &&
        game.enPassantCoordinates.row === destinationCoordinates?.row &&
        game.enPassantCoordinates.col === destinationCoordinates?.col &&
        getPieceByCoordinates(gameState, game.enPassantCoordinates)?.color !==
          this.color;

      const availiableSquareCoordinates = getAvaiableSquare(
        gameState,
        destinationCoordinates,
        direction,
        this.color,
        availiableDirections.movementType === MovementTypes.singleSquare,
        isPawn && !isVerticalMovement && !isEnpassantTakeMove,
        isPawn && isVerticalMovement
      );

      if (!availiableSquareCoordinates) return acc;

      let coordinatesArray: coordinates[] = [];

      if (availiableDirections.movementType !== MovementTypes.singleSquare) {
        coordinatesArray = getCoordinatesPathArray(
          { row, col },
          availiableSquareCoordinates,
          direction
        );
      } else {
        coordinatesArray = [availiableSquareCoordinates];
      }

      return [...acc, ...coordinatesArray];
    }, initialValue);
  }

  public checkCastle(gameState: Board, long: boolean): boolean {
    if (this.type !== pieceTypes.king) return false;

    const castleCoordinates: coordinates = {
      row: this.coordinates.row,
      col: long ? 0 : boardWidth - 1,
    };

    const castlePath = getCoordinatesPathArray(
      this.coordinates,
      castleCoordinates,
      long ? Directions.left : Directions.right
    );

    const checkPathValidity = [this.coordinates, ...castlePath].every(
      (coordinate) => {
        const piece = getPieceByCoordinates(gameState, coordinate);

        const attackers = getSquareAttackers(
          coordinate.row,
          coordinate.col,
          this.color,
          gameState
        );

        if (attackers.length > 0) return piece?.type === pieceTypes.rook;

        if (!piece) return attackers.length === 0;

        return (
          piece.color === this.color &&
          !piece.isMoved &&
          (piece.type === pieceTypes.king || piece.type === pieceTypes.rook)
        );
      }
    );

    return checkPathValidity;
  }

  public promote(type: pieceTypes): void {
    this.imgUrl = createPieceImageUrl(type, this.color);
    this.type = type;
  }
}

class CountdownTimer {
  private duration: number;
  public currentTime: number;
  private intervalId: number | null;

  constructor(duration: number) {
    this.duration = duration;
    this.currentTime = duration;
    this.intervalId = null;
  }

  private updateDisplay() {
    // Update the display with the current time (you can customize this as needed)
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  public start() {
    if (this.intervalId !== null) return; // Prevent multiple intervals

    this.intervalId = window.setInterval(() => {
      this.currentTime--;
      this.updateDisplay();

      if (this.currentTime <= 0) {
        this.stop();
      }
    }, 1000);
  }

  public stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public reset() {
    this.stop();
    this.currentTime = this.duration;
    this.updateDisplay();
  }

  public setDuration(newDuration: number) {
    this.duration = newDuration;
    this.reset();
  }
}

export { CountdownTimer, BoardSquare, Game, Player, Piece };
