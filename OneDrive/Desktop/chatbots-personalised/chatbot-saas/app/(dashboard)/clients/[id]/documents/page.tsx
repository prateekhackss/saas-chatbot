export default function ClientDocumentsPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Knowledge Base</h1>
      <p className="text-gray-600 mb-8">Upload documents to train the AI for client ID: {params.id}</p>

      <div className="bg-white p-6 rounded border">
        <h2 className="text-xl font-bold mb-4">Upload New Document</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Document Title (e.g. Return Policy)" className="w-full border rounded p-2" />
          <textarea rows={6} placeholder="Paste raw text content here..." className="w-full border rounded p-2"></textarea>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Process & Train AI</button>
        </div>
      </div>
      
      <h2 className="text-xl font-bold mt-8 mb-4">Trained Documents</h2>
      {/* List of uploaded documents will go here */}
    </div>
  );
}
