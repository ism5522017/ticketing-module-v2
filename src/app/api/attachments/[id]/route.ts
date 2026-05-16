import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAttachmentBytes } from "@/lib/storage/upload";
import { isImage } from "@/lib/storage/limits";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const result = await fetchAttachmentBytes(id);
  if (!result) return new NextResponse("Not found", { status: 404 });

  const disposition = isImage(result.mimeType) ? "inline" : "attachment";
  return new NextResponse(result.bytes, {
    headers: {
      "Content-Type": result.mimeType,
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=300",
    },
  });
}
