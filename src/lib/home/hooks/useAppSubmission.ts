import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/lib/state/toast-context";
import { ClassicHeroFormSubmission } from "@/components/landing/ClassicHeroForm";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { AppTagId } from "@/lib/app-tags";

export function useAppSubmission() {
  const router = useRouter();
  const { push } = useToast();
  const { isSignedIn } = useUser();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getToastMessages = (type: AppTagId | "business_insights") => {
    switch (type) {
      case "trade_ranking":
        return { title: t("home.toasts.calculating") };
      case "love_writers":
        return { title: t("home.toasts.savingStory") };
      case "os_system":
        return { title: "Iniciando seu I/O OS..." };
      case "furniture_logistics":
      case "furniture_layout":
      case "furniture_store":
      case "io_mentoring":
      case "smart_survey":
      case "ai_blog":
        return { title: t("home.toasts.loadingPanel") };
      case "business_insights":
      default:
        return { title: t("home.toasts.almostThere") };
    }
  };

  const submitApp = async (
    type: AppTagId | "business_insights",
    values: Partial<ClassicHeroFormSubmission>
  ) => {
    setIsSubmitting(true);
    try {
      // 1. Save data to Session Storage for post-signup processing
      sessionStorage.setItem(
        "onboarding_data",
        JSON.stringify({
          type,
          data: values,
        })
      );

      // 2. Determine Toast Messages
      const { title } = getToastMessages(type);

      push({
        title,
        description: t("home.toasts.createAccount"),
        variant: "default",
      });

      // 3. Short delay for toast visibility before redirect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (type === "love_writers") {
        router.push("/sign-up?redirect_url=/admin");
      } else {
        router.push(isSignedIn ? "/admin" : "/sign-up?redirect_url=/admin");
      }
    } catch (error) {
      console.error(`Failed to capture data for ${type}:`, error);
      push({
        title: t("common.error"),
        description: t("home.toasts.errorOccurred"),
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return { submitApp, isSubmitting };
}
