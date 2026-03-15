import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const updateClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  config: z.object({
    brandName: z.string().min(1, "Brand name is required"),
    welcomeMessage: z.string().min(1, "Welcome message is required"),
    primaryColor: z.string().min(1, "Primary color is required"),
    textColor: z.string().min(1, "Text color is required"),
    position: z.enum(["bottom-right", "bottom-left"]),
    tone: z.string().min(1, "Tone is required"),
    fallbackMessage: z.string().min(1, "Fallback message is required"),
    logoUrl: z.string().url().optional().or(z.literal("")),
    suggestedQuestions: z.array(z.string()),
  }),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const body = await req.json();
    const result = updateClientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.issues },
        { status: 400 },
      );
    }

    const { name, slug, config } = result.data;

    const { data: existingClient, error: existingClientError } = await db
      .from("clients")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existingClientError) {
      console.error("Failed to verify client:", existingClientError);
      return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data: duplicateSlug } = await db
      .from("clients")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (duplicateSlug) {
      return NextResponse.json({ error: "Client slug already exists" }, { status: 409 });
    }

    const { data, error } = await db
      .from("clients")
      .update({
        name,
        slug,
        config: config as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Client slug already exists" }, { status: 409 });
      }

      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Client updated successfully",
      client: data,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
