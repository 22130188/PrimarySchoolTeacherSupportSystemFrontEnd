export function normalizeLibraryGrade(value) {
  const grade = String(value ?? '').trim();
  const numericMatch = grade.match(/\d+/);
  return numericMatch ? numericMatch[0] : grade.toLocaleLowerCase('vi');
}

export function matchesLibrarySubject(imageSubject, selectedSubject) {
  if (!selectedSubject || selectedSubject === 'all') return true;
  const subject = String(imageSubject || '').trim().toLocaleLowerCase('vi');
  const selected = String(selectedSubject).trim().toLocaleLowerCase('vi');
  return subject === selected || subject.startsWith(`${selected} `);
}

export function matchesLibraryGrade(imageGrade, selectedGrade) {
  if (!selectedGrade || selectedGrade === 'all') return true;
  return normalizeLibraryGrade(imageGrade) === normalizeLibraryGrade(selectedGrade);
}

export function filterLibraryImages(images, selectedSubject, selectedGrade) {
  return images.filter((image) => (
    matchesLibrarySubject(image?.subject, selectedSubject)
    && matchesLibraryGrade(image?.grade, selectedGrade)
  ));
}
