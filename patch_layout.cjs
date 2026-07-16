const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Add Menu and X icons
content = content.replace("import { Users, Settings, LayoutDashboard, Clock, MapPin, MessageSquare, LogOut, FileSpreadsheet, AlertCircle } from 'lucide-react';", 
"import { Users, Settings, LayoutDashboard, Clock, MapPin, MessageSquare, LogOut, FileSpreadsheet, AlertCircle, Menu, X } from 'lucide-react';");

// Add state for sidebarOpen
content = content.replace("const [pendingCount, setPendingCount] = useState(0);",
"const [pendingCount, setPendingCount] = useState(0);\n  const [sidebarOpen, setSidebarOpen] = useState(false);");

// Close sidebar on navigate
content = content.replace("const navigate = useNavigate();",
"const navigate = useNavigate();\n  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);");

// Update rendering
const renderSearch = `  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 font-sans text-slate-200">
      
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-slate-700 bg-slate-800 flex flex-col">`;
      
const renderReplace = `  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 font-sans text-slate-200 relative">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={\`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-60 flex-shrink-0 border-r border-slate-700 bg-slate-800 flex flex-col transition-transform duration-300 ease-in-out \${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}\`}>`;

content = content.replace(renderSearch, renderReplace);

const headerSearch = `      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-700 flex items-center px-6 bg-slate-800">
          <h1 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
            {navItems.find((i) => i.path === location.pathname)?.name || 'Admin Panel'}
          </h1>
        </header>`;

const headerReplace = `      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-700 flex items-center px-4 md:px-6 bg-slate-800 shrink-0">
          <button 
            className="md:hidden mr-4 p-1 text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-sm font-bold text-slate-200 uppercase tracking-wide truncate">
            {navItems.find((i) => i.path === location.pathname)?.name || 'Admin Panel'}
          </h1>
        </header>`;
        
content = content.replace(headerSearch, headerReplace);

// Remove min-h-0 in sidebar branding for safety
content = content.replace("min-h-0 pb-6", "pb-6");

fs.writeFileSync('src/components/Layout.tsx', content);
