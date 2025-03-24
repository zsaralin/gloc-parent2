@echo off
title Vite Preview

cd /d C:\Users\admin\IdeaProjects\gloc-parent2\gloc\gloc-fe

:: Step 2: Start the Vite preview server
start "Vite Preview" cmd /k npm run preview

:: Step 2: Wait for the server to start (adjust the time if needed)
timeout /t 5 /nobreak

:: Step 3: Open Chrome with the correct URL (update if needed)
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --new-window http://localhost:4173

:: Step 4: Wait for Chrome to open
timeout /t 2 /nobreak

:: Step 5: Send F11 for fullscreen
powershell -Command "$wshell = New-Object -ComObject wscript.shell; Start-Sleep -s 1; $wshell.SendKeys('{F11}')"

:: Step 6: Wait a moment before refreshing
timeout /t 1 /nobreak

:: Step 7: Send F5 to refresh
powershell -Command "$wshell.SendKeys('{F5}')"

exit
