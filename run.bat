@echo off

echo "Installing frontend dependencies..."
call npm install

echo "Installing backend dependencies..."
call cd server && npm install

echo "Starting backend server..."
start cmd /k "cd server && npm run dev"

echo "Starting frontend application..."
start cmd /k "npm run dev"

echo "Opening browser..."
start "" "http://localhost:8080"

exit