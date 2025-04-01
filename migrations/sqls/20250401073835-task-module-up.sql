CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(250) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  due_on TIMESTAMPTZ DEFAULT NULL,
  status VARCHAR(11) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in-progress','completed')),
  priority VARCHAR(11) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  reserve1 VARCHAR(1), -- reserved column	
  reserve2 VARCHAR(1), -- reserved column	
  reserve3 VARCHAR(1), -- reserved column	
  reserve4 VARCHAR(1), -- reserved column
  created_on TIMESTAMPTZ DEFAULT current_timestamp,
  created_by BIGINT REFERENCES users(id),
  updated_on TIMESTAMPTZ DEFAULT current_timestamp,
  updated_by BIGINT REFERENCES users(id)
);

CREATE TRIGGER update_task_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_on_column();