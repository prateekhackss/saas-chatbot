export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Placeholder Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4 border-b font-bold text-xl">Admin Panel</div>
        <nav className="p-4 space-y-2">
          <a href="/dashboard" className="block p-2 hover:bg-gray-100 rounded">Home</a>
          <a href="/clients" className="block p-2 hover:bg-gray-100 rounded">Clients</a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
