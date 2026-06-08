import React, { useMemo, useState } from 'react';
import { OSEntity } from '../types/OSEntity';
import { Folder, Calendar, User, Search, Eye, ChevronRight, ChevronDown, Package } from 'lucide-react';

interface OSArchivedBoardProps {
  osList: OSEntity[];
  onViewOS: (osId: string) => void;
}

export const OSArchivedBoard: React.FC<OSArchivedBoardProps> = ({ osList, onViewOS }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const archivedOS = useMemo(() => {
    return osList.filter(os => os.status === 'entregue' || os.archivedAt);
  }, [osList]);

  const filteredOS = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return archivedOS;
    return archivedOS.filter(os => 
      os.osNumber.toLowerCase().includes(query) ||
      os.title.toLowerCase().includes(query) ||
      (os.customer?.name || '').toLowerCase().includes(query)
    );
  }, [archivedOS, searchQuery]);

  const tree = useMemo(() => {
    const data: Record<string, Record<string, Record<string, OSEntity[]>>> = {};
    
    filteredOS.forEach(os => {
      const date = new Date(os.archivedAt || os.completionDate || os.updatedAt);
      const year = date.getFullYear().toString();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // 01, 02...
      const monthName = date.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
      const monthKey = `${month} - ${monthName}`;
      const client = os.customer?.name || 'Cliente Genérico';

      if (!data[year]) data[year] = {};
      if (!data[year][monthKey]) data[year][monthKey] = {};
      if (!data[year][monthKey][client]) data[year][monthKey][client] = [];

      data[year][monthKey][client].push(os);
    });

    return data;
  }, [filteredOS]);

  const totalArchived = archivedOS.length;

  if (totalArchived === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
          <Folder className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Arquivo Morto Vazio</h3>
        <p className="text-gray-500 max-w-md">
          As Ordens de Serviço finalizadas (com status "Entregue") aparecerão aqui, organizadas por Ano, Mês e Cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Arquivo Histórico</h2>
          <p className="text-gray-500 text-sm mt-1">Total de {totalArchived} ordens arquivadas.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar no arquivo..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 overflow-hidden">
        {Object.keys(tree).sort((a, b) => b.localeCompare(a)).map(year => (
          <div key={year} className="mb-2">
            <div 
              className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              onClick={() => toggleNode(`y-${year}`)}
            >
              {expandedNodes[`y-${year}`] ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
              <Calendar className="w-5 h-5 text-violet-600" />
              <span className="font-bold text-gray-800 text-lg">{year}</span>
            </div>

            {expandedNodes[`y-${year}`] && (
              <div className="pl-6 border-l-2 border-gray-100 ml-5 mt-2 space-y-2">
                {Object.keys(tree[year]).sort((a, b) => b.localeCompare(a)).map(monthKey => (
                  <div key={monthKey}>
                    <div 
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => toggleNode(`m-${year}-${monthKey}`)}
                    >
                      {expandedNodes[`m-${year}-${monthKey}`] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <Folder className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-gray-700">{monthKey}</span>
                    </div>

                    {expandedNodes[`m-${year}-${monthKey}`] && (
                      <div className="pl-6 border-l-2 border-gray-100 ml-4 mt-1 space-y-1">
                        {Object.keys(tree[year][monthKey]).sort().map(client => (
                          <div key={client}>
                            <div 
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                              onClick={() => toggleNode(`c-${year}-${monthKey}-${client}`)}
                            >
                              {expandedNodes[`c-${year}-${monthKey}-${client}`] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                              <User className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-gray-600">{client}</span>
                              <span className="text-xs text-gray-400 ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
                                {tree[year][monthKey][client].length} OS(s)
                              </span>
                            </div>

                            {expandedNodes[`c-${year}-${monthKey}-${client}`] && (
                              <div className="pl-8 py-2 space-y-2">
                                {tree[year][monthKey][client].map(os => (
                                  <div key={os.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm hover:border-violet-300 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-gray-500" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-800 flex items-center gap-2">
                                          {os.osNumber}
                                          <span className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-gray-200">
                                            Entregue
                                          </span>
                                        </p>
                                        <p className="text-xs text-gray-500">{os.title}</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => onViewOS(os.id)}
                                      className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded transition-colors"
                                    >
                                      <Eye className="w-4 h-4" /> Dossiê
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
