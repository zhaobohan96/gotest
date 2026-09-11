const fs = require('fs');
const path = require('path');

const sgfDir = path.join(__dirname, '..', 'jueyi');
const outDir = path.join(__dirname, 'data');
const CHUNK_SIZE = 80;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const files = fs.readdirSync(sgfDir)
  .filter(f => f.endsWith('.sgf') && /^\d+\.sgf$/.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));

const allNums = files.map(f => parseInt(f));
const total = allNums.length;

// Generate manifest
const manifest = { total, chunks: [] };
const numChunks = Math.ceil(total / CHUNK_SIZE);

for (let i = 0; i < numChunks; i++) {
  const chunkNums = allNums.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
  const chunkData = {};
  for (const num of chunkNums) {
    chunkData[num] = fs.readFileSync(path.join(sgfDir, `${num}.sgf`), 'utf-8');
  }
  const chunkFile = `chunk-${i}.json`;
  fs.writeFileSync(path.join(outDir, chunkFile), JSON.stringify(chunkData));
  manifest.chunks.push({
    file: chunkFile,
    range: [chunkNums[0], chunkNums[chunkNums.length - 1]]
  });
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest));
console.log(`Generated ${total} problems in ${numChunks} chunks (CHUNK_SIZE=${CHUNK_SIZE})`);

const totalSize = manifest.chunks.reduce((s, c) => s + fs.statSync(path.join(outDir, c.file)).size, 0);
console.log(`Total data size: ${(totalSize / 1024).toFixed(1)} KB`);
console.log(`Manifest size: ${(fs.statSync(path.join(outDir, 'manifest.json')).size / 1024).toFixed(1)} KB`);
