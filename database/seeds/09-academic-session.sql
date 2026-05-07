DO $$ 
DECLARE 
    year_id uuid;
BEGIN
    -- Create the 2025/2026 Academic Session
    INSERT INTO academic_years (name, "isCurrent") 
    VALUES ('2025/2026', true) 
    RETURNING id INTO year_id;

    -- Create the 3rd Term
    -- Using May 4, 2026 as start (approximate) and July 31, 2026 as end
    INSERT INTO terms (name, "startDate", "endDate", "isCurrent", "academicYearId") 
    VALUES ('3rd Term', '2026-05-04', '2026-07-31', true, year_id);

END $$;
