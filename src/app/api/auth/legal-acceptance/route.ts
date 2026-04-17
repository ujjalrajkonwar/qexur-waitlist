import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const parsed = authRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid authentication payload." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 503 });
  }

  const { mode, email, password } = parsed.data;
  const legalData = {
    termsAcceptedAt: new Date().toISOString(),
    termsVersion: "1.0",
    agreedToTerms: true,
  };

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: legalData,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: data.session
        ? "Signed up successfully and persisted legal acceptance metadata."
        : "Sign-up created. Enter the 8-digit verification code sent to your email to complete signup.",
      termsAcceptedAt: legalData.termsAcceptedAt,
      termsVersion: legalData.termsVersion,
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...(data.user?.user_metadata ?? {}),
      ...legalData,
    },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Signed in and persisted legal acceptance metadata for ${email}.`,
    termsAcceptedAt: legalData.termsAcceptedAt,
    termsVersion: legalData.termsVersion,
  });
}