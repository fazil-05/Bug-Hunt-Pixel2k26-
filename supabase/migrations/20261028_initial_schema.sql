-- ====================================================================
-- BUG HUNT PIXEL2K26 - COMPLETE POSTGRESQL PRODUCTION SCHEMA WITH RLS
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Admin Profiles
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'organizer' CHECK (role IN ('superadmin', 'organizer', 'referee')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Competitions
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    max_teams INTEGER NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_by UUID REFERENCES public.admin_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    description TEXT,
    total_bugs INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Challenge Bugs (Answer Key - Admin & Edge Functions Only)
CREATE TABLE IF NOT EXISTS public.challenge_bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    bug_key TEXT NOT NULL, -- e.g. 'BUG-1'
    bug_number INTEGER NOT NULL CHECK (bug_number BETWEEN 1 AND 5),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('search', 'cart', 'pricing', 'navigation', 'form_validation', 'ui_layout', 'other')),
    target_component TEXT NOT NULL,
    target_element_selector TEXT,
    severity TEXT NOT NULL DEFAULT 'major' CHECK (severity IN ('critical', 'major', 'minor', 'edge-case')),
    points INTEGER NOT NULL DEFAULT 20,
    description TEXT NOT NULL,
    expected_behavior TEXT NOT NULL,
    actual_behavior TEXT NOT NULL,
    reproduction_steps TEXT[] NOT NULL DEFAULT '{}',
    matching_keywords TEXT[] NOT NULL DEFAULT '{}',
    explanation_post_round TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(challenge_id, bug_key)
);

-- 5. Competition Rounds
CREATE TABLE IF NOT EXISTS public.competition_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id),
    round_number INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL DEFAULT 'Championship Round',
    instructions TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'ended', 'published')),
    duration_seconds INTEGER NOT NULL DEFAULT 600, -- 10 mins
    started_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    accumulated_paused_seconds INTEGER NOT NULL DEFAULT 0,
    show_leaderboard_to_teams BOOLEAN NOT NULL DEFAULT true,
    winner_team_id UUID,
    results_published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE, -- e.g. 'alpha', 'beta', 'gamma', 'delta'
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    avatar_icon TEXT NOT NULL DEFAULT 'Rocket',
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    bugs_identified TEXT[] NOT NULL DEFAULT '{}',
    incorrect_submissions_count INTEGER NOT NULL DEFAULT 0,
    last_submission_timestamp TIMESTAMPTZ,
    completion_time_seconds INTEGER,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. Bug Submissions
CREATE TABLE IF NOT EXISTS public.bug_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.competition_rounds(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    bug_id UUID REFERENCES public.challenge_bugs(id) ON DELETE SET NULL,
    bug_key TEXT,
    category TEXT NOT NULL,
    target_component TEXT,
    title TEXT,
    description TEXT NOT NULL,
    steps_to_reproduce TEXT NOT NULL,
    element_selector TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('accepted', 'rejected', 'pending')),
    points_awarded INTEGER NOT NULL DEFAULT 0,
    manually_graded BOOLEAN NOT NULL DEFAULT false,
    admin_feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. Competition Events (Realtime audit stream)
