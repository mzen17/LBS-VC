declare type APIWorkspace = {
  id: number;
  title: string;
  description?: string | null;
  color?: string | null;
  organization?: number | null;
  created_by?: APIUserSimple;
  created_at?: string;
  updated_at?: string;
  project_count?: number;
};
