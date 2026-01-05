@echo off
echo "Installing dependencies..."
call npm install

echo "Starting the development server and opening the browser..."
start "" "http://localhost:8080"
call npm run dev
