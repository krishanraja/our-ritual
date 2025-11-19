-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create couples table
CREATE TABLE public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_one uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  partner_two uuid REFERENCES public.profiles ON DELETE CASCADE,
  couple_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  current_cycle_week_start date,
  synthesis_ready boolean DEFAULT false
);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their couple"
  ON public.couples FOR SELECT
  USING (auth.uid() = partner_one OR auth.uid() = partner_two);

CREATE POLICY "Users can update their couple"
  ON public.couples FOR UPDATE
  USING (auth.uid() = partner_one OR auth.uid() = partner_two);

CREATE POLICY "Authenticated users can create couples"
  ON public.couples FOR INSERT
  WITH CHECK (auth.uid() = partner_one);

-- Create weekly_cycles table
CREATE TABLE public.weekly_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES public.couples ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  partner_one_input jsonb,
  partner_two_input jsonb,
  partner_one_submitted_at timestamptz,
  partner_two_submitted_at timestamptz,
  synthesized_output jsonb,
  generated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.weekly_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their weekly cycles"
  ON public.weekly_cycles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = weekly_cycles.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert their weekly cycles"
  ON public.weekly_cycles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = weekly_cycles.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can update their weekly cycles"
  ON public.weekly_cycles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = weekly_cycles.couple_id
      AND (couples.partner_one = auth.uid() OR couples.partner_two = auth.uid())
    )
  );

-- Create ritual_library table
CREATE TABLE public.ritual_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  time_estimate text NOT NULL,
  budget_band text NOT NULL,
  constraints jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ritual_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ritual library"
  ON public.ritual_library FOR SELECT
  USING (true);

-- Create completions table
CREATE TABLE public.completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_cycle_id uuid REFERENCES public.weekly_cycles ON DELETE CASCADE NOT NULL,
  ritual_title text NOT NULL,
  completed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their completions"
  ON public.completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.weekly_cycles wc
      JOIN public.couples c ON c.id = wc.couple_id
      WHERE wc.id = completions.weekly_cycle_id
      AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
    )
  );

CREATE POLICY "Users can insert their completions"
  ON public.completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.weekly_cycles wc
      JOIN public.couples c ON c.id = wc.couple_id
      WHERE wc.id = completions.weekly_cycle_id
      AND (c.partner_one = auth.uid() OR c.partner_two = auth.uid())
    )
  );

-- Enable realtime for couples and weekly_cycles
ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_cycles;