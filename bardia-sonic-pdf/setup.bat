@echo off
echo Installing Bardia Sonic PDF...

echo Installing Python dependencies...
cd backend
pip install -r requirements.txt
cd ..

echo Installing Node dependencies...
npm install

echo Setup complete! Run 'npm run dev' to start the application.
pause 