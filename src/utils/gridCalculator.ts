export interface GridCalculationInput {
  pageWidthMm: number;
  pageHeightMm: number;
  photoWidthMm: number;
  photoHeightMm: number;
  spacingHorizontalMm: number;
  spacingVerticalMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  desiredCount: number;
}

export interface PhotoCellPosition {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  index: number;
}

export interface GridResult {
  cols: number;
  rows: number;
  maxCapacity: number;
  cells: PhotoCellPosition[];
  actualGridWidthMm: number;
  actualGridHeightMm: number;
  warning?: string;
}

export const calculateGrid = (input: GridCalculationInput): GridResult => {
  const usableWidth = input.pageWidthMm - input.marginLeftMm - input.marginRightMm;
  const usableHeight = input.pageHeightMm - input.marginTopMm - input.marginBottomMm;

  if (usableWidth <= 0 || usableHeight <= 0) {
    return { cols: 0, rows: 0, maxCapacity: 0, cells: [], actualGridWidthMm: 0, actualGridHeightMm: 0, warning: 'Margins exceed page size.' };
  }

  const cols = Math.floor((usableWidth + input.spacingHorizontalMm) / (input.photoWidthMm + input.spacingHorizontalMm));
  const rows = Math.floor((usableHeight + input.spacingVerticalMm) / (input.photoHeightMm + input.spacingVerticalMm));
  const maxCapacity = Math.max(0, cols * rows);

  if (maxCapacity === 0) {
    return {
      cols: 0,
      rows: 0,
      maxCapacity: 0,
      cells: [],
      actualGridWidthMm: 0,
      actualGridHeightMm: 0,
      warning: 'Photo size is larger than printable area. Adjust margins or page size.'
    };
  }

  const renderCount = Math.min(input.desiredCount, maxCapacity);
  const activeRows = Math.ceil(renderCount / cols);

  // Calculate bounding box for centering
  const actualGridWidthMm = cols > 1
    ? (cols * input.photoWidthMm) + ((cols - 1) * input.spacingHorizontalMm)
    : input.photoWidthMm;

  const actualGridHeightMm = activeRows > 1
    ? (activeRows * input.photoHeightMm) + ((activeRows - 1) * input.spacingVerticalMm)
    : input.photoHeightMm;

  // Center alignment within margins
  const startX = input.marginLeftMm + (usableWidth - actualGridWidthMm) / 2;
  const startY = input.marginTopMm;
// console.log(usableHeight)
//   const startX = input.marginLeftMm;
//   const startY = input.marginTopMm;

  const cells: PhotoCellPosition[] = [];
  for (let i = 0; i < renderCount; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const xMm = startX + c * (input.photoWidthMm + input.spacingHorizontalMm);
//     const yMm = 0;

    const yMm = startY + r * (input.photoHeightMm + input.spacingVerticalMm);

    cells.push({
      xMm,
      yMm,
      widthMm: input.photoWidthMm,
      heightMm: input.photoHeightMm,
      index: i
    });
  }

  return {
    cols,
    rows,
    maxCapacity,
    cells,
    actualGridWidthMm,
    actualGridHeightMm,
    warning: input.desiredCount > maxCapacity
      ? `Only ${maxCapacity} photos fit on this page. Decrease margins or spacing to fit more.`
      : undefined
  };
};