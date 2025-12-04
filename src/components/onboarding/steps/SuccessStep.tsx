import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const SuccessStep = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin after 3 seconds
    const timer = setTimeout(() => {
      router.push("/admin");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Workspace criado com sucesso! 🎉
        </h2>
        <p className="text-gray-600">
          Seu espaço de trabalho personalizado está pronto para uso.
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800 text-sm">
          Redirecionando para o painel em alguns segundos...
        </p>
      </div>

      <button
        onClick={() => router.push("/admin")}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Ir para o Painel →
      </button>
    </div>
  );
};
