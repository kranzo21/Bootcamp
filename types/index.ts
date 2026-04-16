// types/index.ts

// ─── Content ─────────────────────────────────────────────────────
export interface Program {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface Area {
  id: string;
  program_id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  area_type: "regular" | "instrument";
}

export interface Tutorial {
  id: string;
  area_id: string;
  title: string;
  video_url: string;
  description: string;
  order: number;
}

export interface Lektion {
  id: string;
  area_id: string;
  title: string;
  description: string;
  order: number;
}

export interface Material {
  id: string;
  lektion_id: string;
  type: "video" | "text";
  title: string;
  content: string | null;
  video_url: string | null;
  tutorial_id: string | null;
  order: number;
}

export interface QuizQuestion {
  id: string;
  lektion_id: string;
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  order: number;
}

export interface Ressource {
  id: string;
  area_id: string;
  title: string;
  description: string;
  url: string;
  type: "link" | "pdf" | "dokument";
  order: number;
}

export interface Badge {
  id: string;
  lektion_id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Qualification {
  id: string;
  name: string;
  description: string;
}

export interface QualificationBadge {
  qualification_id: string;
  badge_id: string;
}

// ─── User ─────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  instruments: string[];
  created_at: string;
}

export interface UserFavourite {
  id: string;
  user_id: string;
  item_type: "tutorial" | "ressource";
  item_id: string;
  created_at: string;
}

export interface UserProgram {
  user_id: string;
  program_id: string;
  enrolled_at: string;
}

export interface LektionProgress {
  id: string;
  user_id: string;
  lektion_id: string;
  materials_completed: boolean;
  passed: boolean;
  completed_at: string | null;
}

export interface MaterialView {
  id: string;
  user_id: string;
  material_id: string;
  viewed_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  lektion_id: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface UserQualification {
  id: string;
  user_id: string;
  qualification_id: string;
  confirmed_by: string | null;
  confirmed_at: string;
}
