const fs = require('fs');
const readline = require('readline');
const turf = require('@turf/meta');

// const FILE = './data/constituencies-with-layers.geojson';
const FILE = '../ckochis/data/constituencies.json';

let sum = 0;

console.log('Counting points in geojson file');

let interval = setInterval(() => {
  console.log(sum, 'points so far');
}, 3000);

const start = async () => {
  const fileStream = fs.createReadStream(FILE);
  const reader = readline.createInterface({ input: fileStream });

  // add custom tippecanoe metadata for splitting the
  // different constituent types into their own layers
  for await (const line of reader) {
    const json = JSON.parse(line);
    turf.coordEach(json, (c) => {
      sum++;
    });
  }

  console.log('done. Total points:', sum);
  clearInterval(interval);
};

start();
