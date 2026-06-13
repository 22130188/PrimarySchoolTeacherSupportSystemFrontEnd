import { create } from 'zustand';
import { getCategories } from '../services/categoryApi';

const useCategoryStore = create((set, get) => ({
  subjects: [],
  grades: [],
  classrooms: [],
  lesson_contents: [],
  loading: false,
  error: null,
  lastFetchTime: 0,

  loadCategories: async () => {
    const { lastFetchTime } = get();
    const now = Date.now();
    
    if (now - lastFetchTime < 5 * 60 * 1000) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const [subjectsRes, gradesRes, classroomsRes, lessonsRes] = await Promise.all([
        getCategories('subject'),
        getCategories('grade'),
        getCategories('class'),
        getCategories('lesson_content'),
      ]);

      set({
        subjects: Array.isArray(subjectsRes) ? subjectsRes : [],
        grades: Array.isArray(gradesRes) ? gradesRes : [],
        classrooms: Array.isArray(classroomsRes) ? classroomsRes : [],
        lesson_contents: Array.isArray(lessonsRes) ? lessonsRes : [],
        loading: false,
        lastFetchTime: now,
      });

      try {
        localStorage.setItem('categories_cache', JSON.stringify({
          subjects: Array.isArray(subjectsRes) ? subjectsRes : [],
          grades: Array.isArray(gradesRes) ? gradesRes : [],
          classrooms: Array.isArray(classroomsRes) ? classroomsRes : [],
          lesson_contents: Array.isArray(lessonsRes) ? lessonsRes : [],
          lastFetchTime: now,
        }));
      } catch (e) {
        console.warn('Failed to save categories to localStorage:', e);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      set({ 
        error: err.message || 'Failed to load categories',
        loading: false 
      });

      try {
        const cached = localStorage.getItem('categories_cache');
        if (cached) {
          const data = JSON.parse(cached);
          set({
            subjects: data.subjects || [],
            grades: data.grades || [],
            classrooms: data.classrooms || [],
            lesson_contents: data.lesson_contents || [],
            lastFetchTime: data.lastFetchTime,
          });
        }
      } catch (e) {
        console.warn('Failed to restore categories from localStorage:', e);
      }
    }
  },

  getByType: (type) => {
    const state = get();
    const typeMap = {
      subject: state.subjects,
      grade: state.grades,
      class: state.classrooms,
      classroom: state.classrooms,
      lesson_content: state.lesson_contents,
    };
    return typeMap[type] || [];
  },

  resetCache: () => {
    set({
      subjects: [],
      grades: [],
      classrooms: [],
      lesson_contents: [],
      loading: false,
      error: null,
      lastFetchTime: 0,
    });
    try {
      localStorage.removeItem('categories_cache');
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  },

  initializeFromCache: () => {
    try {
      const cached = localStorage.getItem('categories_cache');
      if (cached) {
        const data = JSON.parse(cached);
        set({
          subjects: data.subjects || [],
          grades: data.grades || [],
          classrooms: data.classrooms || [],
          lesson_contents: data.lesson_contents || [],
          lastFetchTime: data.lastFetchTime,
        });
        return true;
      }
    } catch (e) {
      console.warn('Failed to initialize from cache:', e);
    }
    return false;
  },
}));

export { useCategoryStore };
