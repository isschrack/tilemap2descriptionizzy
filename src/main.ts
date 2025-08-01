import './style.css'

export interface Tile {
  id: number;
  image?: string; // Not currently used, but feel free to store a base64 image string here if needed
  description?: string; // Same as above, not currently used
  
  //neighboring tiles in each direction
  up?: Tile[];
  down?: Tile[];
  left?: Tile[];
  right?: Tile[];
}

////////**** EDIT THIS STUFF ****////////

/**
 * Updates each tile's neighbor arrays based on grid position and compatibility
 */
export function updateTileNeighbors(tiles: Tile[], cols: number): void {
  const rows = Math.ceil(tiles.length / cols);
  
  tiles.forEach((tile, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Initialize neighbor arrays
    tile.up = [];
    tile.down = [];
    tile.left = [];
    tile.right = [];
    
    // Check each direction for compatible neighbors
    if (row > 0) {
      const upTile = tiles[(row - 1) * cols + col];
      if (canTilesConnect(tile, upTile)) {
        tile.up.push(upTile);
      }
    }
    
    if (row < rows - 1) {
      const downTile = tiles[(row + 1) * cols + col];
      if (canTilesConnect(tile, downTile)) {
        tile.down.push(downTile);
      }
    }
    
    if (col > 0) {
      const leftTile = tiles[row * cols + (col - 1)];
      if (canTilesConnect(tile, leftTile)) {
        tile.left.push(leftTile);
      }
    }
    
    if (col < cols - 1) {
      const rightTile = tiles[row * cols + (col + 1)];
      if (canTilesConnect(tile, rightTile)) {
        tile.right.push(rightTile);
      }
    }
  });
}

/**
 * Checks if two tiles can connect to each other
 */
function canTilesConnect(tile1: Tile, tile2: Tile): boolean {
  // Missing images can connect to anything
  if (!tile1.image || !tile2.image) {
    return true;
  }
  
  // Transparent tiles can connect to anything
  if (isTileTransparent(tile1.image) || isTileTransparent(tile2.image)) {
    return true;
  }
  
  // Otherwise, allow connection if tiles are close in the original grid
  return Math.abs(tile1.id - tile2.id) <= 2;
}

/**
 * Checks if a tile is mostly transparent based on data size
 */
function isTileTransparent(imageData: string): boolean {
  const dataLength = imageData.length;
  const averageNonTransparentLength = 8000;
  return dataLength < averageNonTransparentLength * 0.7;
}


////////**** Code to take in a tileset and create array. Only edit if you need to ****////////

const imageInput = document.getElementById('imageInput') as HTMLInputElement;
const tileSizeInput = document.getElementById('tileSizeInput') as HTMLInputElement;
const processBtn = document.getElementById('processBtn') as HTMLButtonElement;

processBtn.onclick = () => {
  const file = imageInput.files?.[0];
  const tileSize = parseInt(tileSizeInput.value, 10);
  if (!file || isNaN(tileSize) || tileSize <= 0) {
    alert('Please select an image and enter a valid tile size.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const cols = Math.floor(img.width / tileSize);
      const rows = Math.floor(img.height / tileSize);
      const tiles: Tile[] = [];
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = tileSize;
      tempCanvas.height = tileSize;
      const tempCtx = tempCanvas.getContext('2d');
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          tempCtx?.clearRect(0, 0, tileSize, tileSize);
          tempCtx?.drawImage(
            img,
            x * tileSize,
            y * tileSize,
            tileSize,
            tileSize,
            0,
            0,
            tileSize,
            tileSize
          );
          const image = tempCanvas.toDataURL();
          tiles.push({
            id: y * cols + x,
            image
          });
        }
      }
      updateTileNeighbors(tiles, cols);
      console.log('Tiles:', tiles);
      alert(`Created ${tiles.length} tiles. Please check the console for details.`);
      //TODO - Thomas - Add code to validate results.
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};
