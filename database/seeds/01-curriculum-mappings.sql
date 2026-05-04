-- Clear existing mappings to avoid duplicates if re-run
TRUNCATE TABLE curriculum_mappings;

-- JSS 1
INSERT INTO curriculum_mappings ("schoolClassId", "subjectId")
SELECT c.id, s.id FROM school_classes c, subjects s 
WHERE c.name = 'JSS1' 
AND s.name IN ('Mathematics', 'English', 'French', 'Physical and Health Education', 'CRS', 'Social and Security Studies', 'Business Studies', 'Intermediate Science', 'Coding', 'Digital Technology', 'History', 'Music');

-- JSS 2
INSERT INTO curriculum_mappings ("schoolClassId", "subjectId")
SELECT c.id, s.id FROM school_classes c, subjects s 
WHERE c.name = 'JSS2' 
AND s.name IN ('Mathematics', 'English', 'French', 'Yoruba', 'Basic Science and Technology', 'CRS', 'National Values', 'Business Studies', 'Music', 'Coding', 'Pre-Vocational Studies', 'History');

-- JSS 3
INSERT INTO curriculum_mappings ("schoolClassId", "subjectId")
SELECT c.id, s.id FROM school_classes c, subjects s 
WHERE c.name = 'JSS3' 
AND s.name IN ('Mathematics', 'English', 'French', 'Physical and Health Education', 'CRS', 'Yoruba', 'Basic Science and Technology', 'National Values', 'Culture and Creative Art', 'Business Studies', 'Coding', 'Pre-Vocational Studies', 'History');

-- SS 1 Science
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id FROM school_classes c, departments d, subjects s 
WHERE c.name = 'SS1' AND d.name = 'Science'
AND s.name IN ('English', 'Mathematics', 'Citizenship and Heritage Studies', 'Digital Technologies', 'Biology', 'Chemistry', 'Physics', 'Agriculture', 'Economics', 'Geography');

-- SS 2 Science
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id FROM school_classes c, departments d, subjects s 
WHERE c.name = 'SS2' AND d.name = 'Science'
AND s.name IN ('English', 'Mathematics', 'Citizenship and Heritage Studies', 'Digital Technologies', 'Biology', 'Chemistry', 'Physics', 'Agriculture', 'Economics', 'Geography');

-- SS 1 Arts
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id FROM school_classes c, departments d, subjects s 
WHERE c.name = 'SS1' AND d.name = 'Art'
AND s.name IN ('English', 'Mathematics', 'Citizenship and Heritage Studies', 'Digital Technologies', 'Government', 'CRS', 'Economics', 'Literature', 'Yoruba');

-- SS 2 Arts
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id FROM school_classes c, departments d, subjects s 
WHERE c.name = 'SS2' AND d.name = 'Art'
AND s.name IN ('English', 'Mathematics', 'Citizenship and Heritage Studies', 'Digital Technologies', 'Government', 'CRS', 'Economics', 'Literature', 'Yoruba');

-- SS 1 Business (Commercial)
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id FROM school_classes c, departments d, subjects s 
WHERE c.name = 'SS1' AND d.name = 'Commercial'
AND s.name IN ('English', 'Mathematics', 'Citizenship and Heritage Studies', 'Digital Technologies', 'Account', 'Commerce', 'Economics', 'Geography', 'Government');

-- SS 2 Business (Commercial)
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id FROM school_classes c, departments d, subjects s 
WHERE c.name = 'SS2' AND d.name = 'Commercial'
AND s.name IN ('English', 'Mathematics', 'Citizenship and Heritage Studies', 'Digital Technologies', 'Account', 'Commerce', 'Economics', 'Geography', 'Government');
