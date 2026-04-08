-- 1. Create table for check-ins
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    money_amount INTEGER DEFAULT 0,
    category TEXT CHECK (category IN ('money', 'love', 'clean')),
    tags TEXT[]
);

-- 2. Create table for bedtime reviews
CREATE TABLE bedtime_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    q1_good TEXT,
    q2_bad TEXT,
    q3_plan TEXT
);

-- 3. Enable RLS
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bedtime_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allows anonymous users to read their own records" ON checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allows anonymous users to insert their own records" ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allows authenticated users to update their own records" ON checkins FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allows anonymous users to read their own bedtime reviews" ON bedtime_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allows anonymous users to insert their own bedtime reviews" ON bedtime_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Enable realtime for both tables (optional but good for future scalability)
alter publication supabase_realtime add table checkins;
alter publication supabase_realtime add table bedtime_reviews;
