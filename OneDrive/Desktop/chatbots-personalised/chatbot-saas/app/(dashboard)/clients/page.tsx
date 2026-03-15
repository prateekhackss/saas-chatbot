export default function ClientsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Clients</h1>
        <a href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + New Client
        </a>
      </div>
      
      <div className="grid gap-4">
         {/* Placeholder for client cards */}
         <div className="border p-4 rounded bg-white shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Sarah's Fitness</h3>
              <p className="text-sm text-gray-500">sarah-fitness</p>
            </div>
            <a href="/clients/uuid/documents" className="text-blue-600 hover:underline">Manage Docs_&rarr;</a>
         </div>
      </div>
    </div>
  );
}
