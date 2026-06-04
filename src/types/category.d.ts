export interface Category {
  id: number;
  name: string;
  description?: string;
  isSystem?: boolean;
  status?: string | number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CategoryForm {
  id?: number;
  name: string;
  description?: string;
}
