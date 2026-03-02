"use client";

import { useState } from "react";
import { askAI } from "../lib/api-client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hej! Jag är din AI-mekaniker. Vad krånglar med bilen idag?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Lägg till användarens fråga i chatten
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Anropa din FastAPI backend (vi hårdkodar car_id: 1 för nu tills vi bygger klickfunktionen på korten)
      const response = await askAI(1, userMsg.content);
      
      // Lägg till AI:ns svar
      setMessages((prev) => [...prev, { role: "ai", content: response.answer || response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "Ursäkta, jag tappade anslutningen till servern. Har du startat din backend i Docker?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full min-h-[400px] max-h-[600px] shadow-md border-gray-200">
      <CardHeader className="bg-gray-50 border-b pb-4 rounded-t-xl">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
          <span className="text-blue-500">🤖</span> AI-Assistent
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="flex flex-col gap-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 p-3 rounded-xl rounded-bl-none border border-gray-200 text-sm flex gap-1 items-center">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 bg-white border-t rounded-b-xl">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="flex w-full gap-2"
        >
          <Input 
            placeholder="Beskriv felet (t.ex. 'Det gnisslar när jag bromsar')..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700">
            Skicka
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}