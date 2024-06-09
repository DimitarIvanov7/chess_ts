import {
  AvailiableMovementDirections,
  Board,
  BoardSquare,
  Directions,
  Game,
  MovementTypes,
  Player,
  colors,
  coordinates,
  pieceTypes,
} from '../interfaces';
import { v4 as uuidv4 } from 'uuid';
import {
  createInitialBoard,
  createPieceImageUrl,
  directionToKnightPositionMapping,
  getAvaiableSquare,
  getCoordinatesByDirection,
  getCoordinatesByPath,
  getCoordinatesPathArray,
  getCoordinatesRelation,
  getPieceByCoordinates,
  getPreviousCoordinates,
  oppositeDirections,
  searchForPieceCoordinates,
} from '../utils';

class BoardSquareImpl implements BoardSquare {
  color: colors;
  piece: Piece | null;

  constructor(color: colors, piece: Piece | null) {
    this.color = color;
    this.piece = piece;
  }
}

class PlayerImlp implements Player {
  game: GameImpl;
  id: string;
  color: colors;
  isMated: boolean;
  isInCheck: boolean;
  kingRowIndex: number;
  kingColIndex: number;
  attackers: Piece[];

  constructor(game: GameImpl, color: colors) {
    this.game = game;
    this.color = color;
    this.id = uuidv4();
    this.isMated = false;
    this.isInCheck = false;
    this.kingRowIndex = color === colors.white ? 0 : 7;
    this.kingColIndex = 4;
    this.attackers = [];
  }

