import { useState, useEffect, useRef, ReactNode } from "react";
import { AppTagId, APP_ATTRIBUTES } from "@/lib/app-tags";
import { ClassicHeroFormSubmission } from "@/components/landing/ClassicHeroForm";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { TEST_SCENARIOS, TestScenario } from "../test-scenarios";
import { useAppSubmission } from "./useAppSubmission";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string | ReactNode;
};

export function useHomeChat() {
  const { t } = useTranslation();
  const { submitApp, isSubmitting } = useAppSubmission();

  const [activeAppTag, setActiveAppTag] = useState<AppTagId>("home");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [formValues, setFormValues] = useState<Partial<ClassicHeroFormSubmission>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initial Greeting Effect
  useEffect(() => {
    let initialMessage = t("home.chat.initialGreeting");

    if (activeAppTag !== "home") {
      const firstInfo = APP_ATTRIBUTES.find((a) => a.appTagId === activeAppTag);
      if (firstInfo) {
        const title = t(`appTags.${activeAppTag}.label`);
        const label = t(`attributes.${firstInfo.id}.label`);
        initialMessage = t("home.chat.selectedTag", { title, label });
      }
    }

    if (!hasStarted) {
      setHasStarted(true);
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        setMessages([{ role: "assistant", content: initialMessage }]);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setMessages([]);
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        // Replace entire chat instead of accumulating history
        setMessages([{ role: "assistant", content: initialMessage }]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeAppTag, hasStarted, t]);

  const handleTestMode = (scenario: string = "iphone") => {
    if (activeAppTag !== "trade_ranking") return;

    const testScenario = TEST_SCENARIOS[scenario as TestScenario];
    if (!testScenario) return;

    setFormValues(testScenario.values);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `⏩ Skip to ${testScenario.label} Analysis` },
      {
        role: "assistant",
        content: t("home.chat.testModeActive", { scenario: testScenario.label }),
      },
    ]);

    setTimeout(() => {
      submitApp("trade_ranking", testScenario.values);
    }, 1500);
  };

  const handleChatSubmit = (msg: string, attrId?: string) => {
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    // 1. Identify context
    const currentTagAttributes = APP_ATTRIBUTES.filter(
      (a) => a.appTagId === activeAppTag
    );

    // 2. Determine what we just filled (if any) or infer it
    let updatedValues = { ...formValues };
    if (attrId) {
      const key = attrId as keyof ClassicHeroFormSubmission;
      updatedValues[key] = msg as any;
      setFormValues((prev) => ({ ...prev, [key]: msg }));
    } else {
      const nextMissing = currentTagAttributes.find(
        (a) => !formValues[a.id as keyof ClassicHeroFormSubmission]
      );
      if (nextMissing) {
        const key = nextMissing.id as keyof ClassicHeroFormSubmission;
        updatedValues[key] = msg as any;
        setFormValues((prev) => ({ ...prev, [key]: msg }));
      }
    }

    // 3. Find the NEXT missing attribute
    const nextMissingAttribute = currentTagAttributes.find(
      (a) => !updatedValues[a.id as keyof ClassicHeroFormSubmission]
    );

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      if (activeAppTag !== "home") {
        if (nextMissingAttribute) {
          // Ask for the next field
          const label = t(`attributes.${nextMissingAttribute.id}.label`);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: t("home.chat.missingField", { label }),
            },
          ]);
        } else {
          // All done!
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: t("home.chat.generating"),
            },
          ]);

          // Trigger submission after a short delay
          setTimeout(() => {
            submitApp(activeAppTag, updatedValues);
          }, 1500);
        }
      } else {
        // General Chat
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "That sounds interesting! Tell me more or pick a specific app to structure this.",
          },
        ]);
      }
    }, 1000);
  };

  return {
    activeAppTag,
    setActiveAppTag,
    messages,
    isTyping,
    isSubmitting,
    messagesEndRef,
    handleChatSubmit,
    handleTestMode,
  };
}
