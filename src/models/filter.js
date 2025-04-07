class Filter {
  static types = Object.freeze({
    TASKS: ["status", "priority", "title", "due_in"],
  });

  static getAllowedFilter(type) {
    switch (type) {
      case "TASKS":
        return Object.freeze(Filter.types.TASKS);
      default:
        return Object.freeze([]);
    }
  }

  static normalizeValue(key, value) {
    if (["status", "priority"].includes(key)) {
      if (Array.isArray(value)) {
        return value.map((v) => v.toUpperCase());
      }
      return value.toUpperCase();
    }
    return value;
  }

  static fromRequest(req, type, isExport = false) {
    const filter = {
      allowedFilters: [...Filter.getAllowedFilter(type)],
    };

    const params = req.query;

    const page = params.page ? Math.max(parseInt(params.page, 10) - 1, 0) : 0;
    const limit = params.limit ? Math.max(parseInt(params.limit, 10), 1) : 50;
    const offset = params.offset ? Math.max(parseInt(params.offset, 10), 0) : 0;

    filter.page = page;
    filter.limit = limit;
    filter.offset = offset;

    params.order && (filter.order = params.order);
    params.direction && (filter.direction = params.direction);
    params.allResults &&
      (filter.allResults = params.allResults.toLowerCase() === "true");

    if (isExport) filter.allResults = true;

    filter.filters = {};

    const source = params.filter || params;

    filter.allowedFilters.forEach((key) => {
      if (source[key]) {
        filter.filters[key] = Filter.normalizeValue(key, source[key]);
      }
    });

    return {
      ...filter,
      allowedFilters: [...filter.allowedFilters],
      filters: { ...filter.filters },
    };
  }
}

export default Filter;
