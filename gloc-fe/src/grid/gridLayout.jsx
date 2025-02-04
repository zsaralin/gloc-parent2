// Exported variables to hold grid layout information
export let numTopRowItems = 0;
export let numBottomGridRows = 0;
export let numBottomGridCols = 0;
export let numTotalGridItems = 0;
export let topRowItemWidth = 0;
export let bottomGridItemSize = { width: 0, height: 0 }; // Combined into an object
function getViewportHeight() {
  const height = window.visualViewport?.height || window.innerHeight;
  console.log(`Viewport Height: ${height}px`);
  return height; // Now always returns an accurate height in pixels
}
// Configuration for row height based on screen orientation
const rowHeightConfig = {
  wideScreen: 0.4, // 40% of viewport height
  tallScreen: 0.25, // 25% of viewport height
};

function calculateTopRowHeight() {
  const isWideScreen = window.innerWidth > window.innerHeight;
  const heightFactor = isWideScreen
    ? rowHeightConfig.wideScreen
    : rowHeightConfig.tallScreen;
  const height = getViewportHeight() * heightFactor;
  document.documentElement.style.setProperty('--top-row-height', `${height}px`);
  return height; // Return the calculated height
}

export function calculateBottomGridLayout(containerWidth, containerHeight) {
  const targetAreaFraction = 1 / 30; // Each item occupies 1/30th of the area
  const itemAspectRatio = 9 / 12; // Aspect ratio for items
  const totalContainerArea = containerWidth * containerHeight;
  const targetItemArea = totalContainerArea * targetAreaFraction;

  // Calculate item dimensions based on target area and aspect ratio
  const approximateItemWidth = Math.sqrt(targetItemArea * itemAspectRatio);
  const approximateItemHeight = approximateItemWidth / itemAspectRatio;

  // Calculate number of columns and rows
  numBottomGridCols = Math.floor(containerWidth / approximateItemWidth);
  numBottomGridRows = Math.floor(containerHeight / approximateItemHeight);

  // Final dimensions for each item
  const finalItemWidth = containerWidth / numBottomGridCols;
  const finalItemHeight = containerHeight / numBottomGridRows;

  // Update bottomGridItemSize as an object
  bottomGridItemSize = {
    width: finalItemWidth,
    height: finalItemHeight,
  };
}

export function calculateTopRowLayout() {
  if (typeof window === 'undefined') {
    throw new Error(
      'Window object is not available. This function must be run in a browser environment.'
    );
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = getViewportHeight()

  const itemAspectRatio = 9 / 16; // Aspect ratio for items

  // Use the centralized row height configuration
  const isWideScreen = viewportWidth > viewportHeight;
  const videoAspectRatio = isWideScreen ? 12 / 9 : 8 / 12; // 16:9 for wide, 8:12 for long

  const rowHeightVh = isWideScreen
    ? rowHeightConfig.wideScreen * 100
    : rowHeightConfig.tallScreen * 100;
  const rowHeightPx = (rowHeightVh / 100) * viewportHeight;

  const videoWidth = rowHeightPx * videoAspectRatio;
  const remainingWidth = viewportWidth - videoWidth;

  const itemWidthPx = rowHeightPx * itemAspectRatio;

  // Calculate possible items and distribute space to avoid gaps
  const possibleNumItems = Math.floor(remainingWidth / itemWidthPx);
  const totalItemsWidth = possibleNumItems * itemWidthPx;
  const adjustedItemWidth = totalItemsWidth < remainingWidth 
    ? remainingWidth / possibleNumItems
    : itemWidthPx;

  numTopRowItems = Math.max(possibleNumItems, 0);

  document.documentElement.style.setProperty('--video-height', `${rowHeightVh}dvh`);
  document.documentElement.style.setProperty('--video-aspect-ratio', `${videoAspectRatio}`);

  topRowItemWidth = adjustedItemWidth;
}

export function arrangeGrid() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = getViewportHeight();

  // Calculate top row height
  const topRowHeight = calculateTopRowHeight();

  // Calculate top row layout
  calculateTopRowLayout();

  // Calculate bottom grid layout using remaining height
  const bottomContainerHeight = viewportHeight - topRowHeight;
  calculateBottomGridLayout(viewportWidth, bottomContainerHeight);

  // Update total grid items
  numTotalGridItems =
    numTopRowItems + numBottomGridRows * numBottomGridCols;

  console.log(`Top Row Items: ${numTopRowItems}`);
  console.log(`Bottom Rows: ${numBottomGridRows}, Columns: ${numBottomGridCols}`);
}
