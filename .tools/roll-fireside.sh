#!/usr/bin/env bash
# Roll the Fireside banner to the next first-Thursday-of-the-month at 12:00pm ET.
# Idempotent: only edits + commits + pushes when the stored date has passed.
# Run weekly (wired into the sunday-briefing skill). macOS/BSD date.
set -euo pipefail

cd "$(dirname "$0")/.."          # repo root (love-ando)
YML="_data/fireside.yml"

# First Thursday (day-of-month) of a given year/month. %u: Mon=1..Sun=7, Thu=4.
first_thursday() {
  local y="$1" m="$2" d wd
  for d in 1 2 3 4 5 6 7; do
    wd=$(date -j -f "%Y-%m-%d" "$(printf '%04d-%02d-%02d' "$y" "$m" "$d")" "+%u")
    [ "$wd" = "4" ] && { echo "$d"; return; }
  done
}

now=$(date "+%s")
Y=$((10#$(date "+%Y"))); M=$((10#$(date "+%m")))

d=$(first_thursday "$Y" "$M")
# Epoch of 12:00 that day, interpreted in Eastern (DST-aware via TZ).
ft=$(TZ=America/New_York date -j -f "%Y-%m-%d %H:%M:%S" \
     "$(printf '%04d-%02d-%02d 12:00:00' "$Y" "$M" "$d")" "+%s")
if [ "$ft" -lt "$now" ]; then          # this month's already passed -> next month
  M=$((M + 1)); [ "$M" -gt 12 ] && { M=1; Y=$((Y + 1)); }
  d=$(first_thursday "$Y" "$M")
  ft=$(TZ=America/New_York date -j -f "%Y-%m-%d %H:%M:%S" \
       "$(printf '%04d-%02d-%02d 12:00:00' "$Y" "$M" "$d")" "+%s")
fi

date_display=$(date -r "$ft" "+Thursday, %b %e · 12:00pm ET" | tr -s ' ')
start_utc=$(date -u -r "$ft" "+%Y%m%dT%H%M%SZ")
end_utc=$(date -u -r "$((ft + 3600))" "+%Y%m%dT%H%M%SZ")
cal_url="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Love%2C%20Ando%20%E2%80%94%20Fireside%20Chat&dates=${start_utc}%2F${end_utc}&details=Monthly%20Fireside%20Chat%20with%20Ando.%20RSVP%20at%20https%3A%2F%2Floveando.org%2Ffireside&location=Fireside"

current=$(grep -E '^date_display:' "$YML" | sed -E 's/^date_display: *"(.*)"/\1/')
if [ "$current" = "$date_display" ]; then
  echo "Fireside already current: $current"
  exit 0
fi

# Update only these two lines; preserve rsvp_url and everything else.
D="$date_display" C="$cal_url" perl -i -pe '
  BEGIN{ $d=$ENV{D}; $c=$ENV{C} }
  s{^date_display: .*}{date_display: "$d"};
  s{^add_to_calendar_url: .*}{add_to_calendar_url: "$c"};
' "$YML"

git add "$YML"
git commit -m "Fireside: roll banner to next chat ($date_display)"
git push origin main
echo "Rolled fireside: $current -> $date_display"
