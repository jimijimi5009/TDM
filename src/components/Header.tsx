import { Database } from "lucide-react";
import { NavLink } from "./NavLink";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Database className="h-8 w-8 text-primary" />
            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-card bg-primary" />
          </div>
          <span className="text-xl font-semibold text-foreground">TestDataMangement</span>
        </div>
        
        <nav className="flex items-center gap-6">
          <NavLink
            to="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
            activeClassName="text-foreground font-semibold"
          >
            Test Data
          </NavLink>
          <NavLink
            to="/api-call"
            className="text-muted-foreground transition-colors hover:text-foreground"
            activeClassName="text-foreground font-semibold"
          >
            API Call
          </NavLink>
          <NavLink
            to="/service-call"
            className="text-muted-foreground transition-colors hover:text-foreground"
            activeClassName="text-foreground font-semibold"
          >
            Service Call
          </NavLink>
        </nav>

        <div />
      </div>
    </header>
  );
};

export default Header;
