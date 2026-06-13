import { useEffect, useState } from 'react';
import { useCategoryStore } from '../stores/categoryStore';

/**
 
 * @returns {Object} 
 */
export function useCategories() {
  const {
    subjects,
    grades,
    classrooms,
    loading,
    error,
    loadCategories,
  } = useCategoryStore();

  useEffect(() => {
    if ((!subjects.length || !grades.length || !classrooms.length) && !loading && !error) {
      loadCategories();
    }
  }, []);

  return {
    subjects: subjects.map(cat => ({ value: cat.name, label: cat.description || cat.name })),
    grades: grades.map(cat => ({ value: cat.name, label: cat.description || cat.name })),
    classrooms: classrooms.map(cat => ({ value: cat.name, label: cat.description || cat.name })),
    loading,
    error,
    refetch: loadCategories,
  };
}

/**
 * @param {string} type 
 * @returns {Object} 
 */
export function useCategoriesByType(type) {
  const { getByType, loading, error } = useCategoryStore();
  
  const data = getByType(type).map(cat => ({ 
    value: cat.name, 
    label: cat.description || cat.name,
    code: cat.code 
  }));

  return { data, loading, error };
}

export function useSubjects() {
  const { subjects, loading, error } = useCategoryStore();
  return {
    subjects: subjects.map(cat => ({ value: cat.name, label: cat.name })),
    loading,
    error,
  };
}

export function useGrades() {
  const { grades, loading, error } = useCategoryStore();
  return {
    grades: grades.map(cat => ({ value: parseInt(cat.code) || cat.name, label: cat.name })),
    loading,
    error,
  };
}
