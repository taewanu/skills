#!/bin/sh
command -v jq >/dev/null 2>&1 || { printf 'statusline: jq required'; exit 0; }
LC_ALL=C
export LC_ALL

input=$(cat)
now=$(date +%s)

# Fable weekly is absent from statusline stdin, so it comes from the OAuth usage
# endpoint: cached 300s and refreshed in the background because the endpoint 429s
# aggressively and the statusline must never wait on the network.
CACHE="$HOME/.claude/usage-scoped.json"
# The fallback version is a harmless spoof: the endpoint only rate-limits harder without a client-like UA.
cc_ver=$(echo "$input" | jq -r '.version // "2.1.229"')
cache_mtime=$(stat -f %m "$CACHE" 2>/dev/null || stat -c %Y "$CACHE" 2>/dev/null || echo 0)
cache_age=$(( now - cache_mtime ))
inflight=$(find "${CACHE%/*}" -maxdepth 1 -name "${CACHE##*/}.tmp.*" -mmin -1 2>/dev/null | head -1)
if [ "$cache_age" -gt 300 ] && [ -z "$inflight" ]; then
  (
    TOKEN=$(security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null | jq -r '.claudeAiOauth.accessToken // empty')
    [ -z "$TOKEN" ] && TOKEN=$(jq -r '.claudeAiOauth.accessToken // empty' "$HOME/.claude/.credentials.json" 2>/dev/null)
    if [ -n "$TOKEN" ]; then
      tmp="$CACHE.tmp.$$"
      curl -sS --max-time 10 https://api.anthropic.com/api/oauth/usage \
        -H "Authorization: Bearer $TOKEN" \
        -H "anthropic-beta: oauth-2025-04-20" \
        -H "User-Agent: claude-code/$cc_ver" \
        -o "$tmp" 2>/dev/null \
      && jq -e '.limits' "$tmp" >/dev/null 2>&1 \
      && mv "$tmp" "$CACHE"
      rm -f "$tmp"
    fi
  ) >/dev/null 2>&1 &
fi

used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // 0')

# input_tokens is only the non-cached portion; the cache fields complete the real total.
cur_tokens=$(echo "$input" | jq -r '
  (.context_window.current_usage.input_tokens // 0)
  + (.context_window.current_usage.cache_creation_input_tokens // 0)
  + (.context_window.current_usage.cache_read_input_tokens // 0)
')
tok_k=$(awk -v t="$cur_tokens" 'BEGIN { if (t + 0 == 0) printf "0"; else printf "%.1fk", t / 1000 }')

sep='  \033[2;38;5;244m\302\267\033[0m  '

model_name=$(echo "$input" | jq -r '.model.display_name // empty')
if [ -n "$model_name" ]; then
  printf '\033[2m%s\033[0m' "$model_name"
  printf "$sep"
fi

# The context count is its own gauge: the number walks the zones (ocean <=50, amber <=75, ember >75).
ctx_c=$(awk -v p="$used_pct" 'BEGIN { print (p > 75) ? 202 : (p > 50) ? 214 : 33 }')
printf '\033[1;38;5;%sm%s\033[0m \033[2m(%.1f%%)\033[0m' "$ctx_c" "$tok_k" "$used_pct"

# Zoned 4/2/2 gauge whose unfilled cells keep a dimmed zone tint so the zones read at any fill.
bar() {
  awk -v pct="$1" -v label="$2" -v reset="$3" -v now="$4" 'BEGIN{
    w = 8
    p = pct + 0; if (p < 0) p = 0; if (p > 100) p = 100
    filled = int(p * w / 100 + 0.5)
    printf "\033[2m%s\033[0m ", label
    for (i = 1; i <= w; i++) {
      zone = (i <= 4) ? 33 : (i <= 6) ? 214 : 202
      mark = (i <= 4) ? 25 : (i <= 6) ? 136 : 130
      if (i <= filled) printf "\033[38;5;%dm\342\226\260", zone
      else printf "\033[38;5;%dm\342\226\261", mark
    }
    pc = (p > 75) ? 202 : (p > 50) ? 214 : 33
    printf "\033[0m \033[38;5;%dm%d%%\033[0m", pc, int(p + 0.5)
    if (reset != "" && reset + 0 > now + 0) {
      rem = reset - now
      # Rounded within the floor-chosen unit, carrying up at the boundary (59m30s -> 1h),
      # so the countdown never understates by nearly a whole unit the way plain floor did.
      if (rem >= 86400) t = int(rem / 86400 + 0.5) "d"
      else if (rem >= 3600) { h = int(rem / 3600 + 0.5); t = (h == 24) ? "1d" : h "h" }
      else { m = int(rem / 60 + 0.5); t = (m == 60) ? "1h" : m "m" }
      printf " \033[2m\342\206\273%s\033[0m", t
    }
  }'
}

five=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
week=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
five_r=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
week_r=$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // empty')

# resets_at in the cache is UTC ISO8601; parse via BSD date, then GNU date
iso2epoch() {
  date -j -u -f "%Y-%m-%dT%H:%M:%S" "$(printf '%.19s' "$1")" +%s 2>/dev/null \
    || date -u -d "$1" +%s 2>/dev/null
}

# The cache (same endpoint as the /usage panel, at most 300s old) outranks the stdin
# snapshot, which only refreshes when a new API response arrives.
# fb resets together with wk (both weekly), so it carries no countdown of its own.
fable=""
if [ -f "$CACHE" ]; then
  five_c=$(jq -r '[.limits[]? | select(.kind == "session")][0].percent // empty' "$CACHE" 2>/dev/null)
  week_c=$(jq -r '[.limits[]? | select(.kind == "weekly_all")][0].percent // empty' "$CACHE" 2>/dev/null)
  fable=$(jq -r '[.limits[]? | select(.kind == "weekly_scoped" and (.scope.model.display_name // "" | test("Fable")))][0].percent // empty' "$CACHE" 2>/dev/null)
  if [ -n "$five_c" ]; then
    five="$five_c"
    five_r_iso=$(jq -r '[.limits[]? | select(.kind == "session")][0].resets_at // empty' "$CACHE" 2>/dev/null)
    [ -n "$five_r_iso" ] && five_r=$(iso2epoch "$five_r_iso")
  fi
  if [ -n "$week_c" ]; then
    week="$week_c"
    week_r_iso=$(jq -r '[.limits[]? | select(.kind == "weekly_all")][0].resets_at // empty' "$CACHE" 2>/dev/null)
    [ -n "$week_r_iso" ] && week_r=$(iso2epoch "$week_r_iso")
  fi
fi

if [ -n "$five" ];  then printf "$sep"; bar "$five"  "5h" "$five_r" "$now"; fi
if [ -n "$week" ];  then printf "$sep"; bar "$week"  "wk" "$week_r" "$now"; fi
if [ -n "$fable" ]; then printf "$sep"; bar "$fable" "fb" ""       "$now"; fi
