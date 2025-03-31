import { useState } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuthContext";
import { Home, User, LogOut, Menu, X, Plus, Theater, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Layout() {
  const {
    currentUser,
    isLoading,
    isAuthenticated,
    logout
  } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-6">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3 mx-auto" />
        </div>
      </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{
      from: location
    }} replace />;
  }
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    {
      path: "/",
      icon: <Home className="h-5 w-5" />,
      label: "Dashboard"
    },
    {
      path: "/performances",
      icon: <Theater className="h-5 w-5" />,
      label: "Performances"
    },
    {
      path: "/profile",
      icon: <User className="h-5 w-5" />,
      label: "Profile"
    }
  ];

  const isLinkActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
  };

  return <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex md:w-64 flex-col bg-sidebar border-r">
        <div className="flex h-16 items-center px-4 border-b">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-md bg-stage-purple p-1">
              <Theater className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">StageVault</h1>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-auto p-4">
          <ul className="space-y-2">
            {navItems.map(item => <li key={item.path}>
                <Link to={item.path} className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${isLinkActive(item.path) ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>)}
          </ul>
        </nav>
        
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={currentUser?.profilePicture} alt={currentUser?.name} />
              <AvatarFallback>
                {currentUser?.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>
      
      <div className="flex flex-col w-full overflow-hidden">
        <header className="flex md:hidden h-16 items-center justify-between border-b px-4">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            <Menu className="h-6 w-6" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-md bg-stage-purple p-1">
              <Theater className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold">StageVault</h1>
          </Link>
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.profilePicture} alt={currentUser?.name} />
            <AvatarFallback>
              {currentUser?.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
        </header>
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-background shadow-lg">
              <div className="flex h-16 items-center justify-between border-b px-4">
                <Link to="/" className="flex items-center gap-2">
                  <div className="rounded-md bg-stage-purple p-1">
                    <Theater className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold">StageVault</h1>
                </Link>
                <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <nav className="p-4">
                <ul className="space-y-2">
                  {navItems.map(item => <li key={item.path}>
                      <Link to={item.path} className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${isLinkActive(item.path) ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`} onClick={toggleMobileMenu}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </li>)}
                  <li>
                    <button onClick={() => {
                  toggleMobileMenu();
                  handleLogout();
                }} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-destructive hover:bg-sidebar-accent/50">
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </li>
                </ul>
              </nav>
              
              <div className="absolute bottom-4 left-4 right-4 border-t pt-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={currentUser?.profilePicture} alt={currentUser?.name} />
                    <AvatarFallback>
                      {currentUser?.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="fixed inset-0 z-[-1]" onClick={toggleMobileMenu} aria-hidden="true" />
          </div>
        )}
        
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        
        {location.pathname !== "/record" && (
          <div className="fixed right-4 bottom-16 md:right-8 md:bottom-8 z-50">
            <Link to="/record">
              <Button 
                size="icon" 
                className="h-14 w-14 rounded-full shadow-lg bg-red-500 hover:bg-red-600 text-white"
                aria-label="Record video"
              >
                <Video className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        )}
        
        <nav className="md:hidden border-t bg-background">
          <div className="flex justify-between">
            {navItems.map(item => <Link key={item.path} to={item.path} className={`flex flex-1 flex-col items-center py-2 px-1 ${isLinkActive(item.path) ? "text-primary" : "text-muted-foreground"}`}>
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>)}
          </div>
        </nav>
      </div>
    </div>;
}
