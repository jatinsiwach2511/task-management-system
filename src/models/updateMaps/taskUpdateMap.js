import { filterUndefinedFromObject } from "../../utils";

module.exports = (task) => {
  const map = {
    title: task.title,
    description: task.description,
    due_on: task.description,
    status: task.status,
    updated_by: task.updatedBy,
  };

  return filterUndefinedFromObject(map);
};
