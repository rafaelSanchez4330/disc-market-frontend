import { Outlet } from "react-router-dom";
import { Footer } from "../shared/ui/Footer";
import { Navbar } from "../shared/ui/Navbar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
