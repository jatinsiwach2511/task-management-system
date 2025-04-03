/* Replace with your SQL commands */
CREATE TABLE reminders (
    id BIGSERIAL PRIMARY KEY,
    usertaskid BIGSERIAL NOT NULL REFERENCES usertasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
    reminder_time TIMESTAMPTZ NOT NULL,
    message VARCHAR(250),
    created_on TIMESTAMPTZ DEFAULT current_timestamp,
    updated_on TIMESTAMPTZ DEFAULT current_timestamp,
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed'))
);

CREATE TRIGGER update_reminders_modtime BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE PROCEDURE update_updated_on_column();
