DO $$ 
DECLARE 
    user_id uuid;
    class_id uuid;
BEGIN
    -- User 1: EBS/TCH/001
    SELECT id INTO class_id FROM school_classes WHERE name = 'JSS1';
    INSERT INTO users (username, password, role) VALUES ('EBS/TCH/001', '$2b$10$VzAwMNDWZDWnMAn/hO2DOOh1XkNKIdcZwVRs5.ir48O2Q1MWSNGz6', 'teacher') RETURNING id INTO user_id;
    INSERT INTO teacher_profiles ("userId", "firstName", "lastName", "schoolClassId") VALUES (user_id, 'Adams', 'Sanni', class_id);

    -- User 2: EBS/TCH/002
    SELECT id INTO class_id FROM school_classes WHERE name = 'JSS2';
    INSERT INTO users (username, password, role) VALUES ('EBS/TCH/002', '$2b$10$VzAwMNDWZDWnMAn/hO2DOOh1XkNKIdcZwVRs5.ir48O2Q1MWSNGz6', 'teacher') RETURNING id INTO user_id;
    INSERT INTO teacher_profiles ("userId", "firstName", "lastName", "schoolClassId") VALUES (user_id, 'Grace', 'Tomori', class_id);

    -- User 3: EBS/TCH/003
    SELECT id INTO class_id FROM school_classes WHERE name = 'JSS3';
    INSERT INTO users (username, password, role) VALUES ('EBS/TCH/003', '$2b$10$VzAwMNDWZDWnMAn/hO2DOOh1XkNKIdcZwVRs5.ir48O2Q1MWSNGz6', 'teacher') RETURNING id INTO user_id;
    INSERT INTO teacher_profiles ("userId", "firstName", "lastName", "schoolClassId") VALUES (user_id, 'Abayomi', 'Agbeluyi', class_id);

    -- User 4: EBS/TCH/004
    SELECT id INTO class_id FROM school_classes WHERE name = 'SS1';
    INSERT INTO users (username, password, role) VALUES ('EBS/TCH/004', '$2b$10$VzAwMNDWZDWnMAn/hO2DOOh1XkNKIdcZwVRs5.ir48O2Q1MWSNGz6', 'teacher') RETURNING id INTO user_id;
    INSERT INTO teacher_profiles ("userId", "firstName", "lastName", "schoolClassId") VALUES (user_id, 'Elizabeth', '', class_id);

    -- User 5: EBS/TCH/005
    SELECT id INTO class_id FROM school_classes WHERE name = 'SS2';
    INSERT INTO users (username, password, role) VALUES ('EBS/TCH/005', '$2b$10$VzAwMNDWZDWnMAn/hO2DOOh1XkNKIdcZwVRs5.ir48O2Q1MWSNGz6', 'teacher') RETURNING id INTO user_id;
    INSERT INTO teacher_profiles ("userId", "firstName", "lastName", "schoolClassId") VALUES (user_id, 'IfeOluwa', 'Olomolatan', class_id);

    -- User 6: EBS/TCH/006
    SELECT id INTO class_id FROM school_classes WHERE name = 'SS1';
    INSERT INTO users (username, password, role) VALUES ('EBS/TCH/006', '$2b$10$VzAwMNDWZDWnMAn/hO2DOOh1XkNKIdcZwVRs5.ir48O2Q1MWSNGz6', 'teacher') RETURNING id INTO user_id;
    INSERT INTO teacher_profiles ("userId", "firstName", "lastName", "schoolClassId", "email", "phoneNumber") VALUES (user_id, 'Victor', 'Ayegbede', class_id, 'Ayegbedevictor@gmail.com', '+234 814 582 6154');

END $$;
