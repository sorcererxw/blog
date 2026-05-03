import { Client } from "@notionhq/client";

export const getPrimaryDataSourceId = async (
  notion: Client,
  databaseId: string,
): Promise<string> => {
  const database = await notion.databases.retrieve({
    database_id: databaseId,
  });

  if (database.object !== "database" || !("data_sources" in database)) {
    throw new Error(`Notion database ${databaseId} did not return a full database response.`);
  }

  const dataSourceId = database.data_sources[0]?.id;

  if (!dataSourceId) {
    throw new Error(`Notion database ${databaseId} does not expose a data source.`);
  }

  return dataSourceId;
};
