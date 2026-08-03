@echo off
setlocal EnableExtensions
title SpecCompare - Push Firebase Version to GitHub
cd /d "%~dp0"

echo This replaces branch main on:
echo https://github.com/poommpina-svg/speccompare
choice /C YN /N /M "Continue? [Y/N]: "
if errorlevel 2 exit /b 0

if exist ".git" rmdir /s /q ".git"
git init
git config user.name "poommpina-svg"
git config user.email "poommpina-svg@users.noreply.github.com"
git add -A
git commit -m "Switch SpecCompare database to Firebase Firestore"
git branch -M main
git remote add origin https://github.com/poommpina-svg/speccompare.git
git push -u origin main --force

if errorlevel 1 (
  echo ERROR: GitHub update failed.
  pause
  exit /b 1
)

echo SUCCESS: GitHub repository updated.
pause
