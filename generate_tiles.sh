#!/bin/bash

set -ex

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
echo "Split into files for each constituent type"
node split_files.js

# Generate mbtiles
# -zg (zoom guess: optimized for best zoom levels to render)
# -pS (only simplify polygons at low zoom levels)
# -P (parallel process input file)
# -f (force: allow override of existing file)
# -o (output file)
for file in data/constituencies-*; do
  base=$(basename "$file" | sed 's/\.[^.]*$//')
  tippecanoe -zg -pS -P -f -o "./tiles/$base.mbtiles" "$file"
done
