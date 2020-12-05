# US Constituency Vector Tiles

This repo contains scripts for generating vector tiles of all US constituencies, based on data from [Who's On First](https://www.whosonfirst.org/). 

The data used here is potentially out of date or incomplete. This code is mainly for educational purposes.

## Setup

These scripts assume a few basic dependencies. Most of these can be installed through [Homebrew](https://brew.sh/) on a Mac.
```bash
node wget sqlite3 bunzip2 tippecanoe
```

There are also some node dependencies, so dont for get to
```
npm install
```

## Usage

### Generate MBTiles
The script `generate_tiles.sh` will take care of downloading and processing the data into an `.mbtiles` file. The general steps are
* Download whosonfirst constituency data
* Extract the GeoJSON using `sqlite3`
* Post-process the data with `./generate_layers.js` to add tippecanoe metadata
* Run `tippecanoe` on the GeoJSON to output an `.mbtiles` file

Once done, the generated `.mbtiles` file will be in the `./tiles` folder. You can find the additional downloaded and processed files in `./data`.

### Serve vector tiles
Once the MBTiles have been generated, you can start the node server to server:
```
node server.js
```

Going to http://localhost:3030 should serve the `index.html` file, that will render the tileset using [Mapbox GL](https://github.com/mapbox/mapbox-gl-js)

![image](https://user-images.githubusercontent.com/814934/101223635-76061a00-365a-11eb-9842-63ae7daa98af.png)

There is also a view with a Mapbox basemap at http://localhost:3030/basemap. You will need to add the `MAPBOX_ACCESS_TOKEN` variable to a `.env` file (env variables are being loaded via [dotenv](https://github.com/motdotla/dotenv#readme)).

![image](https://user-images.githubusercontent.com/814934/101245366-64645700-36da-11eb-986c-537bc22c4ada.png)

## Attribution
Thanks to [Geocode Earth](https://geocode.earth/) for graciously building and hosing the whosonfirst data

Most of the server-related code was inspired by [Tileserver GL](https://github.com/maptiler/tileserver-gl)
