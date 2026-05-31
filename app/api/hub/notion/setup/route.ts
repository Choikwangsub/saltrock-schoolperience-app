import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminFromRequest } from "@/lib/api/adminGuard";
import { ensureNotionDatabases } from "@/lib/notion/setup";

export async function POST(request: Request) {
  const unauthorized = assertAdminFromRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await ensureNotionDatabases();
    revalidatePath("/hub/notion");

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
      { ok: false, message: error instanceof Error ? error.message : "Notion setup 실패" },
      { status: 500 },
    );
  }
}
