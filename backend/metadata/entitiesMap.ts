import fs from "fs";
import path from "path";

let entityMapCache: Record<string, string> | undefined;

export function getEntityMap(): Record<string, string> {
  if (!entityMapCache) {
    const filePath = path.join(__dirname, "../../../config/entities-map.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    entityMapCache = JSON.parse(raw) as Record<string, string>;
  }
  return entityMapCache;
}


export function resolveEntityName(apiname: string): string | undefined {
  const map = getEntityMap();
  return map[apiname];
}
