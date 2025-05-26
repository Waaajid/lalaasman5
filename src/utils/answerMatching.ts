import { stringSimilarity } from 'string-similarity-js';

type DateFormat = {
  day: number;
  month: number;
};

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const MONTH_ABBREV = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

const ORDINAL_SUFFIXES = ['st', 'nd', 'rd', 'th'];

const parseDateString = (dateStr: string): DateFormat | null => {
  // Remove any non-alphanumeric characters except spaces and ordinal suffixes
  const cleanStr = dateStr.toLowerCase().trim();
  
  // Try different date formats
  let day: number | undefined;
  let month: number | undefined;

  // Try DD/MM format (with optional separators)
  const slashMatch = cleanStr.match(/^(\d{1,2})[/\s.-](\d{1,2})$/);
  if (slashMatch) {
    day = parseInt(slashMatch[1]);
    month = parseInt(slashMatch[2]);
  }

  // Handle ordinal numbers (1st, 2nd, 3rd, etc.)
  const ordinalMatch = cleanStr.match(/(\d{1,2})(st|nd|rd|th)?(?:\s+of)?[\s,.-]+([a-z]+)/i);
  if (ordinalMatch) {
    day = parseInt(ordinalMatch[1]);
    const monthStr = ordinalMatch[3].toLowerCase();
    month = MONTH_NAMES.indexOf(monthStr) + 1;
    if (month === 0) {
      month = MONTH_ABBREV.indexOf(monthStr.substring(0, 3)) + 1;
    }
  }

  // Try "DD Month" format
  if (!day || !month) {
    const words = cleanStr.split(/[\s,.-]+/);
    if (words.length >= 2) {
      // Try to parse day, handling ordinal suffixes
      const dayStr = words[0].replace(/(?:st|nd|rd|th)$/i, '');
      const possibleDay = parseInt(dayStr);
      const monthStr = words[1].toLowerCase();
      
      if (!isNaN(possibleDay)) {
        day = possibleDay;
        month = MONTH_NAMES.indexOf(monthStr) + 1;
        if (month === 0) {
          month = MONTH_ABBREV.indexOf(monthStr.substring(0, 3)) + 1;
        }
      }
    }
  }

  // Try "Month DD" format
  if (!day || !month) {
    const words = cleanStr.split(/[\s,.-]+/);
    if (words.length >= 2) {
      const monthStr = words[0].toLowerCase();
      // Handle ordinal suffixes in day
      const dayStr = words[1].replace(/(?:st|nd|rd|th)$/i, '');
      const possibleDay = parseInt(dayStr);
      
      if (!isNaN(possibleDay)) {
        day = possibleDay;
        month = MONTH_NAMES.indexOf(monthStr) + 1;
        if (month === 0) {
          month = MONTH_ABBREV.indexOf(monthStr.substring(0, 3)) + 1;
        }
      }
    }
  }

  // Try to extract 4-digit year if present and ignore it
  const yearMatch = cleanStr.match(/\b\d{4}\b/);
  if (yearMatch) {
    // Year doesn't affect matching, so we just ignore it
  }

  // Validate day and month
  if (day && month && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
    // Additional validation for days in month
    const daysInMonth = new Date(2024, month, 0).getDate();
    if (day <= daysInMonth) {
      return { day, month };
    }
  }

  return null;
};

const standardizeDateFormat = (date: DateFormat): string => {
  return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}`;
};

const COMMON_WORD_REPLACEMENTS: { [key: string]: string[] } = {
  'dev': ['development', 'develop', 'developing'],
  'ai': ['artificial intelligence', 'a.i.', 'a.i'],
  'assistant': ['assistant', 'asst', 'asst.'],
  'linkedin': ['linked in', 'linked-in'],
};

const normalizeString = (str: string): string => {
  // Convert to lowercase and remove all punctuation
  let normalized = str.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation except hyphens
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();

  // Handle common abbreviations and variations
  for (const [standard, variations] of Object.entries(COMMON_WORD_REPLACEMENTS)) {
    if (variations.includes(normalized)) {
      normalized = standard;
      break;
    }
  }

  // Remove common articles and prepositions
  normalized = normalized.replace(/\b(the|a|an|in|on|at|to|of)\b/g, '');

  // Normalize spaces again after word removal
  return normalized.replace(/\s+/g, ' ').trim();
};

const improvedStringSimilarity = (str1: string, str2: string): number => {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  // Exact match after normalization
  if (normalized1 === normalized2) return 1.0;

  // Convert to arrays for word-by-word comparison if needed
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');

  // If one is a single word and is contained in the other, high similarity
  if (words1.length === 1 && words2.join(' ').includes(words1[0])) {
    return 0.9;
  }
  if (words2.length === 1 && words1.join(' ').includes(words2[0])) {
    return 0.9;
  }

  // Use string-similarity-js for fuzzy matching
  return stringSimilarity(normalized1, normalized2);
};

export const areAnswersMatching = (answer1: string, answer2: string, questionId: string): boolean => {
  const isDateQuestion = questionId.endsWith('q1') || questionId.endsWith('q4'); // First and last questions of each round are dates
  
  if (isDateQuestion) {
    const date1 = parseDateString(answer1);
    const date2 = parseDateString(answer2);
    
    if (date1 && date2) {
      return standardizeDateFormat(date1) === standardizeDateFormat(date2);
    }
  }

  // For non-date answers, use improved fuzzy matching
  // Higher threshold for shorter answers, lower for longer ones
  const similarity = improvedStringSimilarity(answer1, answer2);
  const minLength = Math.min(answer1.length, answer2.length);
  
  // Dynamic similarity threshold based on answer length
  const threshold = minLength <= 5 ? 0.9 :    // Very short answers need high similarity
                   minLength <= 10 ? 0.85 :   // Short answers
                   minLength <= 20 ? 0.8 :    // Medium answers
                   0.75;                      // Long answers
  
  return similarity >= threshold;
};
