"use client";
import { useState, useRef, useEffect } from "react";
import { chatWithNova, Message } from "@/lib/ai";

export function NovaAssistant({ restaurantName, menuContext }: { restaurantName: string, menuContext: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Bonjour ! Je suis Nova ✨. Comment puis-je vous aider aujourd'hui ?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = `Tu es Nova, l'IA assistante du restaurant ${restaurantName}. Tu as accès au menu suivant : ${menuContext}. Réponds aux clients avec courtoisie, aide-les à choisir et suggère des boissons.`;
      
      const res = await chatWithNova("gpt-oss:120b-cloud", [
        { role: "system", content: systemPrompt },
        ...messages,
        userMsg
      ]);

      const content = (res && typeof res === 'object' && 'message' in res) ? res.message.content : "Désolé, je rencontre une petite difficulté technique.";
      setMessages(prev => [...prev, { role: "assistant", content }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, mon cerveau de robot fait une pause. Réessayez ?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {isOpen ? (
        <div className="bg-[#111] border border-white/10 rounded-2xl w-80 shadow-2xl overflow-hidden flex flex-col h-96">
          <div className="bg-orange-500 p-3 flex justify-between items-center">
            <span className="font-bold text-white flex items-center gap-2">✨ Nova Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-70">✕</button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  m.role === 'user' ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/90 border border-white/5'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-orange-400 animate-pulse">Nova réfléchit...</div>}
          </div>

          <div className="p-3 border-t border-white/5 bg-white/5">
            <div className="flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Posez une question..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
              />
              <button onClick={handleSend} className="bg-orange-500 text-white p-2 rounded-lg text-xs">🚀</button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-2xl"
        >
          ✨
        </button>
      )}
    </div>
  );
}
