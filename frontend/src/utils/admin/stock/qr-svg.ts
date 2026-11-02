/**
 * Byte-mode QR (versions 1–4, level L). Enough for opaque stock codes.
 * No dependency — Docker frontend volume would miss a new package.
 */

type Version = 1 | 2 | 3 | 4;

const VERSION_SIZE = { 1: 21, 2: 25, 3: 29, 4: 33 } as const;
const VERSION_DATA = { 1: 19, 2: 34, 3: 55, 4: 80 } as const;
const VERSION_EC = { 1: 7, 2: 10, 3: 15, 4: 20 } as const;
const ALIGNMENT = { 1: [] as number[], 2: [18], 3: [22], 4: [26] } as const;

const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);

(() => {
  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = value;
    LOG[value] = i;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[(LOG[a] + LOG[b]) % 255];
}

function rsGenerator(count: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < count; i += 1) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGenerator(ecCount);
  const res = new Uint8Array(ecCount);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.copyWithin(0, 1);
    res[ecCount - 1] = 0;
    if (factor === 0) continue;
    for (let i = 0; i < ecCount; i += 1) {
      res[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return res;
}

function pickVersion(byteLength: number): Version {
  for (const version of [1, 2, 3, 4] as const) {
    const capacityBits = VERSION_DATA[version] * 8;
    const needed = 4 + 8 + byteLength * 8 + 4;
    if (needed <= capacityBits) return version;
  }
  throw new Error('QR payload is too long for version 4');
}

function encodeData(text: string, version: Version): Uint8Array {
  const bytes = new TextEncoder().encode(text);
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >> i) & 1);
  };

  push(0b0100, 4);
  push(bytes.length, 8);
  for (const byte of bytes) push(byte, 8);
  push(0, Math.min(4, VERSION_DATA[version] * 8 - bits.length));

  while (bits.length % 8 !== 0) bits.push(0);

  const data = new Uint8Array(VERSION_DATA[version]);
  for (let i = 0; i < data.length; i += 1) {
    let byte = 0;
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | (bits[i * 8 + j] ?? 0);
    data[i] = byte;
  }

  const pads = [0xec, 0x11];
  let padIndex = 0;
  const used = Math.ceil(bits.length / 8);
  for (let i = used; i < data.length; i += 1) {
    data[i] = pads[padIndex];
    padIndex = 1 - padIndex;
  }

  const ec = rsEncode(data, VERSION_EC[version]);
  const out = new Uint8Array(data.length + ec.length);
  out.set(data);
  out.set(ec, data.length);
  return out;
}

function formatBits(mask: number): number {
  const data = (0b01 << 3) | mask;
  let d = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((d >>> i) & 1) d ^= 0x537 << (i - 10);
  }
  return ((data << 10) | d) ^ 0x5412;
}

function applyFinder(grid: boolean[][], row: number, col: number): void {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || cc < 0 || rr >= grid.length || cc >= grid.length) continue;
      const inFive = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      const ring = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[rr][cc] = inFive && (ring || core);
    }
  }
}

function applyAlignment(grid: boolean[][], centers: readonly number[]): void {
  for (const row of centers) {
    for (const col of centers) {
      if ((row === 6 && col === 6) || (row === 6 && col === grid.length - 7) || (row === grid.length - 7 && col === 6)) {
        continue;
      }
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          grid[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        }
      }
    }
  }
}

function reserved(size: number, version: Version): boolean[][] {
  const mark = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const reserve = (r: number, c: number) => {
    if (r >= 0 && c >= 0 && r < size && c < size) mark[r][c] = true;
  };

  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) reserve(r, c);
  }
  for (let r = 0; r < 9; r += 1) {
    for (let c = size - 8; c < size; c += 1) reserve(r, c);
  }
  for (let r = size - 8; r < size; r += 1) {
    for (let c = 0; c < 9; c += 1) reserve(r, c);
  }
  for (let i = 0; i < size; i += 1) {
    reserve(6, i);
    reserve(i, 6);
  }
  for (const row of ALIGNMENT[version]) {
    for (const col of ALIGNMENT[version]) {
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) reserve(row + r, col + c);
      }
    }
  }
  return mark;
}

function maskBit(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
  }
}

function placeFormat(grid: boolean[][], mask: number): void {
  const bits = formatBits(mask);
  const size = grid.length;
  for (let i = 0; i < 15; i += 1) {
    const dark = ((bits >> (14 - i)) & 1) === 1;
    if (i < 6) grid[i][8] = dark;
    else if (i < 8) grid[i + 1][8] = dark;
    else grid[size - 15 + i][8] = dark;

    if (i < 8) grid[8][size - 1 - i] = dark;
    else if (i < 9) grid[8][15 - i] = dark;
    else grid[8][14 - i] = dark;
  }
  grid[size - 8][8] = true;
}

function buildMatrix(text: string): boolean[][] {
  const version = pickVersion(new TextEncoder().encode(text).length);
  const size = VERSION_SIZE[version];
  const grid = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const reservedMap = reserved(size, version);

  applyFinder(grid, 0, 0);
  applyFinder(grid, 0, size - 7);
  applyFinder(grid, size - 7, 0);
  applyAlignment(grid, ALIGNMENT[version]);

  for (let i = 8; i < size - 8; i += 1) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  const data = encodeData(text, version);
  const bitList: number[] = [];
  for (const byte of data) {
    for (let i = 7; i >= 0; i -= 1) bitList.push((byte >> i) & 1);
  }

  let bit = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let i = 0; i < size; i += 1) {
      const row = upward ? size - 1 - i : i;
      for (const c of [col, col - 1]) {
        if (reservedMap[row][c]) continue;
        grid[row][c] = bitList[bit] === 1;
        bit += 1;
      }
    }
    upward = !upward;
  }

  let bestMask = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestGrid = grid;

  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = grid.map((row) => row.slice());
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (!reservedMap[r][c] && maskBit(mask, r, c)) candidate[r][c] = !candidate[r][c];
      }
    }
    placeFormat(candidate, mask);
    const score = penalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
      bestGrid = candidate;
    }
  }

  void bestMask;
  return bestGrid;
}

function penalty(grid: boolean[][]): number {
  const size = grid.length;
  let score = 0;
  for (let r = 0; r < size; r += 1) {
    let run = 1;
    for (let c = 1; c < size; c += 1) {
      if (grid[r][c] === grid[r][c - 1]) run += 1;
      else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) score += 3 + (run - 5);
  }
  return score;
}

export function qrSvg(text: string, modulePx = 4): string {
  const matrix = buildMatrix(text);
  const quiet = 4;
  const dim = (matrix.length + quiet * 2) * modulePx;
  const rects: string[] = [];
  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix[r].length; c += 1) {
      if (!matrix[r][c]) continue;
      const x = (c + quiet) * modulePx;
      const y = (r + quiet) * modulePx;
      rects.push(`<rect x="${x}" y="${y}" width="${modulePx}" height="${modulePx}" />`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${dim}" height="${dim}" shape-rendering="crispEdges"><rect width="${dim}" height="${dim}" fill="#fff"/><g fill="#111">${rects.join('')}</g></svg>`;
}

export function qrDataUrl(text: string, modulePx = 4): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg(text, modulePx))}`;
}
