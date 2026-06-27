-- SS1 curriculum fix: add missing subjects

-- SS1 Art — add Marketing, Yoruba, Literature
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id
FROM school_classes c, departments d, subjects s
WHERE c.name = 'SS1' AND d.name = 'Art'
  AND s.name IN ('Marketing', 'Yoruba', 'Literature')
ON CONFLICT DO NOTHING;

-- SS1 Science — add Marketing
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id
FROM school_classes c, departments d, subjects s
WHERE c.name = 'SS1' AND d.name = 'Science'
  AND s.name = 'Marketing'
ON CONFLICT DO NOTHING;
