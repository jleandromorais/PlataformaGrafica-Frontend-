import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    // Trocamos min-h-screen por h-screen e adicionamos overflow-hidden
    <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden">
      <Sidebar />
      {/* O main agora tem h-full, obrigando a rolagem a acontecer APENAS aqui dentro */}
      <main className="flex-1 h-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}