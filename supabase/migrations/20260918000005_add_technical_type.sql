ALTER TABLE public.interview_questions ADD COLUMN IF NOT EXISTS technical_type TEXT DEFAULT 'theory' CHECK (technical_type IN ('theory', 'coding'));

UPDATE public.interview_questions SET technical_type = 'coding' WHERE sample_code IS NOT NULL;
