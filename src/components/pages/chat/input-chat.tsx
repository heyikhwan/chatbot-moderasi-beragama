"use client"

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type InputChatProps = {
    onSendMessage: (text: string) => void;
    isTyping: boolean;
    onDeleteSession: () => void;
    hasMessages: boolean;
}

const InputChat = ({ onSendMessage, isTyping, onDeleteSession, hasMessages }: InputChatProps) => {
    const [value, setValue] = useState("")

    const handleSend = () => {
        onSendMessage(value)
        setValue("")
    }

    const handleDeleteSession = () => {
        onDeleteSession()
    }

    return (
        <div className="dark:bg-input/30 rounded-md p-4 border shadow-xs">
            <Textarea
                className="resize-none min-h-[25px] max-h-[200px] p-0 border-0 focus-visible:ring-0 shadow-none dark:bg-transparent"
                placeholder="Tuliskan pertanyaanmu disini..." value={value} onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <div className="flex justify-end items-center gap-2 mt-3">
                {hasMessages && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isTyping}>
                                <Trash2 className="text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus obrolan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ini akan menghapus seluruh obrolan.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batalkan</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive hover:bg-destructive/80">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <Button className="cursor-pointer" onClick={handleSend} disabled={(!value || value.trim() === "") || isTyping}><SendHorizontal /> Kirim</Button>
            </div>
        </div>
    )
}

export default InputChat