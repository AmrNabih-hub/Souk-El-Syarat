-- Add todos table for demo/testing purposes
-- This table is used for connection testing and demo functionality

CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for todos
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all todos (for demo purposes)
CREATE POLICY "Anyone can view todos" ON todos
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Policy: Authenticated users can insert todos
CREATE POLICY "Authenticated users can insert todos" ON todos
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own todos
CREATE POLICY "Users can update own todos" ON todos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can delete their own todos
CREATE POLICY "Users can delete own todos" ON todos
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Add sample data for todos (for demo)
INSERT INTO todos (text, completed, user_id) VALUES 
('Welcome to Souk El-Sayarat! 🚗', false, NULL),
('Configure your marketplace preferences', false, NULL),
('Browse available cars and parts', false, NULL),
('Connect with verified vendors', false, NULL),
('Experience real-time notifications', false, NULL)
ON CONFLICT DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();