CREATE TABLE IF NOT EXISTS public.competition_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.competition_rounds(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. Indexes for Fast Realtime & Leaderboard Queries
CREATE INDEX IF NOT EXISTS idx_rounds_comp ON public.competition_rounds(competition_id);
CREATE INDEX IF NOT EXISTS idx_teams_code ON public.teams(code);
CREATE INDEX IF NOT EXISTS idx_submissions_round_team ON public.bug_submissions(round_id, team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.bug_submissions(status);
CREATE INDEX IF NOT EXISTS idx_events_round ON public.competition_events(round_id, created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_events ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an administrator?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Challenge Bugs Policy: CRITICAL SECURITY REQUIREMENT
-- Answers are NEVER visible to the public or participant client queries!
-- Only administrators or users after round results are published can read them.
CREATE POLICY "Admins full access on challenge bugs"
    ON public.challenge_bugs FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Public read published challenge bugs"
    ON public.challenge_bugs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.competition_rounds cr
            WHERE cr.status = 'published' AND cr.challenge_id = challenge_bugs.challenge_id
        )
    );

-- 2. Competitions & Rounds: Public can read, only admin can insert/update
CREATE POLICY "Public read active competitions"
    ON public.competitions FOR SELECT
    USING (true);

CREATE POLICY "Admin manage competitions"
    ON public.competitions FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role');

CREATE POLICY "Public read rounds"
    ON public.competition_rounds FOR SELECT
    USING (true);

CREATE POLICY "Admin manage rounds"
    ON public.competition_rounds FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role');

-- 3. Teams: Public can read for live scoreboard; only admin or system can mutate
CREATE POLICY "Public read teams"
    ON public.teams FOR SELECT
    USING (true);

CREATE POLICY "Admin manage teams"
    ON public.teams FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role');

-- 4. Bug Submissions:
-- Teams can only read their own submissions. Admin can read all.
CREATE POLICY "Teams view own submissions"
    ON public.bug_submissions FOR SELECT
    USING (
        public.is_admin() OR 
        team_id IN (SELECT id FROM public.teams WHERE code = current_setting('request.headers', true)::json->>'x-team-code')
    );

CREATE POLICY "Admin full manage submissions"
    ON public.bug_submissions FOR ALL
    USING (public.is_admin() OR auth.role() = 'service_role');

-- 5. Realtime Events: Read all
CREATE POLICY "Public read events"
    ON public.competition_events FOR SELECT
    USING (true);

-- ====================================================================
-- SECURE SERVER-SIDE SUBMISSION & GRADING STORED PROCEDURE
-- ====================================================================

CREATE OR REPLACE FUNCTION public.submit_bug_report(
    p_team_code TEXT,
    p_round_id UUID,
    p_category TEXT,
    p_target_component TEXT,
    p_title TEXT,
    p_description TEXT,
    p_steps_to_reproduce TEXT,
    p_selector TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_round RECORD;
    v_team RECORD;
    v_bug RECORD;
    v_is_matched BOOLEAN := false;
    v_matched_bug RECORD;
    v_keyword_count INTEGER := 0;
    v_kw TEXT;
    v_full_text TEXT;
    v_submission_id UUID;
    v_new_score INTEGER;
    v_elapsed_seconds INTEGER;
BEGIN
    -- 1. Check round status and timer validity
    SELECT * INTO v_round FROM public.competition_rounds WHERE id = p_round_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('accepted', false, 'points', 0, 'message', 'Round not found.');
    END IF;

    IF v_round.status != 'running' THEN
        RETURN jsonb_build_object(
            'accepted', false, 
            'points', 0, 
            'message', CASE 
                WHEN v_round.status = 'paused' THEN 'Competition is paused by organizer.'
                WHEN v_round.status = 'ended' THEN 'Time is up! Submissions are closed.'
                ELSE 'Competition is not currently accepting submissions.'
            END
        );
    END IF;

    -- 2. Find team
    SELECT * INTO v_team FROM public.teams WHERE lower(code) = lower(p_team_code);
    IF NOT FOUND THEN
        RETURN jsonb_build_object('accepted', false, 'points', 0, 'message', 'Invalid team identifier.');
    END IF;

    v_full_text := lower(concat(p_title, ' ', p_description, ' ', p_steps_to_reproduce, ' ', p_target_component, ' ', coalesce(p_selector, '')));

    -- 3. Match against challenge bugs
    FOR v_bug IN SELECT * FROM public.challenge_bugs WHERE challenge_id = v_round.challenge_id LOOP
        -- Category match
        IF v_bug.category = p_category OR (p_category = 'other' AND v_full_text LIKE '%' || v_bug.category || '%') THEN
            -- Check keywords
            v_keyword_count := 0;
            FOREACH v_kw IN ARRAY v_bug.matching_keywords LOOP
                IF v_full_text LIKE '%' || lower(v_kw) || '%' THEN
                    v_keyword_count := v_keyword_count + 1;
                END IF;
            END LOOP;

            -- Check component or selector match
            IF v_keyword_count >= 2 OR (p_selector IS NOT NULL AND v_bug.target_element_selector LIKE '%' || p_selector || '%') THEN
                v_is_matched := true;
                v_matched_bug := v_bug;
                EXIT;
            END IF;
        END IF;
    END LOOP;

    -- 4. Duplicate bug score check
    IF v_is_matched THEN
        IF v_matched_bug.bug_key = ANY(v_team.bugs_identified) THEN
            RETURN jsonb_build_object(
                'accepted', false, 
                'points', 0, 
                'already_solved', true,
                'message', 'Your team has already successfully identified and claimed points for this bug.'
            );
        END IF;

        -- Record accepted submission
        INSERT INTO public.bug_submissions (
            round_id, team_id, bug_id, bug_key, category, target_component,
            title, description, steps_to_reproduce, element_selector,
            status, points_awarded
        ) VALUES (
            v_round.id, v_team.id, v_matched_bug.id, v_matched_bug.bug_key, p_category, p_target_component,
            p_title, p_description, p_steps_to_reproduce, p_selector,
            'accepted', v_matched_bug.points
        ) RETURNING id INTO v_submission_id;

        -- Calculate elapsed seconds
        v_elapsed_seconds := EXTRACT(EPOCH FROM (timezone('utc', now()) - v_round.started_at))::INTEGER;

        -- Update team record atomically
        UPDATE public.teams
        SET score = score + v_matched_bug.points,
            bugs_identified = array_append(bugs_identified, v_matched_bug.bug_key),
            last_submission_timestamp = timezone('utc', now()),
            completion_time_seconds = CASE 
                WHEN array_length(bugs_identified, 1) + 1 = 5 THEN v_elapsed_seconds 
                ELSE completion_time_seconds 
            END
        WHERE id = v_team.id
        RETURNING score INTO v_new_score;

        -- Broadcast competition event
        INSERT INTO public.competition_events (round_id, event_type, payload)
        VALUES (
            v_round.id,
            'BUG_CONFIRMED',
            jsonb_build_object(
                'team_id', v_team.id,
                'team_name', v_team.name,
                'bug_key', v_matched_bug.bug_key,
                'points', v_matched_bug.points,
                'new_score', v_new_score
            )
        );

        RETURN jsonb_build_object(
            'accepted', true,
            'bug_key', v_matched_bug.bug_key,
            'points', v_matched_bug.points,
            'message', 'Bug identified successfully! +20 points.'
        );
    ELSE
        -- Record rejected submission
        INSERT INTO public.bug_submissions (
            round_id, team_id, category, target_component,
            title, description, steps_to_reproduce, element_selector,
            status, points_awarded
        ) VALUES (
            v_round.id, v_team.id, p_category, p_target_component,
            p_title, p_description, p_steps_to_reproduce, p_selector,
            'rejected', 0
        ) RETURNING id INTO v_submission_id;

        UPDATE public.teams
        SET incorrect_submissions_count = incorrect_submissions_count + 1,
            last_submission_timestamp = timezone('utc', now())
        WHERE id = v_team.id;

        RETURN jsonb_build_object(
            'accepted', false,
            'points', 0,
            'message', 'Report submitted, but no matching bug was confirmed.'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- SEED DATA (ShopEasy Challenge & 4 Default Teams)
-- ====================================================================

-- Insert Default Challenge
INSERT INTO public.challenges (id, slug, name, version, description, total_bugs)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'shopeasy-v1',
    'ShopEasy e-Commerce Store',
    '1.0',
    'Modern e-commerce platform with 5 hidden bugs in search, cart, pricing, navigation, and validation.',
    5
) ON CONFLICT (slug) DO NOTHING;

-- Insert 5 Challenge Bugs
INSERT INTO public.challenge_bugs (challenge_id, bug_key, bug_number, title, category, target_component, target_element_selector, severity, points, description, expected_behavior, actual_behavior, reproduction_steps, matching_keywords, explanation_post_round)
VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'BUG-1',
    1,
    'Search Functionality Inversion',
    'search',
    'Header Search Bar',
    '#shop-search-input',
    'critical',
    20,
    'Searching for valid products returns empty results.',
    'Typing keywords like AirPro or Watch should return matching items.',
    'Filter condition is inverted, producing 0 results.',
    ARRAY['Click search bar', 'Type AirPro', 'Observe empty list'],
    ARRAY['search', 'query', 'empty', 'results', 'filter', 'input', 'find', 'zero', 'missing'],
    'Search filter used negated predicate !name.includes(q).'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'BUG-2',
    2,
    'Add to Cart State Mutation Failure',
    'cart',
    'Featured Product Add to Cart Button',
    '.btn-add-to-cart[data-product-id="1"]',
    'critical',
    20,
    'Clicking Add to Cart on product #1 fails to add item or increment cart badge.',
    'Clicking Add to Cart should add product and update badge.',
    'Click handler fails silently without dispatching state update.',
    ARRAY['Find AirPro ANC Headphones', 'Click Add to Cart', 'Notice cart counter stays 0'],
    ARRAY['add to cart', 'cart', 'not adding', 'does not update', 'counter', 'button', 'badge'],
    'Product ID 1 had a guard condition preventing state mutation.'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'BUG-3',
    3,
    'Cart Price Calculation Arithmetic Error',
    'pricing',
    'Shopping Cart Total Summary',
    '#cart-total-price',
    'major',
    20,
    'Cart calculates incorrect total price by subtracting shipping cost instead of adding it.',
    'Total should equal Subtotal + Shipping + Tax.',
    'Total calculation subtracts shipping: total = subtotal - shipping + tax.',
    ARRAY['Add items to cart', 'Open cart drawer', 'Review price breakdown', 'Observe arithmetic discrepancy'],
    ARRAY['price', 'total', 'calculate', 'calculation', 'subtotal', 'math', 'tax', 'shipping', 'wrong sum'],
    'Formula subtracted shipping fee instead of adding it.'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'BUG-4',
    4,
    'Navigation Category Route Mismatch',
    'navigation',
    'Top Navbar Category Link (Audio)',
    'nav a[data-nav="audio"]',
    'major',
    20,
    'Clicking the Audio nav category opens a 404 Route Not Found error section.',
    'Clicking Audio should filter catalog by audio products.',
    'Audio tab incorrectly routes to /legal-terms-redirect.',
    ARRAY['In top navigation header, click Audio', 'Notice 404 Route Not Found container appears'],
    ARRAY['nav', 'navigation', 'link', 'audio', 'wrong page', 'route', 'header', 'redirect', '404'],
    'Nav tab mapped to invalid route instead of category audio.'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'BUG-5',
    5,
    'Checkout Form Email Validation Bypass',
    'form_validation',
    'Checkout Form Email Field',
    '#checkout-email-input',
    'major',
    20,
    'Checkout form accepts invalid email addresses without validation warnings.',
    'Malformed email addresses should be rejected with validation warning.',
    'Form accepts invalid strings like team@ or bademail and completes order.',
    ARRAY['Add item to cart and proceed to checkout', 'Enter invalid email such as team@', 'Click Place Order', 'Order completes successfully'],
    ARRAY['email', 'validation', 'checkout', 'form', 'invalid', 'bypass', 'accepts', 'regex', 'submit'],
    'Form lacked RFC compliant email format check.'
) ON CONFLICT DO NOTHING;

