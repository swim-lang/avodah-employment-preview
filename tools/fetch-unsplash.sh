#!/bin/sh
# Fetch a curated Unsplash photo into the site's assets.
#   Usage: ./fetch-unsplash.sh "search terms" output-name.jpg [width]
# Uses the demo-tier key (50 req/hr). Unsplash requires photographer
# attribution when images ship publicly — credits are appended to
# assets/unsplash-credits.txt for each fetch.
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEY="$(cat "$DIR/tools/.unsplash-key")"
QUERY="$1"; OUT="$2"; WIDTH="${3:-2000}"; ORIENT="${4:-landscape}"

RESP=$(curl -s "https://api.unsplash.com/search/photos?query=$(echo "$QUERY" | sed 's/ /%20/g')&per_page=1&orientation=$ORIENT" \
  -H "Authorization: Client-ID $KEY")
URL=$(echo "$RESP" | python3 -I -c "import json,sys; d=json.loads(sys.stdin.read(), strict=False); print(d['results'][0]['urls']['raw'])")
PHOTOG=$(echo "$RESP" | python3 -I -c "import json,sys; d=json.loads(sys.stdin.read(), strict=False); r=d['results'][0]; print(r['user']['name'] + ' — https://unsplash.com/photos/' + r['id'])")
DL=$(echo "$RESP" | python3 -I -c "import json,sys; print(json.loads(sys.stdin.read(), strict=False)['results'][0]['links']['download_location'])")

curl -s "$URL&w=$WIDTH&q=80&fm=jpg" -o "$DIR/assets/$OUT"
# per API guidelines, ping the download endpoint
curl -s "$DL" -H "Authorization: Client-ID $KEY" > /dev/null
echo "$OUT: $PHOTOG (query: $QUERY)" >> "$DIR/assets/unsplash-credits.txt"
echo "saved assets/$OUT — photo by $PHOTOG"
