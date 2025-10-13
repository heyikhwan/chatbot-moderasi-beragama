import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

type InputChatProps = {
  onSendMessage: (text: string) => void;
  isTyping: boolean;
};

const InputChat = ({ onSendMessage, isTyping }: InputChatProps) => {
  const [value, setValue] = useState("");

  const handleSend = () => {
    onSendMessage(value);
    setValue("");
  };

  return (
    <div className="dark:bg-input/30 rounded-md p-4 border shadow-xs">
      <Textarea
        className="resize-none min-h-[25px] max-h-[200px] p-0 border-0 focus-visible:ring-0 shadow-none dark:bg-transparent"
        placeholder="Tuliskan pertanyaanmu disini..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
      />
      <div className="flex justify-end items-center gap-2 mt-3">
        <Button
          className="cursor-pointer"
          onClick={handleSend}
          disabled={(!value || value.trim() === "") || isTyping}
        >
          <SendHorizontal /> Kirim
        </Button>
      </div>
    </div>
  );
};

export default InputChat;