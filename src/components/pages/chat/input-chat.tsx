import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

const MAX_INPUT_CHARS = 1200;

type InputChatProps = {
  onSendMessage: (text: string) => void;
  isTyping: boolean;
};

const InputChat = ({ onSendMessage, isTyping }: InputChatProps) => {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const text = value.trim();

    if (!text || isTyping || text.length > MAX_INPUT_CHARS) return;

    onSendMessage(text);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }

    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const trimmedLength = value.trim().length;
  const isOverLimit = trimmedLength > MAX_INPUT_CHARS;

  return (
    <div className="dark:bg-input/30 rounded-xl p-4 border shadow-xs">
      <Textarea
        className="resize-none min-h-[48px] max-h-[200px] p-0 border-0 focus-visible:ring-0 shadow-none dark:bg-transparent"
        placeholder="Tuliskan pertanyaanmu disini..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex justify-between items-center gap-2 mt-3">
        <span className={`text-xs ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
          {trimmedLength}/{MAX_INPUT_CHARS}
        </span>
        <Button
          className="cursor-pointer disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={value.trim() === "" || isTyping || isOverLimit}
        >
          <SendHorizontal className="mr-2 h-4 w-4" />
          Kirim
        </Button>
      </div>
    </div>
  );
};

export default InputChat;
