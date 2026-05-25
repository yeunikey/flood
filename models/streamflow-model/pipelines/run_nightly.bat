@echo off
setlocal
call C:\Users\user_pc\anaconda3\Scripts\activate.bat etl
cd /d C:\Users\user_pc\models_ETL\models_ETL_new
set DRY_RUN=

REM log folder
if not exist logs mkdir logs

REM timestamped log file (safe format)
for /f "tokens=1-3 delims=." %%a in ("%date%") do set d=%%c-%%b-%%a
for /f "tokens=1-2 delims=:" %%a in ("%time%") do set t=%%a%%b

python pipelines\run_nightly_all_models.py --n-days 10 --lag-days 5 > logs\nightly_%d%_%t%.log 2>&1

endlocal
