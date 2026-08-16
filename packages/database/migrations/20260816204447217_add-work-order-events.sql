-- Up Migration

CREATE TABLE work_order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT work_order_events_work_order_id_fk
    FOREIGN KEY (work_order_id)
    REFERENCES work_orders(id)
    ON DELETE CASCADE,

  CONSTRAINT work_order_events_event_type_not_blank
    CHECK (length(btrim(event_type)) > 0),

  CONSTRAINT work_order_events_event_data_is_object
    CHECK (jsonb_typeof(event_data) = 'object')
);

CREATE INDEX work_order_events_work_order_created_at_id_idx
  ON work_order_events (work_order_id, created_at, id);

-- Down Migration

DROP TABLE work_order_events;
