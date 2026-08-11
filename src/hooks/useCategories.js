import { useEffect, useMemo } from 'react';
import { useCategoryStore } from '../stores/categoryStore';

const extractGradeLevel = (category) => {
  const match = String(category?.name || category?.grade || category?.code || '').match(/\d+/);
  return match ? Number(match[0]) : null;
};

const extractClassGroup = (category) => {
  const nameMatch = String(category?.name || '').trim().match(/([A-Za-zÀ-ỹ0-9]+)$/u);
  if (nameMatch) return nameMatch[1].toUpperCase();

  const codeParts = String(category?.code || '').split('_').filter(Boolean);
  return (codeParts.at(-1) || '').toUpperCase();
};

const sortByLabel = (left, right) => left.label.localeCompare(right.label, 'vi', { numeric: true });

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
    // Dùng cache để hiển thị ngay, sau đó đồng bộ lại để nhận thay đổi mới từ admin.
    loadCategories(true);
  }, [loadCategories]);

  const subjectsOptions = useMemo(
    () => subjects
      .filter((category) => category.isActive !== false)
      .map((category) => ({ value: category.name, label: category.name, categoryId: category.id }))
      .sort(sortByLabel),
    [subjects]
  );

  // Danh mục type=class là cấp lớp nền (Lớp 1 - Lớp 5), dùng cho bài giảng.
  const baseClasses = useMemo(
    () => classrooms
      .filter((category) => category.isActive !== false)
      .map((category) => {
        const gradeLevel = extractGradeLevel(category);
        return {
          value: gradeLevel ?? category.name,
          label: category.name,
          categoryId: category.id,
          categoryCode: category.code,
          gradeLevel,
        };
      })
      .sort((left, right) => (left.gradeLevel ?? 999) - (right.gradeLevel ?? 999) || sortByLabel(left, right)),
    [classrooms]
  );

  // Danh mục type=grade quản lý các nhóm lớp do admin cấu hình (A, B, C, D...).
  const classGroups = useMemo(
    () => grades
      .filter((category) => category.isActive !== false)
      .map((category) => ({
        value: category.id,
        label: category.name,
        categoryId: category.id,
        categoryCode: category.code,
        groupCode: extractClassGroup(category),
      }))
      .filter((category) => category.groupCode)
      .sort((left, right) => sortByLabel(
        { label: left.groupCode },
        { label: right.groupCode }
      )),
    [grades]
  );

  const homeroomClasses = useMemo(
    () => baseClasses.flatMap((baseClass) => classGroups.map((group) => ({
      value: `${baseClass.categoryId}:${group.categoryId}`,
      label: `${baseClass.label}${group.groupCode}`,
      gradeLevel: baseClass.gradeLevel,
      classCategoryId: baseClass.categoryId,
      classCategoryCode: baseClass.categoryCode,
      groupCategoryId: group.categoryId,
      groupCategoryCode: group.categoryCode,
      classGroup: group.groupCode,
    }))),
    [baseClasses, classGroups]
  );

  return {
    subjects: subjectsOptions,
    grades: baseClasses,
    classrooms: baseClasses,
    baseClasses,
    classGroups,
    homeroomClasses,
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
  const { grades, loading, error } = useCategories();
  return {
    grades,
    loading,
    error,
  };
}
