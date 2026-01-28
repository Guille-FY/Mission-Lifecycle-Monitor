#!/bin/bash

# Mission Lifecycle Monitor - Start Script

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Mission Lifecycle Monitor Sequence...${NC}"

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${RED}STOPPING Mission and cleaning up...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Stopping Flight Computer (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}Stopping Mission Control (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
    fi

    # Stop Docker containers
    docker-compose -f ground-station/docker-compose.yaml down

    echo -e "${GREEN}Mission terminated. All processes and containers closed.${NC}"
    exit
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

# 1. Start Ground Station (Infrastructure)
echo -e "${CYAN}Step 1: Launching Ground Station (Docker Infrastructure)...${NC}"
docker-compose -f ground-station/docker-compose.yaml up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Ground Station started successfully.${NC}"
else
    echo -e "${RED}Failed to start Ground Station. Please ensure Docker is running.${NC}"
    exit 1
fi

# Wait for services
echo -e "${YELLOW}Waiting 5 seconds for services to warm up...${NC}"
sleep 5

# 2. Start Flight Computer (Backend)
echo -e "${CYAN}Step 2: Launching Flight Computer (Backend)...${NC}"
# Run in background and redirect output to a file or /dev/null to keep terminal clean-ish?
# Or letting it output to stdout but formatted?
# Windows script opens new windows. Here we'll run in background but maybe noisy.
# Let's redirect logs to temporary files for cleaner experience, or just /dev/null if not important.
# User's windows script shows output in new windows.
# I will output to log files.
node --require ./flight-computer/instrumentation.js flight-computer/app.js > flight-computer.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Flight Computer launched (PID: $BACKEND_PID). Logs: ./flight-computer.log${NC}"

# 3. Start Mission Control (Frontend)
echo -e "${CYAN}Step 3: Launching Mission Control (Frontend)...${NC}"
cd mission-control
npm run dev > ../mission-control.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}Mission Control launched (PID: $FRONTEND_PID). Logs: ./mission-control.log${NC}"

echo -e "${MAGENTA}All systems initiated! Go to http://localhost:3000 to view Mission Control.${NC}"
echo ""
echo -e "${RED}${YELLOW}PRESS ENTER TO STOP THE MISSION AND SHUTDOWN DOCKER...${NC}"

# Wait for user input
read -p ""

cleanup
