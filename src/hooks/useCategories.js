import { useEffect, useState } from 'react';
import { useCategoryStore } from '../stores/categoryStore';

// Danh sách lớp cố định cho trường tiểu học (Lớp 1 - Lớp 5)
const PRIMARY_GRADES = [
  { value: 1, label: 'Lớp 1' },
  { value: 2, label: 'Lớp 2' },
  { value: 3, label: 'Lớp 3' },
  { value: 4, label: 'Lớp 4' },
  { value: 5, label: 'Lớp 5' },
];

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
    grades: PRIMARY_GRADES,
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
  const { loading, error } = useCategoryStore();
  return {
    grades: PRIMARY_GRADES,
    loading,
    error,
  };
}
