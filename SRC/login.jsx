import React, { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";

const LoginPage = ({ onLogin }) => {
  const [id, setId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (id.trim().length > 0) {
      // In a real app, you'd verify this ID with the backend
      onLogin(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-indigo-50 opacity-50"></div>
        
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 mb-2">
            BloomPath
          </h1>
          <p className="text-gray-500 text-sm font-medium tracking-wide">INTELLIGENT RECRUITMENT OS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Identification Personnelle</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Entrez votre ID (ex: LESLIE-01)"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02]"
          >
            Access System <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">Powered by Grandir Intelligence • v2.1</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;