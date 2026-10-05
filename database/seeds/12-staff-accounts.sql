-- Admin and bursar logins. Temporary passwords: change them after first sign-in.
INSERT INTO users (username, password, role) VALUES
  ('EBS/ADM/001', '$2b$10$iaLruRU5MPMwXiiz7h53KunESdmkpasyGn8WXPXX2cNDVpLbuYWSK', 'admin'),
  ('EBS/BUR/001', '$2b$10$BwgDkxjXRLkuyavzzd1Vnuhr5qGrv1Fhbpdx727VH947eh5./dzbq', 'bursar')
ON CONFLICT (username) DO NOTHING;
