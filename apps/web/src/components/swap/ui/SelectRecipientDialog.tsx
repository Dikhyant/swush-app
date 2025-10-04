import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowRight, CircleAlert, X } from "lucide-react";

interface SelectRecipientDialogProps {
    isOpen?: boolean
    onConnectWalletClick?: () => void
    onOpenChange?: (open: boolean) => void
}
export default function SelectRecipientDialog({
    isOpen,
    onConnectWalletClick,
    onOpenChange
}:SelectRecipientDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} >
            <DialogContent className="w-11/12 sm:w-full max-w-lg p-6 rounded-xl sm:rounded-xl bg-midnight border border-dark-slate-gray" isCloseIconVisible={false} >
                <div className="flex items-center justify-center relative" >
                    <p className="text-white text-2xl font-medium" >Select Recipient</p>
                    <DialogClose className="absolute self-center right-0" ><X className="w-5 h-5 stroke-2 text-white" /></DialogClose>
                </div>
                <div className="bg-blackPearl border-dark-slate-gray rounded-2xl flex flex-col items-stretch p-6 overflow-hidden relative mt-4" >
                    <p className="text-white text-sm font-normal" >Your wallet</p>
                    <Button 
                        variant="primary" 
                        // size="primary"
                        className="text-base mt-1"
                        onClick={onConnectWalletClick} 
                    >Connect Wallet</Button>

                    <div className="my-8 relative flex justify-center" >
                        <div className="flex items-center absolute w-[120%] self-center" >
                            <div className="bg-dark-slate-gray h-px w-full" ></div>
                            <p className="uppercase text-base font-normal text-white/70 mx-1" >OR</p>
                            <div className="bg-dark-slate-gray h-px w-full" ></div>
                        </div>
                    </div>

                    <p className="text-white text-sm font-normal" >Custom wallet</p>
                    <div className="flex items-center gap-x-2" >
                        <Input 
                            className="border-black-eel bg-transparent rounded-2xl text-white/60 placeholder:text-white/30 placeholder:text-sm placeholder:font-normal h-12 mt-1" 
                            placeholder="Paste Address"
                            type="text"
                        />
                        <button className="rounded-full bg-blue-whale hover:bg-blue-whale/70 w-20 h-12 flex items-center justify-center" >
                            <ArrowRight className="w-6 h-6 text-white" />
                        </button>
                    </div>
                    <div className="flex items-center text-white/80 gap-px mt-1" >
                        <CircleAlert className="w-3 h-3" />
                        <p className="text-xs font-light" >Double check the address to avoid losing funds</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}