export interface ServiceCatalogEntity {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedDurationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
