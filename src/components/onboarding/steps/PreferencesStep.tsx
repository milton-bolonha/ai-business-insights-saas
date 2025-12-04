import { useState } from "react";

interface PreferencesStepProps {
  data: {
    preferences: Record<string, unknown>;
  };
  onNext: (data: { preferences: Record<string, unknown> }) => void;
  onPrev: () => void;
}

export const PreferencesStep = ({ data, onNext, onPrev }: PreferencesStepProps) => {
  const [preferences, setPreferences] = useState(data.preferences);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ preferences });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Personalize sua experiência 🎨
        </h2>
        <p className="text-gray-600">
          Configure suas preferências para uma experiência perfeita
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Preferred language:
          </label>
          <select
            value={(preferences.language as string) || "en-US"}
            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en-US">English</option>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back ←
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Next →
          </button>
        </div>
      </form>
    </div>
  );
};
