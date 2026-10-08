import type { QueryResult } from "pg";

const checkRow = (result: QueryResult) => {
  return result.rows.length > 0;
};

export default checkRow;
