#!/bin/sh
# Takes one of the shared browser slots of the main checkout, runs the command, frees the slot:  sh tools/edge-slot.sh <command...>
# (rules: docs/prompts/redesign-agent-rules.md, "Parallel work in worktrees")
D="/c/Users/Yaniv Dudu/troll-math/shots"
slot=""
while [ -z "$slot" ]; do
  for n in 1 2 3; do
    f="$D/edge.lock.$n"
    if ( set -C; echo "pwa-apk $$" > "$f" ) 2>/dev/null; then slot="$f"; break; fi
  done
  [ -z "$slot" ] && sleep 20
done
"$@"; rc=$?
rm -f "$slot"
exit $rc
