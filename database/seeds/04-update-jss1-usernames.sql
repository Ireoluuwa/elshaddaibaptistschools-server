-- Update usernames from EBS/STD/JSS1/XXX to EBS/STU/XXX
UPDATE users 
SET username = REPLACE(username, 'EBS/STD/JSS1/', 'EBS/STU/')
WHERE username LIKE 'EBS/STD/JSS1/%';

-- Also catch any that might have been EBS/STD/XXX just in case
UPDATE users 
SET username = REPLACE(username, 'EBS/STD/', 'EBS/STU/')
WHERE username LIKE 'EBS/STD/%';
