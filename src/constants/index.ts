import { colors } from '../interfaces';

const boardWidth = 8;

const boardHeight = 8;

const opostiteColorMapping: { [key in colors]: colors } = {
  [colors.white]: colors.black,
  [colors.black]: colors.white,
};

export { boardHeight, boardWidth, opostiteColorMapping };
