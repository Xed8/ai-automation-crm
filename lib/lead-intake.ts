import type { Database } from "@/types/supabase";
import { isJsonObject } from "@/lib/json";

export type IngestLeadFromFormResult = {
  error?: string;
  leadId?: string;
  status?: string;
  success?: boolean;
};

export function parseIngestLeadFromFormResult(
  data: Database["public"]["Functions"]["ingest_lead_from_form"]["Returns"],
): IngestLeadFromFormResult | null {
  if (!isJsonObject(data)) {
    return null;
  }

  return {
    error: typeof data.error === "string" ? data.error : undefined,
    leadId: typeof data.lead_id === "string" ? data.lead_id : undefined,
    status: typeof data.status === "string" ? data.status : undefined,
    success: typeof data.success === "boolean" ? data.success : undefined,
  };
}
