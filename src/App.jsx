import { useEffect } from 'react';
import AppRouter from './routers/AppRouter';
import { useCategoryStore } from './stores/categoryStore';

export default function App() {
  useEffect(() => {
    const categoryStore = useCategoryStore.getState();
    
    const hasCache = categoryStore.initializeFromCache();
    
    categoryStore.loadCategories();
  }, []);

  return <AppRouter />;
}
