#!/bin/bash

# Find and kill the process running on port 3000
PORT_3000_PID=$(lsof -ti :3000)
if [ ! -z "$PORT_3000_PID" ]; then
    echo "Stopping Node.js app on port 3000 (PID: $PORT_3000_PID)"
    kill -9 $PORT_3000_PID
else
    echo "No application running on port 3000"
fi

# Find and kill the process running on port 3001
PORT_3001_PID=$(lsof -ti :3001)
if [ ! -z "$PORT_3001_PID" ]; then
    echo "Stopping Node.js app on port 3001 (PID: $PORT_3001_PID)"
    kill -9 $PORT_3001_PID
else
    echo "No application running on port 3001"
fi

echo "Done."
