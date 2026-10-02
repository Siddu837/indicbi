@echo off
title IndicBI - Launching Voice-First BI & CRM Platform
echo ========================================================
echo        Starting IndicBI (बोल BI) Platform
echo ========================================================
echo.

cd /d "%~dp0backend"
echo [1/2] Starting FastAPI Backend on http://localhost:8001 ...
start "IndicBI Backend" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

timeout /t 3 /nobreak >nul

cd /d "%~dp0frontend"
echo [2/2] Starting Next.js Frontend on http://localhost:3000 ...
start "IndicBI Frontend" cmd /k "npm run dev"

timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo ========================================================
echo   IndicBI is LIVE!
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8001/docs
echo ========================================================
