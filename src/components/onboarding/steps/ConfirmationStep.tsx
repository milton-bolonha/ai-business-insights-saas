interface ConfirmationStepProps {
  data: {
    company: string;
    website: string;
    goals: string[];
    preferences: Record<string, unknown>;
  };
  onComplete: () => void;
  onPrev: () => void;
  isCreating: boolean;
}

export const ConfirmationStep = ({ data, onComplete, onPrev, isCreating }: ConfirmationStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirme seus dados 📋
        </h2>
        <p className="text-gray-600">
          Revise as informações antes de criar seu workspace
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-1">Empresa</h3>
          <p className="text-gray-600">{data.company}</p>
        </div>

        {data.website && (
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Website</h3>
            <p className="text-gray-600">{data.website}</p>
          </div>
        )}

        <div>
          <h3 className="font-medium text-gray-900 mb-1">Objetivos</h3>
          <ul className="text-gray-600 space-y-1">
            {data.goals.map((goal, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {goal}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-1">Preferences</h3>
          <p className="text-gray-600">
            Language: {(data.preferences as Record<string, string>).language || "English"}
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={isCreating}
          className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={isCreating}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isCreating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {isCreating ? "Creating..." : "Create Workspace →"}
        </button>
      </div>
    </div>
  );
};
