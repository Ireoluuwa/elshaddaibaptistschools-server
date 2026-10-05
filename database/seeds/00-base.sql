-- Classes, departments and subjects the other seed files expect to exist.
INSERT INTO school_classes (name, "isSenior") VALUES
  ('JSS1', false), ('JSS2', false), ('JSS3', false),
  ('SS1', true), ('SS2', true), ('SS3', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (name) VALUES
  ('Science'), ('Art'), ('Commercial')
ON CONFLICT (name) DO NOTHING;

INSERT INTO subjects (name) VALUES
  ('Account'),
  ('Agriculture'),
  ('Basic Science'),
  ('Basic Science and Technology'),
  ('Basic Technology'),
  ('Biology'),
  ('Business Studies'),
  ('CRS'),
  ('Chemistry'),
  ('Citizenship and Heritage Studies'),
  ('Coding'),
  ('Commerce'),
  ('Computer'),
  ('Culture and Creative Art'),
  ('Digital Technologies'),
  ('Digital Technology'),
  ('Economics'),
  ('English'),
  ('French'),
  ('Geography'),
  ('Government'),
  ('History'),
  ('Intermediate Science'),
  ('Literature'),
  ('Marketing'),
  ('Mathematics'),
  ('Music'),
  ('National Values'),
  ('Physical and Health Education'),
  ('Physics'),
  ('Pre-Vocational Studies'),
  ('Social and Security Studies'),
  ('Yoruba')
ON CONFLICT (name) DO NOTHING;
