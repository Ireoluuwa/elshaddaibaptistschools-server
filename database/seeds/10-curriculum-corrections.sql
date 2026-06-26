-- Curriculum corrections: add missing subjects and fix mappings

-- ─── 1. Create new subjects that don't yet exist ─────────────────────────────
INSERT INTO subjects (name) VALUES
  ('Basic Science'),
  ('Basic Technology'),
  ('Computer'),
  ('Marketing')
ON CONFLICT (name) DO NOTHING;

-- ─── 2. JSS1 — add omitted subjects ──────────────────────────────────────────
INSERT INTO curriculum_mappings ("schoolClassId", "subjectId")
SELECT c.id, s.id
FROM school_classes c, subjects s
WHERE c.name = 'JSS1'
  AND s.name IN ('Culture and Creative Art', 'Yoruba', 'Pre-Vocational Studies');

-- ─── 3. JSS2 — add omitted subjects ──────────────────────────────────────────
INSERT INTO curriculum_mappings ("schoolClassId", "subjectId")
SELECT c.id, s.id
FROM school_classes c, subjects s
WHERE c.name = 'JSS2'
  AND s.name IN (
    'Physical and Health Education',
    'Culture and Creative Art',
    'Basic Science',
    'Basic Technology'
  );

-- ─── 4. JSS3 — add omitted subjects ──────────────────────────────────────────
INSERT INTO curriculum_mappings ("schoolClassId", "subjectId")
SELECT c.id, s.id
FROM school_classes c, subjects s
WHERE c.name = 'JSS3'
  AND s.name IN ('Music', 'Computer', 'Basic Technology');

-- ─── 5. SS1 Art — remove Literature and Yoruba ───────────────────────────────
DELETE FROM curriculum_mappings
WHERE "schoolClassId" = (SELECT id FROM school_classes WHERE name = 'SS1')
  AND "departmentId" = (SELECT id FROM departments WHERE name = 'Art')
  AND "subjectId" IN (
    SELECT id FROM subjects WHERE name IN ('Literature', 'Yoruba')
  );

-- ─── 6. SS2 — replace Digital Technologies with Marketing ────────────────────
-- Remove Digital Technologies from all SS2 departments
DELETE FROM curriculum_mappings
WHERE "schoolClassId" = (SELECT id FROM school_classes WHERE name = 'SS2')
  AND "subjectId" = (SELECT id FROM subjects WHERE name = 'Digital Technologies');

-- Add Marketing to SS2 Science
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id
FROM school_classes c, departments d, subjects s
WHERE c.name = 'SS2' AND d.name = 'Science' AND s.name = 'Marketing';

-- Add Marketing to SS2 Art
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id
FROM school_classes c, departments d, subjects s
WHERE c.name = 'SS2' AND d.name = 'Art' AND s.name = 'Marketing';

-- Add Marketing to SS2 Commercial
INSERT INTO curriculum_mappings ("schoolClassId", "departmentId", "subjectId")
SELECT c.id, d.id, s.id
FROM school_classes c, departments d, subjects s
WHERE c.name = 'SS2' AND d.name = 'Commercial' AND s.name = 'Marketing';
