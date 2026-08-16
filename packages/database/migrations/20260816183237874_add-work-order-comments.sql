-- Up Migration

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT comment_body_not_blank
    CHECK (length(btrim(body)) > 0),

  CONSTRAINT comments_work_order_id_fk
    FOREIGN KEY (work_order_id)
    REFERENCES work_orders(id)
    ON DELETE CASCADE,

  CONSTRAINT comments_user_id_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
);

CREATE INDEX comments_work_order_created_at_id_idx
  ON comments (work_order_id, created_at, id);

-- Down Migration

DROP TABLE comments;
