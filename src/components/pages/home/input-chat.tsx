import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendHorizontal } from 'lucide-react'

const InputChat = () => {
    return (
        <div className="dark:bg-input/30 rounded-md p-4 border shadow-xs">
            <Textarea
                className="resize-none min-h-[25px] max-h-[200px] p-0 border-0 focus-visible:ring-0 shadow-none dark:bg-transparent"
                placeholder="Tuliskan pertanyaanmu disini..."
            />
            <div className="flex justify-end mt-3">
                <Button><SendHorizontal /> Kirim</Button>
            </div>
        </div>
    )
}

export default InputChat
