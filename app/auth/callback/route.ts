import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(
      new URL("/?auth_error=missing_code", requestUrl.origin)
    );
  }

  const cookieStore = await cookies();

  const response = NextResponse.redirect(
    new URL(next.startsWith("/") ? next : "/", requestUrl.origin)
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "OAuth code exchange error:",
      JSON.stringify(error, null, 2)
    );

    return NextResponse.redirect(
      new URL(
        `/?auth_error=${encodeURIComponent(error.message)}`,
        requestUrl.origin
      )
    );
  }

  return response;
}