const crypto = require("crypto");

const models = new Map();
const clone = (value) => (value == null ? value : structuredClone(value));
const getPath = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);
const comparable = (value) => (value instanceof Date ? value.getTime() : String(value));

function matches(document, filter = {}) {
  return Object.entries(filter).every(([path, expected]) => {
    if (path === "$or") return expected.some((entry) => matches(document, entry));
    if (path === "$and") return expected.every((entry) => matches(document, entry));

    const actual = getPath(document, path);
    if (expected && typeof expected === "object" && !(expected instanceof Date) && !Array.isArray(expected)) {
      return Object.entries(expected).every(([operator, value]) => {
        if (operator === "$in") return value.some((candidate) => comparable(candidate) === comparable(actual));
        if (operator === "$gte") return comparable(actual) >= comparable(value);
        if (operator === "$gt") return comparable(actual) > comparable(value);
        if (operator === "$lte") return comparable(actual) <= comparable(value);
        if (operator === "$lt") return comparable(actual) < comparable(value);
        if (operator === "$ne") return comparable(actual) !== comparable(value);
        if (operator === "$eq") return comparable(actual) === comparable(value);
        return false;
      });
    }

    if (Array.isArray(expected)) return expected.some((value) => comparable(value) === comparable(actual));
    return comparable(actual) === comparable(expected);
  });
}

function project(document, selection) {
  if (!selection) return document;
  const fields = selection.split(/\s+/).filter(Boolean);
  if (fields.some((field) => field.startsWith("-"))) {
    for (const field of fields.filter((field) => field.startsWith("-"))) delete document[field.slice(1)];
    return document;
  }
  const allowed = new Set(["_id", ...fields]);
  return Object.fromEntries(Object.entries(document).filter(([key]) => allowed.has(key)));
}

async function populate(document, instructions) {
  if (!document) return document;
  for (const { path, selection } of instructions) {
    const referencedModel = models.get(path === "recordedBy" || path === "inspector" || path === "assignedTo" || path === "preparedBy" || path === "reviewedBy" ? "User" : "");
    if (!referencedModel || !document[path]) continue;
    const referenced = referencedModel.records.get(String(document[path]));
    document[path] = referenced ? project(clone(referenced), selection) : null;
  }
  return document;
}

class MemoryQuery {
  constructor(executor, multiple = false, materialize = (value) => value) {
    this.executor = executor;
    this.multiple = multiple;
    this.materialize = materialize;
    this.sortBy = null;
    this.offset = 0;
    this.maxResults = null;
    this.populations = [];
    this.selection = null;
  }

  populate(path, selection) {
    this.populations.push({ path, selection });
    return this;
  }

  sort(sortBy) {
    this.sortBy = sortBy;
    return this;
  }

  skip(offset) {
    this.offset = Math.max(0, Number(offset) || 0);
    return this;
  }

  limit(maxResults) {
    this.maxResults = Math.max(0, Number(maxResults) || 0);
    return this;
  }

  select(selection) {
    this.selection = selection;
    return this;
  }

  async exec() {
    let result = await this.executor();
    if (this.multiple) {
      result = result.map(clone);
      if (this.sortBy) {
        const [[path, direction]] = Object.entries(this.sortBy);
        result.sort((left, right) => {
          const a = getPath(left, path);
          const b = getPath(right, path);
          const comparison = comparable(a) < comparable(b) ? -1 : comparable(a) > comparable(b) ? 1 : 0;
          return comparison * (direction < 0 ? -1 : 1);
        });
      }
      result = result.slice(this.offset, this.maxResults == null ? undefined : this.offset + this.maxResults);
      result = await Promise.all(result.map((document) => populate(document, this.populations)));
      return result.map((document) => this.materialize(project(document, this.selection)));
    }

    if (!result) return null;
    result = await populate(clone(result), this.populations);
    return this.materialize(project(result, this.selection));
  }

  then(resolve, reject) { return this.exec().then(resolve, reject); }
  catch(reject) { return this.exec().catch(reject); }
  finally(callback) { return this.exec().finally(callback); }
}

function resolveExpression(document, expression) {
  if (typeof expression === "string" && expression.startsWith("$")) return getPath(document, expression.slice(1));
  if (expression && typeof expression === "object" && !Array.isArray(expression)) {
    if (expression.$dateToString) {
      const date = resolveExpression(document, expression.$dateToString.date);
      if (!date) return null;
      const parsed = new Date(date);
      const format = expression.$dateToString.format;
      if (format === "%Y-%m") return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
      return parsed.toISOString();
    }
    return Object.fromEntries(Object.entries(expression).map(([key, value]) => [key, resolveExpression(document, value)]));
  }
  return expression;
}

function conditionMatches(document, condition) {
  if (condition?.$eq) return comparable(resolveExpression(document, condition.$eq[0])) === comparable(resolveExpression(document, condition.$eq[1]));
  if (condition?.$in) {
    const value = resolveExpression(document, condition.$in[0]);
    const options = resolveExpression(document, condition.$in[1]);
    return options?.some((option) => comparable(option) === comparable(value)) || false;
  }
  return Boolean(resolveExpression(document, condition));
}

