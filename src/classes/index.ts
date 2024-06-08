import {
  AvailiableMovementDirections,
  Board,
  BoardSquare,
  DirectionWithSteps,
  Directions,
  Game,
  MovementTypes,
  Piece,
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
  getPieceByCoordinates,
  getPreviousCoordinates,
  searchForPiece,
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
  attackers: {
    coordinate: coordinates;
    type: pieceTypes;
  }[];

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

  getLegalMoves(
    row: number,
    col: number,
    pieceType?: pieceTypes
  ): coordinates[] {
    const selectedPiece = getPieceByCoordinates(this.game.state, {
      row,
      col,
    });

    if (!selectedPiece) return [];

    const type = pieceType || selectedPiece.type;

    const gameState = this.game.state;

    if (this.attackers.length > 1 && type !== pieceTypes.king) return [];

    return selectedPiece.getLegalMoves(row, col, gameState);
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

    if (selectedPiece.type === pieceTypes.king) {
      this.kingColIndex = colIndex;
      this.kingRowIndex = rowIndex;
    }

    selectedPiece.isMoved = true;

    this.game.updateGameState(prevRowIndex, prevColIndex, rowIndex, colIndex);
  }

  updateGame(game: GameImpl): void {
    this.game = game;

    const attackers = this.getKingAttackers();

    if (attackers.length > 0) {
      this.attackers = attackers;
      this.isInCheck = true;
    } else {
      this.attackers = [];
      this.isInCheck = false;
    }
  }

  getKingAttackers() {
    const attackingPieceTypes: pieceTypes[] = Object.values(pieceTypes);

    const possibleAttackers = attackingPieceTypes
      .map((pieceType) => ({
        coordinates: this.getLegalMoves(
          this.kingRowIndex,
          this.kingColIndex,
          pieceType
        ),
        type: pieceType,
      }))
      .filter(({ coordinates, type }) =>
        coordinates.find((coordinate) => {
          const piece = getPieceByCoordinates(this.game.state, coordinate);

          if (!piece) return false;
          return piece.color !== this.color && piece.type === type;
        })
      );
    const initialValue: {
      coordinate: coordinates;
      type: pieceTypes;
    }[] = [];

    const attackers: {
      coordinate: coordinates;
      type: pieceTypes;
    }[] = possibleAttackers.reduce((acc, { coordinates, type }) => {
      const attackingPieceCoordinates = coordinates.find((coordinate) =>
        getPieceByCoordinates(this.game.state, coordinate)
      );

      if (!attackingPieceCoordinates) return acc;

      return [...acc, { type, coordinate: attackingPieceCoordinates }];
    }, initialValue);

    return attackers;
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

class PieceImpl implements Piece {
  color: colors;
  id: string;
  isTaken: boolean;

  type: pieceTypes;
  imgUrl: string;
  isMoved: boolean;

  constructor(
    color: colors,

    type: pieceTypes
  ) {
    this.id = uuidv4();
    this.isTaken = false;

    this.color = color;
    this.type = type;
    this.isMoved = false;

    this.imgUrl = createPieceImageUrl(type, color);
  }

  getAvailiableMovementDirections = (
    type = this.type,
    isAttack = false
  ): AvailiableMovementDirections => {
    let availiableDirections: AvailiableMovementDirections;

    switch (type) {
      case pieceTypes.pawn:
        if (!isAttack) {
          availiableDirections = {
            directions: [colors.white ? Directions.up : Directions.down],
            movementType: MovementTypes.steps,
            stepCount: this.isMoved ? 1 : 2,
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
          movementType: MovementTypes.singleSquare,
        };
        break;
    }

    return availiableDirections;
  };

  //make this a static method
  //get the selected piece by row and col

  getLegalMoves(
    row: number,
    col: number,
    gameState: Board,
    isAttack = false,
    type = this.type
  ): coordinates[] {
    const availiableDirections = this.getAvailiableMovementDirections(type);

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
          destinationSquare = searchForPiece(gameState, row, col, direction);
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
          direction,
          availiableCoordinates
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

export { CountdownTimer, BoardSquareImpl, GameImpl, PlayerImlp, PieceImpl };
