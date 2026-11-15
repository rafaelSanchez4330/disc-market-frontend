import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "../shared/ui/Footer";
import { Navbar } from "../shared/ui/Navbar";

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div key={location.pathname} className="animate-page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
