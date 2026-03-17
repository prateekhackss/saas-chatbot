import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const db = supabase as any;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Security pass: confirm the conversation belongs to a client owned by this user
    const { data: conversation, error: fetchError } = await db
      .from("conversations")
      .select("id, resolved, client_id, clients!inner(user_id)")
      .eq("id", id)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.clients?.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Toggle resolved state
    const newState = !conversation.resolved;

    const { error: updateError } = await db
      .from("conversations")
      .update({ resolved: newState })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update resolved status" }, { status: 500 });
    }

    return NextResponse.json({ resolved: newState }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
