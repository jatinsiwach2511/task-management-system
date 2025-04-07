/* Replace with your SQL commands */
CREATE OR REPLACE FUNCTION update_task_due_date_reminders() 
    RETURNS TRIGGER AS $$
    DECLARE
    is_due_soon BOOLEAN;
    BEGIN

      IF NEW.due_on IS DISTINCT FROM OLD.due_on THEN
      is_due_soon := (NEW.due_on <= (NOW() + INTERVAL '1 hour'));

      IF is_due_soon THEN 
      
      DELETE FROM reminders WHERE usertaskid IN (SELECT ut.id FROM usertasks AS ut WHERE ut.taskid = NEW.id);

      RAISE NOTICE 'Deleted reminders for task % as new due date is within 1 hour', NEW.id;

      ELSE
       
      UPDATE reminders SET reminder_time = NEW.due_on - INTERVAL '1 hour',type = 'DEFAULT' ,status = 'PENDING' WHERE usertaskid IN (SELECT ut.id FROM usertasks AS ut WHERE ut.taskid = NEW.id);

     END IF;
     END IF;

     RETURN NEW;
     END;
     $$ LANGUAGE plpgsql;


CREATE TRIGGER update_task_due_date_trigger 
AFTER UPDATE OF due_on ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_task_due_date_reminders();