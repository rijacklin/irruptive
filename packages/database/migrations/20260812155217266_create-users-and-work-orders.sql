-- Up Migration

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT users_name_not_blank
    CHECK (length(btrim(name)) > 0),

  CONSTRAINT users_email_not_blank
    CHECK (length(btrim(email)) > 0),

  CONSTRAINT users_email_unique
    UNIQUE (email),

  CONSTRAINT users_role_valid
    CHECK (role IN ('requester', 'technician', 'supervisor', 'admin'))
);

CREATE TABLE work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category text,
  created_by uuid NOT NULL,
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT work_orders_title_length
    CHECK (length(btrim(title)) BETWEEN 3 AND 200),

  CONSTRAINT work_orders_description_length
    CHECK (length(btrim(description)) >= 10),

  CONSTRAINT work_orders_status_valid
    CHECK (
      status IN (
        'open',
        'assigned',
        'in_progress',
        'blocked',
        'resolved',
        'closed'
      )
    ),

  CONSTRAINT work_orders_priority_valid
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  CONSTRAINT work_orders_category_not_blank
    CHECK (category IS NULL OR length(btrim(category)) > 0),

  CONSTRAINT work_orders_created_by_fk
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT work_orders_assigned_to_fk
    FOREIGN KEY (assigned_to)
    REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE INDEX work_orders_status_idx
  ON work_orders (status);

CREATE INDEX work_orders_priority_idx
  ON work_orders (priority);

CREATE INDEX work_orders_assigned_to_idx
  ON work_orders (assigned_to);

CREATE INDEX work_orders_created_by_idx
  ON work_orders (created_by);

CREATE INDEX work_orders_created_at_idx
  ON work_orders (created_at DESC);

-- Down Migration

DROP TABLE work_orders;
DROP TABLE users;
