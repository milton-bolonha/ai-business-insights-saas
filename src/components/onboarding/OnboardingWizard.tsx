"use client";

import { useMachine } from "@xstate/react";
import { onboardingMachine } from "@/lib/stores/machineStore";
import { CompanyStep } from "./steps/CompanyStep";
import { GoalsStep } from "./steps/GoalsStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { ConfirmationStep } from "./steps/ConfirmationStep";
import { SuccessStep } from "./steps/SuccessStep";

export const OnboardingWizard = () => {
  const [state, send] = useMachine(onboardingMachine);

  // Extraímos os dados do contexto da máquina
  const currentStep = state.context.currentStep;
  const userData = state.context.userData;
  const isCompleted = state.matches("completed");
  const hasError = !!state.context.error;
  const error = state.context.error;
  const isCreating = state.matches("creating");

  const handleNext = (data?: unknown) => {
    if (data) {
      send({ type: "UPDATE_DATA", data });
    }
    send({ type: "NEXT" });
  };

  if (isCompleted) {
    return <SuccessStep />;
  }

  return (
    <div className="onboarding-wizard max-w-2xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Passo {currentStep} de 4
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / 4) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Steps */}
      {state.matches("step1") && (
        <CompanyStep
          data={userData}
          onNext={handleNext}
          canProceed={!!userData.company.trim()}
        />
      )}

      {state.matches("step2") && (
        <GoalsStep
          data={userData}
          onNext={handleNext}
          onPrev={() => send({ type: "PREV" })}
        />
      )}

      {state.matches("step3") && (
        <PreferencesStep
          data={userData}
          onNext={handleNext}
          onPrev={() => send({ type: "PREV" })}
        />
      )}

      {state.matches("step4") && (
        <ConfirmationStep
          data={userData}
          onComplete={() => send({ type: "COMPLETE" })}
          onPrev={() => send({ type: "PREV" })}
          isCreating={isCreating}
        />
      )}
    </div>
  );
};
