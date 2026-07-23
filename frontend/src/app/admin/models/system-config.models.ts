export interface SystemConfigResponse {
  results: SystemConfig[];
  count: number;
  next: boolean | null;
  previous: boolean | null;
}

export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SystemConfigFilters {
  ordering: string;
  order_dir: string;
  search: string;
}

export interface DefaultSystemConfig {
  key: string;
  value: string;
  exists_in_db: boolean;
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