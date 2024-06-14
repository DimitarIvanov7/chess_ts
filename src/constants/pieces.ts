import { colors, pieceNotation, pieceTypes } from '../interfaces';

const sufficientMaterialTypes: pieceTypes[] = [
  pieceTypes.queen,
  pieceTypes.pawn,
  pieceTypes.rook,
];

const colIndexToLetterMapping: { [key: number]: string } = {
  7: 'h',
  6: 'g',
  5: 'f',
  4: 'e',
  3: 'd',
  2: 'c',
  1: 'b',
  0: 'a',
};

const lettertoColIndexMapping: { [key: string]: number } = {
  h: 7,
  g: 6,
  f: 5,
  e: 4,
  d: 3,
  c: 2,
  b: 1,
  a: 0,
};

const piecesToNotationMapping: { [key in pieceTypes]: string } = {
  [pieceTypes.king]: pieceNotation.k,
  [pieceTypes.queen]: pieceNotation.q,
  [pieceTypes.bishop]: pieceNotation.b,
  [pieceTypes.knight]: pieceNotation.n,
  [pieceTypes.rook]: pieceNotation.r,
  [pieceTypes.pawn]: pieceNotation.p,
};

const notationToPieceMapping = {
  [pieceNotation.k]: pieceTypes.king,
  [pieceNotation.q]: pieceTypes.queen,
  [pieceNotation.b]: pieceTypes.bishop,
  [pieceNotation.n]: pieceTypes.knight,
  [pieceNotation.r]: pieceTypes.rook,
  [pieceNotation.p]: pieceTypes.pawn,
};

const colorToImageUrlMapping: { [key in colors]: string } = {
  [colors.white]: 'l',
  [colors.black]: 'd',
};

export {
  sufficientMaterialTypes,
  colIndexToLetterMapping,
  colorToImageUrlMapping,
  piecesToNotationMapping,
  notationToPieceMapping,
  lettertoColIndexMapping,
};
