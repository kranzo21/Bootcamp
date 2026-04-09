export type Path = "instrumentalist" | "vocals" | "drums";
export type Track = "theologie" | "theorie";

export type Instrument =
  | "klavier"
  | "gitarre"
  | "e-gitarre"
  | "bass"
  | "geige"
  | "vocals"
  | "drums";

export interface Video {
  titel: string;
  url: string;
}

export interface Text {
  titel: string;
  inhalt: string;
}

export interface Question {
  frage: string;
  optionen: [string, string, string, string];
  richtig: 0 | 1 | 2 | 3;
}

export interface Module {
  id: string;
  titel: string;
  videos: Video[];
  texte: Text[];
  fragen: Question[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  instruments: Instrument[];
  path: Path;
  is_admin: boolean;
  created_at: string;
}

export interface Progress {
  module_id: string;
  track: Track;
  materials_completed: boolean;
  passed: boolean;
  completed_at: string | null;
}

export interface QuizAttempt {
  module_id: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}
