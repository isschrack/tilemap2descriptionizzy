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
 * Given an array of tiles, update each tile's direction properties to indicate which tiles it can tile with in each direction.
 * @param tiles Array of Tile objects to update
 * @param tileSize The size of each tile in pixels
 */
export async function updateTileNeighbors(tiles: Tile[], tileSize: number = 16): Promise<void> {
  // Initialize neighbor arrays for all tiles
  tiles.forEach(tile => {
    tile.up = [];
    tile.down = [];
    tile.left = [];
    tile.right = [];
  });

  if (tiles.length === 0) return;

  // Extract edge colors for all tiles
  const tileEdges = new Map<number, EdgeColors>();
  
  for (const tile of tiles) {
    if (tile.image) {
      const edges = await extractEdgeColors(tile.image, tileSize);
      tileEdges.set(tile.id, edges);
    }
  }

  // Compare each tile with every other tile to find compatible neighbors
  tiles.forEach(tileA => {
    const edgesA = tileEdges.get(tileA.id);
    if (!edgesA) return;

    tiles.forEach(tileB => {
      if (tileA.id === tileB.id) return;
      
      const edgesB = tileEdges.get(tileB.id);
      if (!edgesB) return;

      // Check if tileB can be placed to the RIGHT of tileA
      // (tileA's right edge should match tileB's left edge)
      if (edgesMatch(edgesA.right, edgesB.left)) {
        tileA.right!.push(tileB);
      }

      // Check if tileB can be placed BELOW tileA
      // (tileA's bottom edge should match tileB's top edge)
      if (edgesMatch(edgesA.bottom, edgesB.top)) {
        tileA.down!.push(tileB);
      }

      // Check if tileB can be placed to the LEFT of tileA
      // (tileA's left edge should match tileB's right edge)
      if (edgesMatch(edgesA.left, edgesB.right)) {
        tileA.left!.push(tileB);
      }

      // Check if tileB can be placed ABOVE tileA
      // (tileA's top edge should match tileB's bottom edge)
      if (edgesMatch(edgesA.top, edgesB.bottom)) {
        tileA.up!.push(tileB);
      }
    });
  });
}

interface EdgeColors {
  top: number[][];
  bottom: number[][];
  left: number[][];
  right: number[][];
}

function extractEdgeColors(imageData: string, tileSize: number): Promise<EdgeColors> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve({ top: [], bottom: [], left: [], right: [] });
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, tileSize, tileSize);
        
        const imgData = ctx.getImageData(0, 0, tileSize, tileSize);
        const pixels = imgData.data;

        if (!pixels || pixels.length === 0) {
          resolve({ top: [], bottom: [], left: [], right: [] });
          return;
        }

        const top: number[][] = [];
        const bottom: number[][] = [];
        const left: number[][] = [];
        const right: number[][] = [];

        // Extract top and bottom edges
        for (let x = 0; x < tileSize; x++) {
          // Top edge (y = 0)
          const topIdx = (0 * tileSize + x) * 4;
          top.push([pixels[topIdx], pixels[topIdx + 1], pixels[topIdx + 2], pixels[topIdx + 3]]);
          
          // Bottom edge (y = tileSize - 1)
          const bottomIdx = ((tileSize - 1) * tileSize + x) * 4;
          bottom.push([pixels[bottomIdx], pixels[bottomIdx + 1], pixels[bottomIdx + 2], pixels[bottomIdx + 3]]);
        }

        // Extract left and right edges
        for (let y = 0; y < tileSize; y++) {
          // Left edge (x = 0)
          const leftIdx = (y * tileSize + 0) * 4;
          left.push([pixels[leftIdx], pixels[leftIdx + 1], pixels[leftIdx + 2], pixels[leftIdx + 3]]);
          
          // Right edge (x = tileSize - 1)
          const rightIdx = (y * tileSize + (tileSize - 1)) * 4;
          right.push([pixels[rightIdx], pixels[rightIdx + 1], pixels[rightIdx + 2], pixels[rightIdx + 3]]);
        }

        resolve({ top, bottom, left, right });
      } catch (error) {
        resolve({ top: [], bottom: [], left: [], right: [] });
      }
    };
    
    img.onerror = () => {
      resolve({ top: [], bottom: [], left: [], right: [] });
    };
    
    img.src = imageData;
  });
}

function edgesMatch(edge1: number[][], edge2: number[][], tolerance: number = 2): boolean {
  if (edge1.length !== edge2.length) return false;
  if (edge1.length === 0) return false;
  
  let exactMatches = 0;
  
  for (let i = 0; i < edge1.length; i++) {
    const [r1, g1, b1, a1] = edge1[i];
    const [r2, g2, b2, a2] = edge2[i];
    
    // Calculate color distance using Euclidean distance in RGBA space
    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2) + 
      Math.pow(a1 - a2, 2)
    );
    
    if (distance <= tolerance) {
      exactMatches++;
    }
  }
  
  // Require 98% of pixels to match very closely
  const matchRatio = exactMatches / edge1.length;
  return matchRatio >= 0.98;
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
      updateTileNeighbors(tiles, tileSize).then(() => {
        console.log('Tiles:', tiles);
        alert(`Created ${tiles.length} tiles. Please check the console for details.`);
        //TODO - Thomas - Add code to validate results.
      });
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};
