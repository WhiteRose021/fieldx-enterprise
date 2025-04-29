"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
  
    try {
      await login(username, password);
      // The auth context will handle redirection
    } catch (err: any) {
      setError(err.message || "Μη έγκυρο όνομα χρήστη ή κωδικός πρόσβασης.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 animated-background">
      {/* Animated background elements */}
      <div className="animated-elements">
        <div className="element green-element"></div>
        <div className="element purple-element"></div>
        <div className="element green-element-2"></div>
        <div className="element purple-element-2"></div>
        <div className="element blue-element"></div>
        <div className="element green-element-3"></div>
        <div className="element purple-element-3"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Blue accent top bar similar to sidebar accent */}
        <div className="h-2 bg-[#0071BC] rounded-t-md"></div>
        
        <div className="bg-aspro rounded-b-xl shadow-xl p-10 space-y-8 fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/FieldX.png" 
                alt="FieldX Logo"
                width={200}
                height={80}
                priority
                style={{ width: 200, height: "auto" }} // Fix aspect ratio warning
              />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-800">Καλώς Ήρθατε</h2>
            <p className="mt-2 text-sm text-gray-600">Συνδεθείτε στον λογαριασμό σας</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Όνομα Χρήστη
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 mt-1 bg-aspro border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0071BC] focus:border-transparent transition-all duration-300"
                  placeholder="Εισάγετε το όνομα χρήστη"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Κωδικός Πρόσβασης
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-aspro border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0071BC] focus:border-transparent transition-all duration-300"
                    placeholder="Εισάγετε τον κωδικό σας"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md my-4 fade-in">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0071BC] hover:bg-[#0071BC]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0071BC] transition-all duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Σύνδεση...
                </div>
              ) : (
                "Σύνδεση"
              )}
            </button>
          </form>
          
          <div className="text-center text-sm text-gray-500 mt-4">
            <div className="border-t pt-4 border-gray-200">
              <p className="text-xs">© 2025 Arvanitis G. Με επιφύλαξη παντός δικαιώματος.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}