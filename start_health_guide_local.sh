#!/bin/bash

# Define directories
BACKEND_DIR="/mnt/4BC9EBFC28ECC8F5/Others/Projects/Health_Guide/backend"
FRONTEND_DIR="/mnt/4BC9EBFC28ECC8F5/Others/Projects/Health_Guide/frontend"

# Function to get the local network IP address
get_local_ip() {
    ip route get 1.1.1.1 | awk \'{print $NF; exit}\'
}

LOCAL_IP=$(get_local_ip)

echo "Starting Health Guide application..."
echo "Local IP detected: ${LOCAL_IP}"

# Start backend
echo "Starting backend (Django dev server) on http://0.0.0.0:8000..."
echo "Backend accessible at: http://${LOCAL_IP}:8000"
cd "$BACKEND_DIR" || { echo "Failed to navigate to backend directory."; exit 1; }

# Apply migrations if any, and create a superuser if it's the first run
echo "Applying backend migrations and collecting static files..."
python manage.py migrate

# Start Django dev server in the background
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd - > /dev/null || { echo "Failed to return to previous directory."; exit 1; }

# Start frontend
echo "Starting frontend (Vite dev server) on http://0.0.0.0:5173..."
echo "Frontend accessible at: http://${LOCAL_IP}:5173"
cd "$FRONTEND_DIR" || { echo "Failed to navigate to frontend directory."; exit 1; }

# Install frontend dependencies if node_modules is not present
if [ ! -d "node_modules" ]; then
    echo "Frontend dependencies not found. Installing..."
    npm install
fi

# Start Vite dev server in the background, binding to all interfaces
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
cd - > /dev/null || { echo "Failed to return to previous directory."; exit 1; }

echo ""
echo "Health Guide services started successfully!"
echo "Backend running at: http://localhost:8000 (and http://${LOCAL_IP}:8000)"
echo "Frontend running at: http://localhost:5173 (and http://${LOCAL_IP}:5173)"
echo ""
echo "To stop the services, run: kill $BACKEND_PID $FRONTEND_PID"
echo "Or simply close this terminal if you ran it in the foreground without '&'."
echo ""

# Keep the script running to prevent the background processes from being killed immediately
# Wait for both processes to finish
wait $BACKEND_PID $FRONTEND_PID
