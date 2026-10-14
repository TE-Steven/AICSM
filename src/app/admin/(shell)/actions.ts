"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { seedAicsm } from "@/lib/seedAicsm";
import { withSuccess } from "@/lib/toast";

/** 初始化基礎資料：行業別、產品模組、現有客戶、各行業健檢項目。冪等，只補缺的，不覆蓋既有資料。 */
export async function seedAicsmAction(): Promise<void> {
  await requireAdmin();

  const report = await seedAicsm(prisma);

  revalidatePath("/admin", "layout");
  revalidatePath("/tv");

  const parts = [
    report.industries && `${report.industries} 個行業別`,
    report.modules && `${report.modules} 個模組`,
    report.companies && `${report.companies} 家公司`,
    report.checkItems && `${report.checkItems} 個檢核項目`,
  ].filter(Boolean);

  redirect(
    withSuccess(
      "/admin",
      parts.length ? `初始化完成，新增了 ${parts.join("、")}` : "基礎資料已齊全，沒有需要新增的項目"
    )
  );
}
