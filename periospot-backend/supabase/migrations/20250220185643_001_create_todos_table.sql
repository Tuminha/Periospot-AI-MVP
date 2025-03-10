-- Create status enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
        CREATE TYPE public.status AS ENUM ('Not Started', 'In Progress', 'Complete');
    END IF;
END $$;

-- Create todos table
CREATE TABLE IF NOT EXISTS public.todos (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    task text NOT NULL,
    status public.status DEFAULT 'Not Started'::public.status,
    user_id uuid REFERENCES auth.users NOT NULL,
    inserted_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own todos" ON public.todos';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos';
END $$;

-- Create RLS Policies
CREATE POLICY "Users can view their own todos" 
    ON public.todos 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" 
    ON public.todos 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" 
    ON public.todos 
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" 
    ON public.todos 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS handle_todos_updated_at ON public.todos;
CREATE TRIGGER handle_todos_updated_at
    BEFORE UPDATE ON public.todos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 