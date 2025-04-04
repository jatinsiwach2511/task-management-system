import { filterUndefinedFromObject } from "../../utils";

module.exports = (task) => {
  const map = {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    updated_by: task.updated_by,
    id: task.id,
    due_on: task.due_on,
  };

  return filterUndefinedFromObject(map);
};
