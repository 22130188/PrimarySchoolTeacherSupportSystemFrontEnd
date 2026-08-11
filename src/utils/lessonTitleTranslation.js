const VI_TO_EN_TITLE_PHRASES = [
  [/\bLuyện tập chung\b/giu, 'General Practice'],
  [/\bTập làm văn\b/giu, 'Writing Practice'],
  [/\bTập viết\b/giu, 'Handwriting Practice'],
  [/\bChữ hoa\b/giu, 'Capital Letters'],
  [/\bTập đọc\b/giu, 'Reading Practice'],
  [/\bChính tả\b/giu, 'Spelling'],
  [/\bKể chuyện\b/giu, 'Storytelling'],
  [/\bÔn tập\b/giu, 'Review'],
  [/\bLuyện tập\b/giu, 'Practice'],
  [/\bBằng nhau\b/giu, 'Equal'],
  [/\bdấu bằng\b/giu, 'equals sign'],
  [/\bdấu\s*=\s*/giu, 'equals sign '],
];

const EN_TO_VI_TITLE_PHRASES = [
  [/\bPhonics Readers?\b/giu, 'Bài đọc ngữ âm'],
  [/\bPhonics\b/giu, 'Ngữ âm'],
  [/\bHandwriting Practice\b/giu, 'Tập viết'],
  [/\bCapital Letters?\b/giu, 'Chữ hoa'],
  [/\bGeneral Practice\b/giu, 'Luyện tập chung'],
  [/\bWriting Practice\b/giu, 'Tập làm văn'],
  [/\bReading Practice\b/giu, 'Tập đọc'],
  [/\bStorytelling\b/giu, 'Kể chuyện'],
  [/\bSpelling\b/giu, 'Chính tả'],
  [/\bReview\b/giu, 'Ôn tập'],
  [/\bPractice\b/giu, 'Luyện tập'],
  [/\bReader\b/giu, 'Bài đọc'],
  [/\bequals sign\b/giu, 'dấu bằng'],
];

export function normalizeLessonTitle(title) {
  return String(title || '')
    .trim()
    .replace(/\s*_+\s*/g, ': ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s{2,}/g, ' ');
}

function replacePhrases(value, replacements) {
  let translated = value;
  let replacementCount = 0;

  replacements.forEach(([pattern, replacement]) => {
    translated = translated.replace(pattern, () => {
      replacementCount += 1;
      return replacement;
    });
  });

  return { translated, replacementCount };
}

function formatCapitalLetters(value) {
  return value.replace(
    /(Capital Letters\s+)([A-ZÀ-Ỹ](?:\s+[A-ZÀ-Ỹ])+)/gu,
    (_, prefix, letters) => `${prefix}${letters.trim().split(/\s+/).join(', ')}`
  );
}

export function translateKnownLessonTitle(title, sourceLang, targetLang) {
  const normalized = normalizeLessonTitle(title);
  if (!normalized || sourceLang === targetLang) return normalized;

  if (sourceLang === 'vi' && targetLang === 'en') {
    let translated = normalized;
    let replacementCount = 0;

    translated = translated.replace(/^Bài\s*(\d+(?:[.-]\d+)?)/iu, (_, number) => {
      replacementCount += 1;
      return `Lesson ${number}`;
    });
    translated = translated.replace(/\bTiết\s*(\d+)\b/giu, (_, number) => {
      replacementCount += 1;
      return `Period ${number}`;
    });

    const phraseResult = replacePhrases(translated, VI_TO_EN_TITLE_PHRASES);
    replacementCount += phraseResult.replacementCount;
    translated = formatCapitalLetters(phraseResult.translated)
      .replace(/Handwriting Practice\s+Capital Letters/giu, 'Handwriting Practice – Capital Letters')
      .replace(/\s+,/g, ',')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return replacementCount >= 2 ? translated : '';
  }

  if (sourceLang === 'en' && targetLang === 'vi') {
    let translated = normalized;
    let replacementCount = 0;

    translated = translated.replace(/^Lesson\s*(\d+(?:[.-]\d+)?)/iu, (_, number) => {
      replacementCount += 1;
      return `Bài ${number}`;
    });
    translated = translated.replace(/\bPeriod\s*(\d+)\b/giu, (_, number) => {
      replacementCount += 1;
      return `Tiết ${number}`;
    });
    translated = translated.replace(/\bset\s*(\d+)\b/giu, (_, number) => {
      replacementCount += 1;
      return `- Bộ ${number}`;
    });

    const phraseResult = replacePhrases(translated, EN_TO_VI_TITLE_PHRASES);
    replacementCount += phraseResult.replacementCount;
    return replacementCount >= 2
      ? phraseResult.translated.replace(/\s{2,}/g, ' ').trim()
      : '';
  }

  return '';
}

export function isSuspiciousLessonTitleTranslation(sourceTitle, translatedTitle) {
  const source = normalizeLessonTitle(sourceTitle);
  const translated = String(translatedTitle || '').trim();
  if (!translated || /^[_\W]+/u.test(translated)) return true;
  if (/\bother\s+organis(?:er|or)\b/i.test(translated)) return true;
  if (source.toLocaleLowerCase() === translated.toLocaleLowerCase()) return true;
  if (source.length >= 8 && translated.length > source.length * 3) return true;

  const sourceNumbers = source.match(/\d+/g) || [];
  if (sourceNumbers.some((number) => !translated.includes(number))) return true;

  const sourceWordCount = source.split(/\s+/).filter(Boolean).length;
  const translatedWords = translated.toLocaleLowerCase('vi').match(/[\p{L}\p{N}]+/gu) || [];
  const translatedWordCount = translatedWords.length;
  if (sourceWordCount >= 5 && translatedWordCount < Math.ceil(sourceWordCount * 0.45)) return true;

  if (translatedWordCount >= 8) {
    const frequencies = translatedWords.reduce((result, word) => {
      result[word] = (result[word] || 0) + 1;
      return result;
    }, {});
    const highestFrequency = Math.max(...Object.values(frequencies));
    const uniqueRatio = Object.keys(frequencies).length / translatedWordCount;
    if (highestFrequency >= 3 && uniqueRatio < 0.55) return true;
  }

  return false;
}
