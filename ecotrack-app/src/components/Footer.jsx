function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">🌍 EcoTrack AI</h3>
            <p className="text-gray-400 text-sm">
              Track, understand, and reduce your carbon footprint with AI-powered insights.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/calculator" className="text-gray-400 hover:text-eco-green transition-colors">Carbon Calculator</a></li>
              <li><a href="/dashboard" className="text-gray-400 hover:text-eco-green transition-colors">Dashboard</a></li>
              <li><a href="/challenges" className="text-gray-400 hover:text-eco-green transition-colors">Challenges</a></li>
              <li><a href="/chat" className="text-gray-400 hover:text-eco-green transition-colors">AI Chat</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">About</h4>
            <p className="text-gray-400 text-sm">
              Built with React, Vite, and powered by Google Gemini AI. 
              Emission factors sourced from EPA and IPCC standards.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} EcoTrack AI. All rights reserved. | Building a sustainable future together.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
