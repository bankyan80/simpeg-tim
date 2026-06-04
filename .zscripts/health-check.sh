#!/bin/bash
# Check if Next.js server is running, start if not
if ! pgrep -f "next dev -p 3000 --webpack" > /dev/null 2>&1; then
  echo "[$(date)] Server not running, starting..." >> /home/z/my-project/health-check.log
  cd /home/z/my-project
  nohup npx next dev -p 3000 --webpack >> /home/z/my-project/dev.log 2>&1 &
  echo "[$(date)] Server started with PID $!" >> /home/z/my-project/health-check.log
else
  echo "[$(date)] Server is running" >> /home/z/my-project/health-check.log
fi
