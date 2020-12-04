const fs = require('fs');
const readline = require('readline');

const FILE = './data/constituencies.geojson';

const constituent_types = {

};

let count = 0;
const start = async () => {
  const fileStream = fs.createReadStream(FILE);
  const reader = readline.createInterface({ input: fileStream });

  // create separate files for each type
  for await (const line of reader) {
    const json = JSON.parse(line);
    const type = json.properties['wof:association'];
    if (type) {
      constituent_types[type] = (constituent_types[type] || []).concat(line);
      count++;
    }
  }

  Object.keys(constituent_types).forEach((type) => {
    fs.writeFileSync(`./data/constituencies-${type}.geojson`, constituent_types[type].join('\n'));
  });
  console.log('done. Updated', count, 'records.');
};

start();
