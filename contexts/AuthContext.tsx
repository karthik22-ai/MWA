
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, isConfigValid } from '../firebaseConfig';
import { AlertTriangle, Terminal } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If config is invalid, stop loading and render the error screen
    if (!isConfigValid || !auth) {
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = () => {
    if (auth) return firebaseSignOut(auth);
    return Promise.resolve();
  };

  if (!isConfigValid) {
      return (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
              <div className="max-w-2xl w-full bg-slate-900 border border-rose-500/30 rounded-[2rem] p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500">
                          <AlertTriangle size={32} />
                      </div>
                      <div>
                          <h1 className="text-2xl font-bold">Firebase Configuration Required</h1>
                          <p className="text-slate-400">The app cannot connect to the database yet.</p>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                          <h3 className="font-bold mb-4 text-teal-400 flex items-center gap-2">
                              <Terminal size={18} /> 
                              Action Required
                          </h3>
                          <p className="text-slate-300 mb-4 leading-relaxed">
                              It looks like the Firebase API keys are missing or invalid in <code>firebaseConfig.ts</code>.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
