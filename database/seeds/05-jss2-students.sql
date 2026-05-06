DO $$ 
DECLARE 
    user_id uuid;
    class_id uuid;
    pwd_hash text := '$2b$10$zmvt.Qh4ugBZOZ7V.QrGJ.rg6sIGsct/3C12l272YKAMJqtV6sZJi';
BEGIN
    SELECT id INTO class_id FROM school_classes WHERE name = 'JSS2';

    -- 11. Okeniyi Emmanuel
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/011', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Okeniyi', 'Emmanuel', class_id, '2014-03-22');

    -- 12. Wobaseojoi Daniel Ofem
    -- (Rule: pick first two names only)
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/012', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Wobaseojoi', 'Daniel', class_id, '2013-05-01');

    -- 13. Olaitan Feolami
    INSERT INTO users (username, password, role) VALUES ('EBS/STU/013', pwd_hash, 'student') RETURNING id INTO user_id;
    INSERT INTO student_profiles ("userId", "firstName", "lastName", "schoolClassId", "dateOfBirth") 
    VALUES (user_id, 'Olaitan', 'Feolami', class_id, '2014-10-20');

END $$;
