DO $$ 
DECLARE 
    user_id uuid;
    class_id uuid;
    pwd_hash text := '$2b$10$zmvt.Qh4ugBZOZ7V.QrGJ.rg6sIGsct/3C12l272YKAMJqtV6sZJi';
BEGIN
    SELECT id INTO class_id FROM school_classes WHERE name = 'JSS3';

    -- 14. Adesina Deborah
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/014', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Adesina', 'Deborah', class_id, '2013-08-04');

    -- 15. Esomojumi Hephzibah
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/015', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Esomojumi', 'Hephzibah', class_id, '2015-02-13');

    -- 16. Emmanuel Hannah
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/016', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Emmanuel', 'Hannah', class_id, '2014-05-17');

    -- 17. Aluko Ewaoluwa
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/017', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Aluko', 'Ewaoluwa', class_id, '2013-10-23');

    -- 18. Alatishe Adebukola
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/018', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Alatishe', 'Adebukola', class_id, '2014-02-02');

    -- 19. Akinola Babatunde
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/019', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Akinola', 'Babatunde', class_id, '2013-03-18');

    -- 20. Olotu Oriade
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/020', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Olotu', 'Oriade', class_id, '2013-03-13');

    -- 21. Ige Favour
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/021', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Ige', 'Favour', class_id, '2012-02-17');

    -- 22. Peter Okhare
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/022', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Peter', 'Okhare', class_id, '2013-05-17');

END $$;
