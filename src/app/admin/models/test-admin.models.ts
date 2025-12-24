export interface TestsListFilters {
  page: number;
  page_size: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  main_topic?: string;
  sub_topic?: string;
  level?: string;
  is_active?: boolean;
  search?: string;
}

export interface TestsFilterOptions {
  main_topics: string[];
  sub_topics: string[];
  levels: string[];
}
