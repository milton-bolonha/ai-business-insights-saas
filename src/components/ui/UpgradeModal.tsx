"use client";

import { useState } from "react";
import { X, Star, Check } from "lucide-react";

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
        return "creating workspaces";
      case "createContact":
        return "adding contacts";
      case "tileChat":
        return "chatting with insights";
      case "regenerate":
        return "regenerating content";
      default:
        return "using this feature";
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
            <h2 className="text-lg font-semibold">Upgrade to Pro</h2>
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
              You&apos;ve reached your free limit for {getActionDescription(lastAction || "")}.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Free Plan Limits</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <div>Workspaces: {getUsageText("createWorkspace")}</div>
                <div>Contacts: {getUsageText("createContact")}</div>
                <div>Tile Chats: {getUsageText("tileChat")}</div>
                <div>Regenerations: {getUsageText("regenerate")}</div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">Pro Plan Benefits</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>Unlimited workspaces</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>Unlimited contacts</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>AI chat with insights</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>Advanced AI models</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-800">
                  <Check className="h-4 w-4" />
                  <span>Cloud storage</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              disabled={isProcessing}
            >
              Maybe Later
            </button>
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Upgrade to Pro"}
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
                Already a member? Mark as paid
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

