export interface RatingProps {
  /** 0-5, may be fractional for display (rounded to the nearest star). */
  value: number;
  /** Omit for a read-only display; provide to make it a tappable 1-5 input. */
  onChange?: (rating: number) => void;
  size?: number;
}

export const STAR_COUNT = 5;
