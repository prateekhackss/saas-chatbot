export default function NewClientPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Onboard New Client</h1>
      
      <form className="space-y-4 bg-white p-6 rounded border">
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input type="text" className="w-full border rounded p-2" placeholder="e.g. Sarah's Fitness" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">URL Slug</label>
          <input type="text" className="w-full border rounded p-2" placeholder="sarah-fitness" />
        </div>

        <h3 className="text-lg font-bold mt-6 mb-2">Bot Branding</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Primary Color</label>
            <input type="color" className="w-full border rounded h-10" defaultValue="#FF6B35" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Welcome Message</label>
          <input type="text" className="w-full border rounded p-2" defaultValue="Hi! Ask me anything." />
        </div>

        <button type="button" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full">
          Create Client
        </button>
      </form>
    </div>
  );
}
