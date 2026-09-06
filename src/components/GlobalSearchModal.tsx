import React, { useState, useEffect } from 'react';
import { Search, X, User, GraduationCap, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: string; id: string; title: string; subtitle: string; path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const { adminService } = await import('../services/adminService');
      const searchResults = await adminService.search(searchTerm, user?.role);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-0">
      <div className="fixed inset-0 bg-[#0a0c16]/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#111425]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/80 dark:border-violet-500/15 overflow-hidden animate-fade-in-up">
        <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-white/10">
          <Search className="h-5 w-5 text-violet-600 dark:text-violet-400 mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 text-lg font-medium"
            placeholder="Search students, faculty, tickets, events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-white/5 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && query && (
            <div className="p-4 text-center text-sm text-gray-500">Searching directory...</div>
          )}
          
          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 font-semibold">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try searching by ID, name, or email</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2 space-y-1">
              {results.map((res, i) => (
                <button
                  key={`${res.type}-${res.id}-${i}`}
                  onClick={() => handleSelect(res.path)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-violet-50/70 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`mt-0.5 p-2 rounded-lg ${
                    res.type === 'user' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' :
                    res.type === 'grievance' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20' :
                    res.type === 'certificate' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20' :
                    'bg-amber-100 text-amber-600 dark:bg-amber-500/20'
                  }`}>
                    {res.type === 'user' && <User className="h-4 w-4" />}
                    {res.type === 'grievance' && <AlertCircle className="h-4 w-4" />}
                    {res.type === 'event' && <Calendar className="h-4 w-4" />}
                    {res.type === 'certificate' && <GraduationCap className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{res.title}</p>
                    <p className="text-xs text-gray-500">{res.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {!query && (
            <div className="p-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 text-xs text-gray-500 text-center flex items-center justify-center gap-2">
              <span>Press <kbd className="font-mono bg-white dark:bg-[#171b32] px-1.5 py-0.5 rounded border border-gray-200 dark:border-violet-500/20 text-slate-700 dark:text-slate-300">Esc</kbd> to close</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
