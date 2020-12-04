const environment = process.env.NODE_ENV;
const port = process.env.PORT || 3030;
const isDev = environment === 'development';

const fs = require('fs');
const path = require('path');
const request = require('request');
const zlib = require('zlib');

const clone = require('clone');
const express = require('express');
const Pbf = require('pbf');
const MBTiles = require('@mapbox/mbtiles');
const VectorTile = require('@mapbox/vector-tile').VectorTile;

const TILES = './tiles/constituencies-state-houes.mbtiles';

const startServer = async () => {
  const mbtilesFile = path.resolve(process.cwd(), TILES);

  const mbtilesStats = fs.statSync(mbtilesFile);
  if (!mbtilesStats.isFile() || mbtilesStats.size === 0) {
    console.log(`ERROR: Not valid MBTiles file: ${mbtilesFile}`);
    process.exit(1);
  }

  // Load MBTiles
  const tiles = new MBTiles(mbtilesFile, (err) => {
    if (err) {
      console.error(err);
      console.log('ERROR: Unable to open MBTiles.');
      console.log(`       Make sure ${path.basename(mbtilesFile)} is valid MBTiles.`);
      process.exit(1);
    }

    tiles.getInfo((err, tileInfo) => {
      if (err || !tileInfo) {
        console.error(err);
        console.log('ERROR: Metadata missing in the MBTiles.');
        console.log(`       Make sure ${path.basename(mbtilesFile)} is valid MBTiles.`);
        process.exit(1);
      }

      console.log('Tiles loaded:', tileInfo);

      const app = express();

      // serve style for map
      app.get('/:theme/style.json', (req, res, next) => {
        res.header("Content-Type",'application/json');
        res.sendFile(path.join(__dirname, `/styles/${req.params.theme}/style.json`));
      });

      // serve tile info
      app.get('/:id.json', (req, res, next) => {
        const info = clone(tileInfo);

        // set url for fetching tiles
        info.tiles = [`http://localhost:3030/{z}/{x}/{y}.${tileInfo.format}`];
        return res.json(info);
      });

      // handle tile requests in /z/x/y format
      app.get('/:z(\\d+)/:x(\\d+)/:y(\\d+).:format([\\w.]+)', (req, res, next) => {
        let { x, y, z, format } = req.params;

        // convert to int and truncate
        x = x | 0;
        y = y | 0;
        z = z | 0;

        // check given format is supported by tileset
        if (format !== tileInfo.format && format !== 'geojson') {
          return res.status(404).send(`Unsupported format: ${format}`);
        }

        // check valid bounds
        if (z < tileInfo.minzoom || x < 0 || y < 0 || z > tileInfo.maxzoom || x >= Math.pow(2, z) || y >= Math.pow(2, z)) {
          return res.status(404).send('Out of bounds');
        }

        // lookup tile in tileset
        tiles.getTile(z, x, y, (err, tileData, headers) => {
          if (err) {
            if (/does not exist/.test(err.message)) {
              return res.status(204).send();
            } else {
              return res.status(500).send(err.message);
            }
          }

          if (tileData == null) {
            return res.status(404).send('Not found');
          }

          // check if tile data is gzipped
          let isGzipped;
          if (tileInfo.format === 'pbf') {
            isGzipped = tileData.slice(0, 2).indexOf(Buffer.from([0x1f, 0x8b])) === 0;
          }

          // if request is for geojson data, convert the pbf data to GeoJSON
          if (format === 'geojson') {
            if (isGzipped) {
              tileData = zlib.unzipSync(tileData);
              isGzipped = false;
            }

            const tile = new VectorTile(new Pbf(tileData));
            const geojson = {
              "type": "FeatureCollection",
              "features": []
            };
            for (let layerName in tile.layers) {
              const layer = tile.layers[layerName];
              for (let i = 0; i < layer.length; i++) {
                const feature = layer.feature(i);
                const featureGeoJSON = feature.toGeoJSON(x, y, z);
                featureGeoJSON.properties.layer = layerName;
                geojson.features.push(featureGeoJSON);
              }
            }
            tileData = JSON.stringify(geojson);
          }

          // if request for pbf, no need to do additional parsing, can send pbf to client
          if (format === 'pbf') {
            headers['Content-Type'] = 'application/x-protobuf';
          }

          // if data is not compressed (such as when converting to geojson)
          // gzip data before sending response
          if (!isGzipped) {
            data = zlib.gzipSync(tileData);
          }

          headers['Content-Encoding'] = 'gzip';
          res.set(headers);

          return res.status(200).send(tileData);
        });
      });

      app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
      });

      app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`)
      });
    });
  });
}

startServer();
