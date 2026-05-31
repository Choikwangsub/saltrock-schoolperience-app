import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { syncAllPendingRecords } from "@/lib/notion/sync";

export async function POST(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { onlyFailed?: boolean };
    const result = await syncAllPendingRecords({
      onlyFailed: Boolean(body.onlyFailed),
    });

    revalidatePath("/hub/notion");
    revalidatePath("/hub/gallery");
    revalidatePath("/hub/calendar");
    revalidatePath("/hub");
    revalidatePath("/contact");
    revalidatePath("/calendar");
    revalidatePath("/gallery");

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: result.message,
          results: result.results,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      results: result.results,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Notion sync 실패" },
      { status: 500 },
    );
  }
}
