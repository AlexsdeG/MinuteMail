#!/bin/bash

# Ports to check and kill
PORTS=(3000 3010)

echo "Checking for processes on ports: ${PORTS[*]}"

for PORT in "${PORTS[@]}"
do
    # Check if anything is running on the port
    PID=$(lsof -t -i:$PORT)
    
    if [ -z "$PID" ]; then
        echo "Port $PORT is already free."
    else
        echo "Port $PORT is in use by PID(s): $PID"
        echo "Killing processes..."
        # Kill all PIDs found for this port
        kill -9 $PID 2>/dev/null
        
        # Check if kill was successful
        if [ $? -eq 0 ]; then
            echo "Successfully freed port $PORT."
        else
            echo "Failed to kill processes on port $PORT. You might need sudo."
        fi
    fi
done

echo "Done."
