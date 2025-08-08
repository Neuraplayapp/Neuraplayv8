export interface EducationPredefine {
  id: string;
  type: 'education_predefine';
  title: string;
  tags: string[];
  content: unknown; // structured blocks or arrays
  last_updated: string; // ISO
}

export interface PredefineMatch {
  id: string;
  score: number;
  title: string;
}

