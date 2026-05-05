DO $$ 
DECLARE 
    user_id uuid;
    class_id uuid;
    pwd_hash text := '$2b$10$zmvt.Qh4ugBZOZ7V.QrGJ.rg6sIGsct/3C12l272YKAMJqtV6sZJi';
BEGIN
    -- Clear previously inserted students from the last attempt (if any)
    DELETE FROM users WHERE username LIKE 'EBS/STD/%';
    DELETE FROM users WHERE username LIKE 'EBS/STU/%';

    SELECT id INTO class_id FROM school_classes WHERE name = 'JSS1';

    -- 1. Adejumo Feranmi
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/001', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'Adejumo', 'Feranmi', class_id, '2016-02-03', 2024, 'N/A', 'Guardian', '0000000000');

    -- 2. Akande Oluwatobi
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/002', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'Akande', 'Oluwatobi', class_id, '2015-03-09', 2024, 'N/A', 'Guardian', '0000000000');

    -- 3. Effeomah David
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/003', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'Effeomah', 'David', class_id, '2015-02-01', 2024, 'N/A', 'Guardian', '0000000000');

    -- 4. Ezekel Daniel
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/004', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'Ezekel', 'Daniel', class_id, '2015-07-15', 2024, 'N/A', 'Guardian', '0000000000');

    -- 5. Gabriel samuel
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/005', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'Gabriel', 'samuel', class_id, '2014-05-17', 2024, 'N/A', 'Guardian', '0000000000');

    -- 6. John Tamilore
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/006', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'John', 'Tamilore', class_id, '2015-05-09', 2024, 'N/A', 'Guardian', '0000000000');

    -- 7. Nurudeen Tomiwa
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/007', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'Nurudeen', 'Tomiwa', class_id, '2015-05-08', 2024, 'N/A', 'Guardian', '0000000000');

    -- 8. Adeoye Oluwadarasimi
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/008', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'Adeoye', 'Oluwadarasimi', class_id, '2015-01-21', 2024, 'N/A', 'Guardian', '0000000000');

    -- 9. Ofem Goodness
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/009', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'Ofem', 'Goodness', class_id, '2014-08-26', 2024, 'N/A', 'Guardian', '0000000000');

    -- 10. Oyelami Esther
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/010', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth", "yearJoined", "homeAddress", "guardianName", "guardianPhone") 
    VALUES (user_id, 'Oyelami', 'Esther', class_id, '2012-03-22', 2024, 'N/A', 'Guardian', '0000000000');

END $$;
