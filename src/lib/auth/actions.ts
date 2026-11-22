"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEFAULT_DEMO_COOKIE,
  DEMO_SESSION_COOKIE_NAME,
  isValidGrade,
  isValidRole,
  parseDemoSession,
  type DemoSessionCookie,
} from "@/lib/auth/demo-cookie";
import { isValidAvatarFrame } from "@/lib/gamification/frames";
import { isDemoModeEnabled, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AvatarFrameId, GradeTier, UserRole } from "@/types/gamification";

export interface AuthFormState {
  error?: string;
  success?: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function writeDemoCookieValue(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  value: DemoSessionCookie,
) {
  cookieStore.set(DEMO_SESSION_COOKIE_NAME, JSON.stringify(value), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "اكتب البريد الإلكتروني وكلمة المرور الأول." };
  }

  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const current = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE_NAME)?.value);
    writeDemoCookieValue(cookieStore, {
      ...current,
      email,
    });
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "بيانات الدخول مش مظبوطة — اتأكد من الإيميل والباسورد." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rawGrade = formData.get("grade");
  const grade: GradeTier = isValidGrade(rawGrade) ? rawGrade : "grade_10";

  if (!fullName || fullName.length < 2) {
    return { error: "اكتب اسمك الكامل عشان نجهّز بطاقة اللاعب." };
  }
  if (!email || !email.includes("@")) {
    return { error: "اكتب بريد إلكتروني صحيح." };
  }
  if (password.length < 6) {
    return { error: "كلمة المرور لازم تكون 6 حروف أو أرقام على الأقل." };
  }

  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    writeDemoCookieValue(cookieStore, {
      ...DEFAULT_DEMO_COOKIE,
      fullName,
      email,
      grade,
      role: "student",
    });
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        grade,
      },
    },
  });

  if (error) {
    return { error: "تعذر إنشاء الحساب حالياً — جرب بريد تاني أو راجع البيانات." };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    success: "تم إنشاء حسابك في CodeVerse! راجع بريدك لتأكيد التفعيل ثم سجل دخولك.",
  };
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  if (isDemoModeEnabled()) {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_SESSION_COOKIE_NAME);
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function enterDemoModeAction(): Promise<void> {
  if (!isDemoModeEnabled()) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  writeDemoCookieValue(cookieStore, DEFAULT_DEMO_COOKIE);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function switchDemoRoleAction(nextRole: UserRole): Promise<ActionResult> {
  if (!isDemoModeEnabled()) {
    return { ok: false, error: "تبديل الأدوار غير متاح في وضع الإنتاج." };
  }

  if (!isValidRole(nextRole)) {
    return { ok: false, error: "نوع الدور غير صحيح." };
  }

  const cookieStore = await cookies();
  const current = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE_NAME)?.value);
  writeDemoCookieValue(cookieStore, {
    ...current,
    role: nextRole,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateGradeAction(nextGrade: GradeTier): Promise<ActionResult> {
  if (!isValidGrade(nextGrade)) {
    return { ok: false, error: "الصف الدراسي غير صحيح." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("users")
        .update({ grade: nextGrade })
        .eq("id", user.id);

      if (error) {
        return { ok: false, error: "تعذر تحديث الصف الدراسي." };
      }

      revalidatePath("/", "layout");
      return { ok: true };
    }
  }

  if (!isDemoModeEnabled()) {
    return { ok: false, error: "يجب تسجيل الدخول أولاً." };
  }

  const cookieStore = await cookies();
  const current = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE_NAME)?.value);
  writeDemoCookieValue(cookieStore, {
    ...current,
    grade: nextGrade,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAvatarFrameAction(nextFrame: AvatarFrameId): Promise<ActionResult> {
  if (!isValidAvatarFrame(nextFrame)) {
    return { ok: false, error: "إطار الأفاتار غير مدعوم." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("users")
        .update({ avatar_frame: nextFrame })
        .eq("id", user.id);

      if (error) {
        return { ok: false, error: "تعذر حفظ إطار الأفاتار." };
      }

      revalidatePath("/", "layout");
      return { ok: true };
    }
  }

  if (!isDemoModeEnabled()) {
    return { ok: false, error: "يجب تسجيل الدخول أولاً." };
  }

  const cookieStore = await cookies();
  const current = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE_NAME)?.value);
  writeDemoCookieValue(cookieStore, {
    ...current,
    avatarFrame: nextFrame,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
