-- Allow students to insert their own student profile if it is missing
CREATE POLICY "Students can insert own record"
    ON public.students FOR INSERT
    WITH CHECK (user_id = auth.uid());
