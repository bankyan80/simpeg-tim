#!/bin/bash
# Keep-alive script for Next.js dev server
# Automatically restarts the server if it crashes

LOG="/home/z/my-project/dev.log"

while true; do
  echo "[$(date)] Starting Next.js server..." >> "$LOG"
  cd /home/z/my-project
  npx next dev -p 3000 --webpack >> "$LOG" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 5s..." >> "$LOG"
  sleep 5
done
