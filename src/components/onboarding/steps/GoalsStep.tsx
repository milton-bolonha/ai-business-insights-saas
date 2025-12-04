import { useState } from "react";

interface GoalsStepProps {
  data: {
    goals: string[];
  };
  onNext: (data: { goals: string[] }) => void;
  onPrev: () => void;
}

const COMMON_GOALS = [
  "Gerar conteúdo de marketing",
  "Criar posts para redes sociais",
  "Desenvolver ideias de produtos",
  "Escrever emails profissionais",
  "Criar descrições de produtos",
  "Gerar ideias de campanhas",
];

export const GoalsStep = ({ data, onNext, onPrev }: GoalsStepProps) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ goals: selectedGoals });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          O que você quer alcançar? 🎯
        </h2>
        <p className="text-gray-600">
          Selecione seus objetivos para personalizarmos sua experiência
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Selecione seus objetivos:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMMON_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  selectedGoals.includes(goal)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-sm">{goal}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Voltar
          </button>
          <button
            type="submit"
            disabled={selectedGoals.length === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedGoals.length > 0
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
