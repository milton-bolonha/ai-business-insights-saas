import { useState } from "react";

interface CompanyStepProps {
  data: {
    company: string;
    website: string;
  };
  onNext: (data: { company: string; website: string }) => void;
  canProceed: boolean;
}

export const CompanyStep = ({ data, onNext, canProceed }: CompanyStepProps) => {
  const [company, setCompany] = useState(data.company);
  const [website, setWebsite] = useState(data.website);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) {
      onNext({ company, website });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo ao AI SaaS! 🚀
        </h2>
        <p className="text-gray-600">
          Vamos configurar seu espaço de trabalho personalizado
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Empresa *
          </label>
          <input
            type="text"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite o nome da sua empresa"
            required
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Website (opcional)
          </label>
          <input
            type="url"
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://suaempresa.com"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canProceed}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              canProceed
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Próximo →
          </button>
        </div>
      </form>
    </div>
  );
};
