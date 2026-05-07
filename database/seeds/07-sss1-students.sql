DO $$ 
DECLARE 
    user_id uuid;
    class_id uuid;
    dept_id uuid;
    pwd_hash text := '$2b$10$zmvt.Qh4ugBZOZ7V.QrGJ.rg6sIGsct/3C12l272YKAMJqtV6sZJi';
BEGIN
    SELECT id INTO class_id FROM school_classes WHERE name = 'SS1';

    -- 23. Ibe Chidinma (Science)
    SELECT id INTO dept_id FROM departments WHERE name = 'Science';
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/023', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "departmentId", "dateOfBirth") 
    VALUES (user_id, 'Ibe', 'Chidinma', class_id, dept_id, '2009-01-01');

    -- 24. Oyedele Eniola (Art)
    SELECT id INTO dept_id FROM departments WHERE name = 'Art';
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/024', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "departmentId", "dateOfBirth") 
    VALUES (user_id, 'Oyedele', 'Eniola', class_id, dept_id, '2009-01-01');

    -- 25. Ogundare Temilade (Art)
    SELECT id INTO dept_id FROM departments WHERE name = 'Art';
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/025', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "departmentId", "dateOfBirth") 
    VALUES (user_id, 'Ogundare', 'Temilade', class_id, dept_id, '2009-01-01');

END $$;
