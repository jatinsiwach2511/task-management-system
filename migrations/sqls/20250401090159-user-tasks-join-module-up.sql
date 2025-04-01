/* Replace with your SQL commands */
CREATE TABLE usertasks (
 usertaskid BIGSERIAL PRIMARY KEY,
 userid BIGINT NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
 taskid BIGINT NOT NULL REFERENCES tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
 status VARCHAR(11) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in-progress','completed')),
 permission_level VARCHAR(10) NOT NULL DEFAULT 'view' CHECK(permission_level IN ('view','edit','delete')),
 assigned_on TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
 assigned_by BIGINT REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);