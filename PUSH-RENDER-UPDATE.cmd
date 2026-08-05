@echo off
setlocal EnableExtensions
title SpecCompare - Push Render Update
cd /d "%~dp0"

if not exist ".git" (
  echo ERROR: This folder is not connected to Git.
  echo Put the update files inside the existing SpecCompare project folder.
  pause
  exit /b 1
)

if not exist "frontend\index.html" (
  echo ERROR: frontend\index.html was not found.
  pause
  exit /b 1
)

echo Adding updated files...
git add --all
if errorlevel 1 goto :failed

git diff --cached --quiet
if not errorlevel 1 (
  echo No new changes were found.
  pause
  exit /b 0
)

echo Creating commit...
git commit -m "Fix member login and Firestore product images"
if errorlevel 1 goto :failed

echo Pushing to GitHub main...
git push origin main
if errorlevel 1 goto :failed

echo.
echo SUCCESS: GitHub was updated.
echo Render should deploy this commit automatically.
pause
exit /b 0

:failed
echo.
echo ERROR: Update failed.
echo Take a screenshot of this window.
pause
exit /b 1
