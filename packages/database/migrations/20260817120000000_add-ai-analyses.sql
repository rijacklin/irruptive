-- Up Migration
CREATE TABLE ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (length(btrim(provider)) > 0),
  model text NOT NULL CHECK (length(btrim(model)) > 0),
  prompt_version text NOT NULL CHECK (length(btrim(prompt_version)) > 0),
  summary text NOT NULL CHECK (length(btrim(summary)) > 0),
  suggested_priority text CHECK (
    suggested_priority IS NULL OR
    suggested_priority IN ('low', 'medium', 'high', 'critical')
  ),
  suggested_category text CHECK (
    suggested_category IS NULL OR length(btrim(suggested_category)) > 0
  ),
  suggested_actions jsonb NOT NULL CHECK (jsonb_typeof(suggested_actions) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_analyses_work_order_created_at_idx
  ON ai_analyses (work_order_id, created_at DESC);

-- Down Migration
DROP TABLE IF EXISTS ai_analyses;
