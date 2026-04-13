@echo off
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p mychamber_db < migrations\add_schedule_date_range.sql
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p mychamber_db < migrations\add_profile_image_to_users.sql
pause