function aggregate(records, pipeline) {
  let rows = records.map(clone);
  for (const stage of pipeline) {
    if (stage.$match) {
      rows = rows.filter((document) => matches(document, stage.$match));
    } else if (stage.$group) {
      const groups = new Map();
      for (const document of rows) {
        const id = resolveExpression(document, stage.$group._id);
        const key = JSON.stringify(id);
        if (!groups.has(key)) {
          const group = { _id: id };
          for (const [field, expression] of Object.entries(stage.$group)) {
            if (field !== "_id") group[field] = expression.$avg ? { sum: 0, count: 0 } : 0;
          }
          groups.set(key, group);
        }
        const group = groups.get(key);
        for (const [field, expression] of Object.entries(stage.$group)) {
          if (field === "_id") continue;
          if (expression.$sum !== undefined) {
            const operand = expression.$sum;
            const amount = typeof operand === "object" && operand.$cond
              ? (conditionMatches(document, operand.$cond[0]) ? resolveExpression(document, operand.$cond[1]) : resolveExpression(document, operand.$cond[2]))
              : resolveExpression(document, operand);
            group[field] += Number(amount) || 0;
          } else if (expression.$avg !== undefined) {
            const accumulator = group[field];
            const amount = Number(resolveExpression(document, expression.$avg));
            if (Number.isFinite(amount)) {
              accumulator.sum += amount;
              accumulator.count += 1;
            }
          }
        }
      }
      rows = [...groups.values()].map((group) => {
        for (const [field, expression] of Object.entries(stage.$group)) {
          if (field !== "_id" && expression.$avg !== undefined) {
            const accumulator = group[field];
            group[field] = accumulator.count ? accumulator.sum / accumulator.count : null;
          }
        }
        return group;
      });
    } else if (stage.$sort) {
      const [[path, direction]] = Object.entries(stage.$sort);
      rows.sort((left, right) => {
        const a = getPath(left, path);
        const b = getPath(right, path);
        const comparison = comparable(a) < comparable(b) ? -1 : comparable(a) > comparable(b) ? 1 : 0;
        return comparison * (direction < 0 ? -1 : 1);
      });
    } else if (stage.$limit !== undefined) {
      rows = rows.slice(0, stage.$limit);
    } else if (stage.$skip !== undefined) {
      rows = rows.slice(stage.$skip);
    }
  }
  return rows;
}

function createModel(name, { defaults = {}, validate = () => {}, beforeSave = (record) => record, methods = {} } = {}) {
  const records = new Map();

  class Model {
    static get modelName() { return name; }
    static get records() { return records; }

    static materialize(record) {
      if (!record) return null;
      const document = clone(record);
      for (const [methodName, method] of Object.entries(methods)) {
        Object.defineProperty(document, methodName, { value: method, enumerable: false });
      }
      return document;
    }

    static async create(input) {
      const now = new Date();
      const provided = Object.fromEntries(Object.entries(clone(input)).filter(([, value]) => value !== undefined));
      const record = { ...Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, typeof value === "function" ? value() : clone(value)])), ...provided };
      record._id = record._id || crypto.randomBytes(12).toString("hex");
      record.createdAt = record.createdAt || now;
      record.updatedAt = now;
      await beforeSave(record);
      validate(record);
      records.set(String(record._id), clone(record));
      return Model.materialize(record);
    }

    static async insertMany(inputs) {
      return Promise.all(inputs.map((input) => Model.create(input)));
    }

    static find(filter = {}) {
      return new MemoryQuery(() => [...records.values()].filter((record) => matches(record, filter)), true, Model.materialize);
    }

    static findOne(filter = {}) {
      return new MemoryQuery(() => [...records.values()].find((record) => matches(record, filter)), false, Model.materialize);
    }

    static findById(id) {
      return new MemoryQuery(() => records.get(String(id)), false, Model.materialize);
    }

    static findByIdAndUpdate(id, update, options = {}) {
      return new MemoryQuery(async () => {
        const current = records.get(String(id));
        if (!current) return null;
        const changes = update?.$set || update;
        const record = { ...clone(current), ...clone(changes), _id: current._id, updatedAt: new Date() };
        if (options.runValidators) validate(record);
        await beforeSave(record);
        records.set(String(id), clone(record));
        return record;
      }, false, Model.materialize);
    }

    static findByIdAndDelete(id) {
      return new MemoryQuery(() => {
        const record = records.get(String(id));
        if (!record) return null;
        records.delete(String(id));
        return record;
      }, false, Model.materialize);
    }

    static async countDocuments(filter = {}) {
      return [...records.values()].filter((record) => matches(record, filter)).length;
    }

    static async deleteMany(filter = {}) {
      let deletedCount = 0;
      for (const [id, record] of records) {
        if (matches(record, filter)) {
          records.delete(id);
          deletedCount += 1;
        }
      }
      return { acknowledged: true, deletedCount };
    }

    static async aggregate(pipeline = []) {
      return aggregate([...records.values()], pipeline);
    }
  }

  models.set(name, Model);
  return Model;
}

module.exports = { createModel };
