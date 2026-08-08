import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, X, Minus } from "lucide-react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useHotelInfo } from "@/hooks/useHotelInfo";
import assistantAvatar from "@/assets/assistant-avatar.png";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-assistant`;
const SESSION_KEY = "gtgh_assistant_session";

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const SUGGESTIONS = [
  "What rooms do you have and how much?",
  "Any rooms free next weekend?",
  "Tell me about the gorilla trekking packages",
  "How far are you from the park?",
];

const ChatWidget = () => {
  const { name } = useHotelInfo();
  const [open, setOpen] = useState(false);
  const [sessionId] = useState(getSessionId);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load the saved conversation once, before mounting the chat.
  useEffect(() => {
    if (!open || initial || !sessionId) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: "history", sessionId }),
        });
        const json = await res.json();
        if (!active) return;
        setInitial(
          (json.messages ?? []).map((m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: m.content }],
          })),
        );
      } catch {
        if (active) setInitial([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, initial, sessionId]);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat with our assistant"
          className="fixed bottom-24 right-5 sm:bottom-[6.5rem] sm:right-6 z-[55] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl ring-4 ring-primary/20 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <MessageCircle size={24} />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
        </button>
      )}

      {open && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px] z-[60] flex flex-col rounded-2xl border border-primary/20 bg-card shadow-2xl overflow-hidden h-[70svh] max-h-[620px]">
          <header className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-transparent shrink-0">
            <img
              src={assistantAvatar}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              className="w-9 h-9 rounded-full bg-background object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="font-serif text-sm font-semibold text-foreground leading-tight truncate">
                Kivu — Guest Assistant
              </p>
              <p className="text-[11px] text-emerald-500 font-sans flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online now
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Minimise chat"
              className="p-1.5 rounded-lg text-foreground/60 hover:bg-muted transition-colors"
            >
              <Minus size={18} />
            </button>
          </header>

          {initial === null ? (
            <div className="flex-1 flex items-center justify-center">
              <Shimmer>Loading your conversation…</Shimmer>
            </div>
          ) : (
            <ChatBody
              sessionId={sessionId}
              initialMessages={initial}
              input={input}
              setInput={setInput}
              textareaRef={textareaRef}
              hotelName={name}
            />
          )}
        </div>
      )}
    </>
  );
};

function ChatBody({
  sessionId,
  initialMessages,
  input,
  setInput,
  textareaRef,
  hotelName,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
  input: string;
  setInput: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  hotelName?: string;
}) {
  const { messages, sendMessage, status, error } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: ENDPOINT,
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: { sessionId },
    }),
    onError: (err) => {
      const msg = err?.message ?? "";
      if (msg.includes("429")) toast.error("Too many messages — please wait a moment.");
      else if (msg.includes("402")) toast.error("The assistant is temporarily unavailable.");
      else toast.error("Couldn't reach the assistant. Please try again.");
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    textareaRef.current?.focus();
  }, [textareaRef]);

  useEffect(() => {
    if (status === "ready") textareaRef.current?.focus();
  }, [status, textareaRef]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <>
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-3">
          {messages.length === 0 && (
            <div className="py-6 text-center space-y-4">
              <p className="text-sm text-foreground/70 font-sans px-4">
                Muraho! I'm Kivu, your assistant at {hotelName || "Gorilla Trekking Guest House"}.
                Ask me about rooms, prices, availability or gorilla trekking.
              </p>
              <div className="flex flex-col gap-2 px-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-[13px] font-sans px-3 py-2 rounded-xl border border-primary/20 text-foreground/80 hover:bg-primary/5 hover:border-primary/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}

          {error && (
            <p className="text-xs text-destructive font-sans px-2">
              Something went wrong. Please send your message again.
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-3 border-t border-border/60 shrink-0">
        <PromptInput
          onSubmit={(_, e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about rooms, prices, trekking…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}

export default ChatWidget;
