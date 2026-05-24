"use client";

import { useState } from "react";
import { X, Star, Check } from "lucide-react";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  onMarkMember?: () => void;
  usage?: Record<string, number>;
  limits?: Record<string, number>;
  lastAction?: string;
  stripeCheckoutUrl?: string;
}

export function UpgradeModal({
  open,
  onClose,
  onCheckout,
  onMarkMember,
  usage = {},
  limits = {},
  lastAction,
  stripeCheckoutUrl,
}: UpgradeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      onCheckout();
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getUsageText = (action: string) => {
    const used = usage[action] || 0;
    const limit = limits[action] || 0;
    return `${used}/${limit}`;
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case "createWorkspace":
        return t("admin.modals.actions.createWorkspace");
      case "createContact":
        return t("admin.modals.actions.createContact");
      case "tileChat":
        return t("admin.modals.actions.tileChat");
      case "regenerate":
        return t("admin.modals.actions.regenerate");
      default:
        return t("admin.modals.actions.default");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">{t("admin.modals.upgradeToProTitle")}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {t("admin.modals.reachedLimit", { action: getActionDescription(lastAction || "") })}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                {t("admin.modals.walletBuffer")}
              </h3>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex justify-between font-medium">
                  <span>{t("admin.modals.creditsUsed")}</span>
                  <span>{usage?.creditsUsed || 0} / {limits?.creditsTotal || 0}</span>
                </div>
                <div className="mt-2 text-xs text-blue-700/80">
                  {t("admin.modals.needMoreCredits")}
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">
                {t("admin.modals.proPlanBenefits")}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>{t("admin.modals.benefitUnlimitedWorkspaces")}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>{t("admin.modals.benefitUnlimitedContacts")}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>{t("admin.modals.benefitAiChat")}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>{t("admin.modals.benefitAdvancedAi")}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>{t("admin.modals.benefitCloudStorage")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex">
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? t("admin.modals.processing") : t("admin.modals.upgradeToPro")}
            </button>
          </div>

          {onMarkMember && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  onMarkMember();
                  onClose();
                }}
                className="w-full rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                {t("admin.modals.markAsPaid")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
