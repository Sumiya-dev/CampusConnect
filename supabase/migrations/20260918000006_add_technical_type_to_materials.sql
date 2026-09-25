ALTER TABLE public.preparation_materials ADD COLUMN IF NOT EXISTS technical_type TEXT DEFAULT 'theory' CHECK (technical_type IN ('theory', 'coding'));

-- We can optionally mark known coding materials as coding here if we want, but default 'theory' is fine for now.
UPDATE public.preparation_materials SET technical_type = 'coding' WHERE sub_category = 'Algorithms & Data Structures';
