import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="pt-16 min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-x-auto scrollbar-thin">
        {children}
      </div>
    </div>
  );
}
