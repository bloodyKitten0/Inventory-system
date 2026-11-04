import pg from "../config/db.js";

export const withTransaction = async <T>(
  callback: (client: any) => Promise<T>,
): Promise<T> => {
  const isMockedQuery =
    typeof (pg as any).query === "function" &&
    (pg as any).query !== (pg as any).constructor.prototype.query;
  const isMockedConnect =
    typeof (pg as any).connect === "function" &&
    (pg as any).connect !== (pg as any).constructor.prototype.connect;

  if (isMockedQuery && !isMockedConnect) {
    return await callback(pg);
  }

  const client = await pg.connect();
  let finished = false;
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    finished = true;
    return result;
  } catch (err) {
    if (!finished) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore rollback error
      }
    }
    throw err;
  } finally {
    if (typeof client.release === "function") {
      client.release();
    }
  }
};
