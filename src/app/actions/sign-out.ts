"use server";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { redirect } from "next/navigation";

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
