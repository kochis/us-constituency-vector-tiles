#!/bin/bash

set -ex

# required dependencies: wget bunzip2 sqlite3 node tippecanoe

mkdir ./data ./tiles

# Download constituency shapes from whos-on-first
if [ ! -f ./data/whosonfirst-data-constituency-us-latest.db ]; then
  echo "Downloading data"
  wget -O ./data/whosonfirst-data-constituency-us-latest.db.bz2 https://data.geocode.earth/wof/dist/sqlite/whosonfirst-data-constituency-us-latest.db.bz2 
  bunzip2 ./data/whosonfirst-data-constituency-us-latest.db.bz2
fi

# Extract GeoJSON from db
echo "Extracting whosonfirst us-constituency data"
sqlite3 ./data/whosonfirst-data-constituency-us-latest.db "select body from geojson" > ./data/constituencies.geojson

# Update geojson records with layer info
echo "Adding layer info to json"
node generate_layers.js

# Generate mbtiles
# -z 10 (maxzoom 10)
# -Z 0 (minzoom 0)
# -r1 (dont drop points)
# -P (parallel process input file)
# -pf (no feature limit)
# -pk (no point limit)
# -f (force: allow override of existing file)
# -o (output file)
tippecanoe -z 10 -Z 0 -r1 -P -pf -pk -f -o "./tiles/us-constituencies.mbtiles" "data/constituencies-with-layers.geojson"
