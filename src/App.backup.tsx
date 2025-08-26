import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Souk El-Sayarat</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Cars</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Sell</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <HomePage />
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center">© 2024 Souk El-Sayarat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Souk El-Sayarat
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Egypt's Leading Automotive Marketplace
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Buy Cars</h3>
            <p className="text-gray-600">Find your perfect car from thousands of listings</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Sell Cars</h3>
            <p className="text-gray-600">List your car and reach millions of buyers</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Trusted Platform</h3>
            <p className="text-gray-600">Safe and secure transactions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
