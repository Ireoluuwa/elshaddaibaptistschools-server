DO $$ 
DECLARE 
    user_id uuid;
    class_id uuid;
    dept_id uuid;
    pwd_hash text := '$2b$10$zmvt.Qh4ugBZOZ7V.QrGJ.rg6sIGsct/3C12l272YKAMJqtV6sZJi';
BEGIN
    SELECT id INTO class_id FROM school_classes WHERE name = 'SS2';

    -- 26. Akintola Grace (Art)
    SELECT id INTO dept_id FROM departments WHERE name = 'Art';
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/026', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "departmentId", "dateOfBirth") 
    VALUES (user_id, 'Akintola', 'Grace', class_id, dept_id, '2008-01-01');

    -- 27. Esomojumi Feyikemi (Commercial)
    SELECT id INTO dept_id FROM departments WHERE name = 'Commercial';
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/027', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "departmentId", "dateOfBirth") 
    VALUES (user_id, 'Esomojumi', 'Feyikemi', class_id, dept_id, '2008-01-01');

    -- 28. Emmanuel Jochebed (Science)
    SELECT id INTO dept_id FROM departments WHERE name = 'Science';
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/028', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "departmentId", "dateOfBirth") 
    VALUES (user_id, 'Emmanuel', 'Jochebed', class_id, dept_id, '2008-01-01');

    -- 29. Abdulsalam Barki (Art)
    SELECT id INTO dept_id FROM departments WHERE name = 'Art';
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/029', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "departmentId", "dateOfBirth") 
    VALUES (user_id, 'Abdulsalam', 'Barki', class_id, dept_id, '2008-01-01');

    -- 30. Aremu Semilore (Art)
    SELECT id INTO dept_id FROM departments WHERE name = 'Art';
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/030', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "departmentId", "dateOfBirth") 
    VALUES (user_id, 'Aremu', 'Semilore', class_id, dept_id, '2008-01-01');

END $$;
