/* Replace with your SQL commands */
CREATE TABLE usertasks (
 id BIGSERIAL PRIMARY KEY,
 userid BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
 taskid BIGINT NOT NULL REFERENCES tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
 status VARCHAR(11) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','INPROGRESS','COMPLETED')),
 permission_level VARCHAR(10) NOT NULL DEFAULT 'VIEW' CHECK(permission_level IN ('VIEW','EDIT','DELETE','OWNER')),
 assigned_on TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
 assigned_by BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);