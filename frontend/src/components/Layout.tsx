
import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}
