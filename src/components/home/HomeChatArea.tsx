import { ReactNode, RefObject } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { AppTagId } from "@/lib/app-tags";

interface HomeChatAreaProps {
  activeAppTag: AppTagId;
  messages: Array<{ role: 'user' | 'assistant' | 'system', content: string | ReactNode }>;
  isTyping: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function HomeChatArea({ activeAppTag, messages, isTyping, messagesEndRef }: HomeChatAreaProps) {
  const { locale } = useTranslation();

  const getAppTitleWord = (tagId: string, loc: string) => {
    switch (tagId) {
      case 'business_insights': return loc === 'pt' ? 'Análises' : 'Insights';
      case 'love_writers': return loc === 'pt' ? 'Romances' : 'Stories';
      case 'trade_ranking': return loc === 'pt' ? 'Lojas' : 'Stores';
      case 'furniture_logistics': return loc === 'pt' ? 'Rotas' : 'Routes';
      case 'furniture_layout': return loc === 'pt' ? 'Layouts' : 'Layouts';
      case 'furniture_store': return loc === 'pt' ? 'Vitrines' : 'Stores';
      case 'io_mentoring': return loc === 'pt' ? 'Academias' : 'Academy';
      case 'smart_survey': return loc === 'pt' ? 'Pesquisas' : 'Surveys';
      case 'ai_blog': return loc === 'pt' ? 'Blogs' : 'Blogs';
      case 'os_system': return loc === 'pt' ? 'Sistemas' : 'Systems';
      default: return loc === 'pt' ? 'Coisas' : 'Stuffs';
    }
  };

  const heroContent = {
    title: (
      <>
        {locale === 'pt' ? 'Crie ' : 'Build Cool '}
        <span className="text-purple-600">{getAppTitleWord(activeAppTag, locale)}</span>
        {locale === 'pt' && ' Incríveis'}
      </>
    ),
    subtitle: (
      <>
        {locale === 'pt' ? 'Transforme suas ideias em ' : 'Turn your ideas into '}
        <span className="text-pink-500 font-semibold">
          {locale === 'pt' ? 'Produtos IA' : 'AI products'}
        </span>
      </>
    )
  };

  return (
    <main className="flex-1 pt-24 pb-48 px-4 flex flex-col overflow-y-auto min-h-0 w-full home-main-scrollbar" style={{ scrollbarColor: '#ccff00 #1a1a1a' }}>
      <div className="flex-1" />
      <div className="mx-auto max-w-4xl w-full space-y-4 relative mb-8 shrink-0">
        
        {/* Mascot Image - Absolutely positioned */}
        <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[60px] top-[-50px] md:top-[-100px] pointer-events-none z-0 opacity-90 w-[120px] sm:w-[150px] md:w-[280px]">
          <Image 
            src="/images/maskot.png" 
            alt="Mascot" 
            width={720} 
            height={680} 
            className="object-contain drop-shadow-2xl w-full h-auto"
            priority
          />
        </div>

        {/* Static Hero Content (Always visible) */}
        <div className="space-y-1 mb-4 relative z-10 max-w-3xl mt-24 md:mt-0 text-center md:text-left">
          <h1 className="text-4xl font-medium tracking-tight text-gray-900 sm:text-5xl" style={{ fontFamily: "'Cabin Sketch', cursive", fontWeight: 500 }}>
            {heroContent.title}
          </h1>
          <p className="text-xl text-gray-600" style={{ fontFamily: "'Reenie Beanie', cursive", fontSize: "2rem" }}>
            {heroContent.subtitle}
          </p>
        </div>

        {/* Chat History */}
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={
                msg.role === 'user'
                  ? "bg-[#333] text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-md"
                  : "bg-white border border-gray-100 shadow-sm text-gray-900 rounded-2xl rounded-tl-sm px-5 py-3 max-w-md"
              }>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invisible spacer for scrolling */}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
