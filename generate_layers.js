const fs = require('fs');
const readline = require('readline');

const FILE = './data/constituencies.geojson';

const constituentciesWithLayers = [];

const layerCounts = {}

console.log('Adding tippecanoe metadata for layers...');
const start = async () => {
  const fileStream = fs.createReadStream(FILE);
  const reader = readline.createInterface({ input: fileStream });

  // add custom tippecanoe metadata for splitting the
  // different constituent types into their own layers
  for await (const line of reader) {
    const json = JSON.parse(line);
    const type = json.properties['wof:association'];
    if (type) {
      json.tippecanoe = { "layer": type };
      constituentciesWithLayers.push(JSON.stringify(json));
      layerCounts[type] = (layerCounts[type] || 0) + 1;
    }
  }

  fs.writeFileSync(`./data/constituencies-with-layers.geojson`, constituentciesWithLayers.join('\n'));
  console.log('done. Records per layer: ', layerCounts);
};

start();
