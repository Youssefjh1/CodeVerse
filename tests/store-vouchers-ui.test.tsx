import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VouchersShippingHub } from "@/components/admin/vouchers-shipping-hub";
import { StoreHub } from "@/components/store/store-hub";
import {
  getAdminCommerceData,
  getStoreBootstrapData,
} from "@/lib/data/phase4-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

const DEMO_STUDENT = {
  mode: "demo" as const,
  userId: "store-test-student",
  fullName: "يوسف طارق",
  email: "youssef@codeverse.eg",
  phone: "01019482735",
  grade: "grade_11" as const,
  role: "student" as const,
  avatarFrame: "electric_violet" as const,
};

const DEMO_ADMIN = {
  ...DEMO_STUDENT,
  userId: "store-test-admin",
  role: "admin" as const,
};

describe("Store, Protected PDF Viewer, Printed Book Checkout & Admin Vouchers", () => {
  it("renders flexible packages, opens watermarked PDF viewer without download links, submits book order, and redeems voucher", async () => {
    const initialData = await getStoreBootstrapData(DEMO_STUDENT);

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/store/orders") {
        return new Response(
          JSON.stringify({
            order: {
              id: 901,
              orderCode: "ORD-1901",
              userId: DEMO_STUDENT.userId,
              status: "pending",
              paymentMethod: "cod",
              paymentReference: "ORD-1901",
              subtotalEgp: 220,
              discountEgp: 0,
              totalEgp: 220,
              voucherCode: null,
              shippingName: "يوسف طارق",
              shippingPhone: "01019482735",
              shippingGovernorate: "القاهرة",
              shippingAddress: "12 شارع التحرير، الدقي",
              itemsSummaryAr: "كتاب CodeVerse المطبوع (×1)",
              createdAt: "2026-11-22T12:00:00.000Z",
            },
          }),
          { status: 201 },
        );
      }

      if (url === "/api/vouchers/redeem") {
        return new Response(
          JSON.stringify({
            code: "CODE-TERM-2026",
            discountType: "full_unlock",
            targetLabelAr: "باقة الترم الكامل الشاملة",
            unlockedCourseIds: [1, 2, 3],
            unlockedProductIds: [1, 2],
            messageAr: "تم تفعيل باقة الترم الكامل بنجاح!",
          }),
          { status: 200 },
        );
      }

      return new Response("{}", { status: 404 });
    });

    render(<StoreHub initialData={initialData} />);

    // Flexible Packages
    expect(screen.getByText(/باقة الحصة الواحدة/i)).toBeInTheDocument();
    expect(screen.getByText(/الباقة الشهرية المتكاملة/i)).toBeInTheDocument();
    expect(screen.getByText(/باقة الترم الكامل الشاملة/i)).toBeInTheDocument();

    // Open Protected PDF Viewer (Note 1 is unlocked)
    fireEvent.click(screen.getByRole("button", { name: /فتح في القارئ المحمي/i }));
    const pdfWatermark = screen.getByTestId("pdf-watermark");
    expect(pdfWatermark).toHaveTextContent("يوسف طارق");
    expect(pdfWatermark).toHaveTextContent("01019482735");
    expect(document.querySelector("a[download]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "إغلاق عارض PDF" }));

    // Open Printed Book Checkout Modal & submit shipping order
    const orderBtns = screen.getAllByRole("button", { name: /اطلب الكتاب للشحن/i });
    fireEvent.click(orderBtns[0]);
    fireEvent.change(screen.getByLabelText(/العنوان التفصيلي/i), {
      target: { value: "12 شارع التحرير، الدقي" },
    });
    fireEvent.click(screen.getByRole("button", { name: /تأكيد طلب الشحن/i }));

    await waitFor(() => {
      expect(screen.getByTestId("order-confirmation")).toHaveTextContent("ORD-1901");
    });
    fireEvent.click(screen.getByRole("button", { name: "تم" }));

    // Open Redeem Code Modal & redeem CODE-TERM-2026
    fireEvent.click(screen.getByRole("button", { name: /تفعيل كود سنتر \/ خصم/i }));
    fireEvent.change(screen.getByLabelText(/إدخال كود التفعيل/i), {
      target: { value: "CODE-TERM-2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: /تفعيل الكود الآن/i }));

    await waitFor(() => {
      expect(screen.getByText(/تم تفعيل باقة الترم الكامل بنجاح/i)).toBeInTheDocument();
    });
  });

  it("allows admin to generate batch vouchers and update book shipping order status", async () => {
    const commerce = await getAdminCommerceData(DEMO_ADMIN);

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/admin/vouchers") {
        return new Response(
          JSON.stringify({
            vouchers: [
              {
                id: 501,
                code: "CODE-9A8B-7C6D",
                discountType: "full_unlock",
                discountValue: 0,
                appliesTo: "package",
                targetId: 3,
                targetLabelAr: "باقة الترم الكامل الشاملة",
                maxUses: 1,
                currentUses: 0,
                expiresAt: null,
                isActive: true,
                channelNoteAr: "إنستاباي",
                createdAt: "2026-11-22T12:00:00.000Z",
              },
            ],
          }),
          { status: 201 },
        );
      }

      if (url === "/api/admin/orders") {
        const targetOrder =
          commerce.orders.find((o) => o.orderCode === "ORD-1041") ??
          commerce.orders[0];
        return new Response(
          JSON.stringify({
            order: {
              ...targetOrder,
              status: "shipped",
            },
          }),
          { status: 200 },
        );
      }

      return new Response("{}", { status: 404 });
    });

    render(<VouchersShippingHub initialData={commerce} />);

    fireEvent.click(screen.getByRole("button", { name: /توليد دفعة الأكواد الآن/i }));
    await waitFor(() => {
      expect(screen.getByTestId("generated-voucher-batch")).toHaveTextContent(
        "CODE-9A8B-7C6D",
      );
    });

    fireEvent.click(screen.getByRole("tab", { name: /لوحة شحن الكتب/i }));
    const firstOrderSelect = screen.getByLabelText(/تغيير حالة الطلب ORD-1041/i);
    fireEvent.change(firstOrderSelect, { target: { value: "shipped" } });

    await waitFor(() => {
      expect((firstOrderSelect as HTMLSelectElement).value).toBe("shipped");
    });
  });
});
