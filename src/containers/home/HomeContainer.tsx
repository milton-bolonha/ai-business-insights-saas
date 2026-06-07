"use client";

import { useState } from "react";
import "@fontsource/cabin-sketch";
import "@fontsource/reenie-beanie";

import { usePaymentFlow } from "@/containers/admin/hooks/usePaymentFlow";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { useHomeChat } from "@/lib/home/hooks/useHomeChat";
import { HomeSidebar } from "@/components/home/HomeSidebar";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeChatArea } from "@/components/home/HomeChatArea";

export function HomeContainer() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const payment = usePaymentFlow();
  
  const {
    activeAppTag,
    setActiveAppTag,
    messages,
    isTyping,
    isSubmitting,
    messagesEndRef,
    handleChatSubmit,
    handleTestMode
  } = useHomeChat();

  return (
    <div className="home-page h-[100dvh] overflow-hidden flex bg-[#0a0a0a] selection:bg-[#ccff00] selection:text-black">
      <HomeSidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        activeAppTag={activeAppTag}
        setActiveAppTag={setActiveAppTag}
      />

      <div className="flex-1 md:pl-72 flex flex-col h-full relative w-full overflow-hidden bg-[#fff0d4] bg-[url('/images/bg-pattern.png')] bg-repeat bg-auto bg-top">
        <HomeHeader setIsSidebarOpen={setIsSidebarOpen} />

        <HomeChatArea 
          activeAppTag={activeAppTag}
          messages={messages}
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
        />

        <ChatInterface
          activeAppTag={activeAppTag}
          onAppTagChange={setActiveAppTag}
          onSubmit={handleChatSubmit}
          onTestMode={handleTestMode}
          isSubmitting={isSubmitting}
          className="md:left-72"
        />

        <UpgradeModal
          open={payment.isUpgradeModalOpen}
          onClose={() => payment.setUpgradeModalOpen(false)}
          onCheckout={payment.startCheckout}
          onMarkMember={payment.confirmMembership}
          usage={payment.usage}
          limits={payment.limits}
          lastAction="createWorkspace"
          stripeCheckoutUrl={payment.stripeCheckoutUrl}
        />
      </div>
    </div>
  );
}
