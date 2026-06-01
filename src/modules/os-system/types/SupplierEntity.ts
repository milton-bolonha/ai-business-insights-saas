export interface SupplierEntity {
  id: string;
  companyName: string;
  tradeName?: string;
  document: string; // CNPJ
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}
