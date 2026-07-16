import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let requestsCount = 0;

    const requestInterceptor = axios.interceptors.request.use((config) => {
      requestsCount++;
      setIsLoading(true);
      return config;
    }, (error) => {
      requestsCount--;
      if (requestsCount === 0) setIsLoading(false);
      return Promise.reject(error);
    });

    const responseInterceptor = axios.interceptors.response.use((response) => {
      requestsCount--;
      if (requestsCount === 0) setIsLoading(false);
      return response;
    }, (error) => {
      requestsCount--;
      if (requestsCount === 0) setIsLoading(false);
      return Promise.reject(error);
    });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
