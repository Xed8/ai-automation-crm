import type { Json } from "@/types/supabase";

export type JsonObject = { [key: string]: Json | undefined };

export function isJsonObject(
  value: Json | null | undefined,
): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
