export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSystemConfigDTO {
  key: string;
  value: string;
  description?: string;
}

export interface UpdateSystemConfigDTO {
  key?: string;
  value?: string;
  description?: string;
}

export interface BulkUpdateConfigDTO {
  key: string;
  value: string;
}