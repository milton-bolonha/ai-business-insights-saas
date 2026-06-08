import React, { useMemo, useState } from 'react';
import { OSEntity } from '../types/OSEntity';
import { User, Phone, Mail, MapPin, Search, Tag, Building2, Calendar, FileText, ChevronRight } from 'lucide-react';

interface OSCustomersBoardProps {
  osList: OSEntity[];
}

interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  totalOS: number;
  totalRevenue: number;
  lastActive: string;
}

export const OSCustomersBoard: React.FC<OSCustomersBoardProps> = ({ osList }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const customers = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    osList.forEach(os => {
      if (!os.customer) return;
      const cid = os.customer.name; // Usando nome como ID por enquanto pois o mock usa id fixo
      
      if (!map.has(cid)) {
        map.set(cid, {
          id: os.customer.id || crypto.randomUUID(),
          name: os.customer.name,
          phone: os.customer.phone || 'Sem telefone',
          totalOS: 0,
          totalRevenue: 0,
          lastActive: os.updatedAt || os.createdAt
        });
      }
      
      const c = map.get(cid)!;
      c.totalOS += 1;
      c.totalRevenue += (os.totalRevenue || 0);
      
      if (new Date(os.updatedAt || os.createdAt) > new Date(c.lastActive)) {
        c.lastActive = os.updatedAt || os.createdAt;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [osList]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Carteira de Clientes</h2>
          <p className="text-gray-500 text-sm mt-1">Gerencie e visualize o histórico dos clientes da confecção.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Contato</th>
              <th className="px-6 py-4">Última Atividade</th>
              <th className="px-6 py-4 text-center">Total OS</th>
              <th className="px-6 py-4 text-right">Faturamento Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCustomers.map(customer => (
              <tr key={customer.name} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold uppercase">
                      {customer.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3" /> Cliente
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> {customer.phone}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(customer.lastActive).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 font-bold w-8 h-8 rounded-full text-xs">
                    {customer.totalOS}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                  R$ {customer.totalRevenue.toFixed(2)}
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
