import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

vi.mock("@/lib/auth/actions", () => ({
  signInAction: vi.fn(),
  signUpAction: vi.fn(),
  enterDemoModeAction: vi.fn(),
}));

describe("CodeVerse Auth Forms", () => {
  it("renders RegisterForm with all 3 Egyptian high school grade options", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/الاسم الكامل/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/رقم الموبايل/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "أولى ثانوي" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "تانية ثانوي" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "صفوف أخرى" })).toBeInTheDocument();
  });

  it("hides instant Demo Mode CTA in LoginForm when demoModeEnabled is false and shows it when true", () => {
    const { rerender } = render(<LoginForm demoModeEnabled={false} />);
    expect(screen.queryByRole("button", { name: /دخول تجريبي فوري/i })).not.toBeInTheDocument();

    rerender(<LoginForm demoModeEnabled={true} />);
    expect(screen.getByRole("button", { name: /دخول تجريبي فوري/i })).toBeInTheDocument();
  });
});