  getLegalMoves(row: number, col: number): coordinates[] {
    const selectedPiece = getPieceByCoordinates(this.game.state, {
      row,
      col,
    });

    if (!selectedPiece) return [];

    const type = selectedPiece.type;

    const gameState = this.game.state;

    if (this.attackers.length > 1 && type !== pieceTypes.king) return [];

    let legalMoves = selectedPiece.getLegalMoves(gameState);

    if (this.attackers.length) {
      const attackingCoordinatesPath: coordinates[] = [];

      const startCoordinates: coordinates = {
        row: this.kingRowIndex,
        col: this.kingColIndex,
      };

      const endCoordinates: coordinates = this.attackers[0].coordinates;

      const attackerDirection = getCoordinatesRelation(
        startCoordinates,
        endCoordinates
      );

      if (!attackerDirection) {
        attackingCoordinatesPath.push(this.attackers[0].coordinates);
      } else {
        attackingCoordinatesPath.push(
          ...getCoordinatesPathArray(
            startCoordinates,
            endCoordinates,
            attackerDirection
          )
        );

        if (type !== pieceTypes.king) {
          legalMoves = legalMoves.filter(({ row, col }) =>
            attackingCoordinatesPath.find(
              (attackerCoordinates) =>
                attackerCoordinates.row === row &&
                attackerCoordinates.col === col
            )
          );
        } else
          legalMoves = legalMoves.filter(({ row, col }) =>
            attackingCoordinatesPath.find(
              (attackerCoordinates) =>
                attackerCoordinates.row !== row &&
                attackerCoordinates.col !== col
            )
          );
      }
    }

    if (selectedPiece.type !== pieceTypes.king) {
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

    legalMoves =
      type === pieceTypes.king
        ? legalMoves.filter(({ row, col }) => {
            const attackers = this.getAttackers(row, col);

            return attackers.length === 0;
          })
        : legalMoves;

    return legalMoves;
  }

  selectPiece(rowIndex: number, colIndex: number): coordinates[] {
    const clickedPiece = getPieceByCoordinates(this.game.state, {
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
    const selectedPiece = getPieceByCoordinates(this.game.state, {
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

    this.game.updateGameState(prevRowIndex, prevColIndex, rowIndex, colIndex);
  }

  updateGame(game: GameImpl): void {
    this.game = game;

    const attackers = this.getAttackers(this.kingRowIndex, this.kingColIndex);

    if (attackers.length > 0) {
      this.attackers = attackers;
      this.isInCheck = true;
    } else {
      this.attackers = [];
      this.isInCheck = false;
    }
  }

  getAttackers(row: number, col: number): Piece[] {
    const attackingPieceTypes: pieceTypes[] = Object.values(pieceTypes);

    const attackers: Piece[] = attackingPieceTypes
      .map((pieceType) => ({
        coordinates: Piece.getLegalMovesByType(
          row,
          col,
          this.game.state,
          pieceType,
          this.color,
          true
        ),
        type: pieceType,
      }))
      .map(({ coordinates, type }) =>
        coordinates.map((coordinate) => ({
          piece: getPieceByCoordinates(this.game.state, coordinate),
          type,
        }))
      )
      .filter((piecesWithType) =>
        piecesWithType.find(({ piece, type }) => {
          return !!piece && piece.color !== this.color && piece.type === type;
        })
      )
      .map((piecesWithType) => {
        const pieceWithType = piecesWithType.find(
          ({ piece, type }) => piece?.type === type
        );
        return pieceWithType?.piece as Piece;
      });

    return attackers;
  }

  getPossibleKingAttacker(selectedPiece: Piece): Piece | null {
    const gameState = this.game.state;
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
        ?.getAvailiableMovementDirections(true)
        .directions.includes(kingDirection) &&
      closestPieceInOppositeDirection.getAvailiableMovementDirections()
        .movementType === MovementTypes.mulitpleSquares;

    return isAttacker ? closestPieceInOppositeDirection : null;
  }
}

class GameImpl implements Game {
  blackPlayer: PlayerImlp | null;
  whitePlayer: PlayerImlp | null;
  isDraw: boolean;
  moveCount: number;
  running: boolean;
  state: Board;
  previousGameStates: Board[];
  winnerId: string | null;
  timerWhite: CountdownTimer;
  timerBlack: CountdownTimer;
  turn: colors;

  constructor() {
    this.blackPlayer = null;
    this.whitePlayer = null;
    this.isDraw = false;
    this.moveCount = 0;
    this.running = false;
    this.state = createInitialBoard();
    this.previousGameStates = [];
    this.winnerId = null;
    this.timerWhite = new CountdownTimer(120);
    this.timerBlack = new CountdownTimer(120);
    this.turn = colors.white;
  }

  addPlayers(whitePlayer: PlayerImlp, blackPlayer: PlayerImlp): void {
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
    newColIndex: number
  ): void {
    //check the legal moves for all pieces of both the players
    //if someone has no legal moves - if in check - mate, if not - draw
    this.state[newRowIndex][newColIndex].piece =
      this.state[prevRowIndex][prevColIndex].piece;

    this.state[prevRowIndex][prevColIndex].piece = null;

    this.notifyStateChange();
  }

  startGame(): void {
    this.running = true;
    this.timerWhite.start();
  }

  stopGame(): void {
    this.running = false;
    this.timerWhite.stop();
    this.timerBlack.stop();
  }
}

class Piece {
  color: colors;
  id: string;
  isTaken: boolean;

  type: pieceTypes;
  imgUrl: string;
  isMoved: boolean;

  coordinates: coordinates;

  constructor(color: colors, type: pieceTypes, coordinates: coordinates) {
    this.id = uuidv4();
    this.isTaken = false;

    this.color = color;
    this.type = type;
    this.isMoved = false;

    this.imgUrl = createPieceImageUrl(type, color);

    this.coordinates = coordinates;
  }

  public static getLegalMovesByType(
    row: number,
    col: number,
    gameState: Board,
    type: pieceTypes,
    color: colors,
    isAttack = false
  ): coordinates[] {
    const availiableDirections =
      this.getAvailiableMovementDirectionsByType(type);

    const initialValue: coordinates[] = [];

    return availiableDirections.directions.reduce((acc, direction) => {
      let destinationSquare: coordinates | null;

      switch (availiableDirections.movementType) {
        case MovementTypes.steps:
          destinationSquare = getCoordinatesByDirection(
            row,
            col,
            direction,
            availiableDirections.stepCount
          );
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

      const availiableCoordinates = getAvaiableSquare(
        gameState,
        destinationSquare,
        direction,
        color,
        availiableDirections.movementType === MovementTypes.singleSquare,
        isAttack
      );

      if (!availiableCoordinates) return acc;

      let coordinatesArray: coordinates[] = [];

      if (availiableDirections.movementType !== MovementTypes.singleSquare) {
        coordinatesArray = getCoordinatesPathArray(
          { row, col },

          availiableCoordinates,
          direction
        );
      } else {
        coordinatesArray = [availiableCoordinates];
      }

      return [...acc, ...coordinatesArray];
    }, initialValue);
  }

  public static getAvailiableMovementDirectionsByType = (
    type: pieceTypes,
    isMoved = false,
    isAttack = false
  ): AvailiableMovementDirections => {
    let availiableDirections: AvailiableMovementDirections;

    switch (type) {
      case pieceTypes.pawn:
        if (!isAttack) {
          availiableDirections = {
            directions: [colors.white ? Directions.up : Directions.down],
            movementType: MovementTypes.steps,
            stepCount: isMoved ? 1 : 2,
          };
        } else {
          availiableDirections = {
            directions: [
              colors.white ? Directions.upLeft : Directions.downLeft,
              colors.white ? Directions.upRight : Directions.downRight,
            ],
            movementType: MovementTypes.steps,
            stepCount: 1,
          };
        }

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
          stepCount: 1,
        };
        break;
    }

    return availiableDirections;
  };

  public getAvailiableMovementDirections = (
    isAttack = false
  ): AvailiableMovementDirections => {
    let availiableDirections: AvailiableMovementDirections;

    switch (this.type) {
      case pieceTypes.pawn:
        if (!isAttack) {
          availiableDirections = {
            directions: [
              this.color === colors.white ? Directions.up : Directions.down,
            ],
            movementType: MovementTypes.steps,
            stepCount: this.isMoved ? 1 : 2,
          };
        } else {
          availiableDirections = {
            directions: [
              this.color === colors.white
                ? Directions.upLeft
                : Directions.downLeft,
              this.color === colors.white
                ? Directions.upRight
                : Directions.downRight,
            ],
            movementType: MovementTypes.steps,
            stepCount: 1,
          };
        }

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
          stepCount: 1,
        };
        break;
    }

    return availiableDirections;
  };

  public getLegalMoves(gameState: Board, isAttack = false): coordinates[] {
    const { row, col } = this.coordinates;

    const availiableDirections = this.getAvailiableMovementDirections();

    const initialValue: coordinates[] = [];

    return availiableDirections.directions.reduce((acc, direction) => {
      let destinationSquare: coordinates | null;

      switch (availiableDirections.movementType) {
        case MovementTypes.steps:
          destinationSquare = getCoordinatesByDirection(
            row,
            col,
            direction,
            availiableDirections.stepCount
          );
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

      const availiableCoordinates = getAvaiableSquare(
        gameState,
        destinationSquare,
        direction,
        this.color,
        availiableDirections.movementType === MovementTypes.singleSquare,
        isAttack
      );

      if (!availiableCoordinates) return acc;

      let coordinatesArray: coordinates[] = [];

      if (availiableDirections.movementType !== MovementTypes.singleSquare) {
        coordinatesArray = getCoordinatesPathArray(
          { row, col },
          availiableCoordinates,
          direction
        );
      } else {
        coordinatesArray = [availiableCoordinates];
      }

      return [...acc, ...coordinatesArray];
    }, initialValue);
  }
}

class CountdownTimer {
  private duration: number;
  private currentTime: number;
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

export { CountdownTimer, BoardSquareImpl, GameImpl, PlayerImlp, Piece };
