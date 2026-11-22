import type { GradeTier } from "@/types/gamification";

export type LessonType = "video" | "interactive_code" | "article" | "quiz";

export interface CourseLessonItem {
  id: number;
  courseId: number;
  slug: string;
  titleAr: string;
  lessonType: LessonType;
  durationSeconds: number;
  durationLabelAr: string;
  xpReward: number;
  sortOrder: number;
  isFreePreview: boolean;
  bunnyVideoId: string | null;
  starterCode: string | null;
  solutionNotes: string | null;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface CourseDetail {
  id: number;
  slug: string;
  titleAr: string;
  descriptionAr: string;
  grade: GradeTier | "all";
  track: string;
  priceEgp: number;
  isFree: boolean;
  isEntitled: boolean;
  lessons: CourseLessonItem[];
}

export interface PdfNotePage {
  pageNumber: number;
  headingAr: string;
  paragraphsAr: string[];
  codeSample?: string | null;
}

export type StoreProductType = "pdf_note" | "printed_book";

export interface StoreProduct {
  id: number;
  slug: string;
  titleAr: string;
  descriptionAr: string;
  productType: StoreProductType;
  grade: GradeTier | "all";
  priceEgp: number;
  stockCount: number | null;
  isUnlocked: boolean;
  pages?: PdfNotePage[];
}

export type BundleTier = "single_lesson" | "monthly_bundle" | "full_term_bundle";

export interface StorePackage {
  id: number;
  slug: string;
  tier: BundleTier;
  titleAr: string;
  badgeAr: string;
  descriptionAr: string;
  grade: GradeTier | "all";
  priceEgp: number;
  originalPriceEgp: number;
  discountPercent: number;
  featuresAr: string[];
  includedCourseIds: number[];
  includedProductIds: number[];
}

export type VoucherDiscountType = "percent" | "fixed_egp" | "full_unlock";

export type VoucherAppliesTo = "all" | "course" | "product" | "package";

export interface VoucherRecord {
  id: number;
  code: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  appliesTo: VoucherAppliesTo;
  targetId: number | null;
  targetLabelAr: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  channelNoteAr: string;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "paymob" | "fawry" | "voucher" | "cod";

export interface OrderRecord {
  id: number;
  orderCode: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  subtotalEgp: number;
  discountEgp: number;
  totalEgp: number;
  voucherCode: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingGovernorate: string | null;
  shippingAddress: string | null;
  itemsSummaryAr: string;
  createdAt: string;
}

export interface CoursesBootstrapData {
  mode: "demo" | "supabase";
  studentName: string;
  studentPhone: string;
  courses: CourseDetail[];
}

export interface StoreBootstrapData {
  mode: "demo" | "supabase";
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  products: StoreProduct[];
  packages: StorePackage[];
  courses: Array<{ id: number; titleAr: string; priceEgp: number; isEntitled: boolean }>;
  recentOrders: OrderRecord[];
  paymobConfigured: boolean;
  fawryConfigured: boolean;
}

export interface AdminCommerceBootstrapData {
  vouchers: VoucherRecord[];
  orders: OrderRecord[];
  targets: {
    courses: Array<{ id: number; titleAr: string }>;
    products: Array<{ id: number; titleAr: string }>;
    packages: Array<{ id: number; titleAr: string }>;
  };
}
