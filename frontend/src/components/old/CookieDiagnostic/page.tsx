"use client";
import { useState, useEffect } from 'react';

export default function CookieDiagnostic() {
  const [cookies, setCookies] = useState({});
  const [localStorage, setLocalStorage] = useState({});
  
  useEffect(() => {
    // Parse all cookies into an object
    const cookieObj = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name) cookieObj[name] = value;
    });
    setCookies(cookieObj);
    
    // Get relevant localStorage items
    const localStorageObj = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      localStorageObj[key] = window.localStorage.getItem(key);
    }
    setLocalStorage(localStorageObj);
  }, []);

  const setCookieManually = () => {
    document.cookie = `maintenance_mode=true; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `is_admin=true; path=/; max-age=31536000; SameSite=Lax`;
    window.localStorage.setItem('maintenance_mode', 'true');
    alert('Cookies and localStorage set. Refresh the page to see changes.');
  };

  const clearCookieManually = () => {
    document.cookie = 'maintenance_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.localStorage.removeItem('maintenance_mode');
    alert('Cookies and localStorage cleared. Refresh the page to see changes.');
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-lg font-semibold mb-4">Cookie Diagnostic</h2>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Current Cookies:</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
          {JSON.stringify(cookies, null, 2)}
        </pre>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">LocalStorage:</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
          {JSON.stringify(localStorage, null, 2)}
        </pre>
      </div>
      
      <div className="flex space-x-3">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={setCookieManually}
        >
          Set Maintenance Mode
        </button>
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={clearCookieManually}
        >
          Clear Maintenance Mode
        </button>
      </div>
    </div>
  );
}