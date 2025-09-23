import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";


interface SwapCompleteDialogProps {
    isOpen?: boolean
    isSwappingInProgress?: boolean
}


export function SwapCompleteDialog({
    isOpen = false,
    isSwappingInProgress = false
}:SwapCompleteDialogProps) {
    return (
        <Dialog open={isOpen}>
            <DialogContent className={cn("bg-baltic-sea border-none w-[489px] overflow-hidden",
                isSwappingInProgress && "h-[178px]"
            )} >
                {
                    isSwappingInProgress && (
                        <div className="w-full h-full flex items-center justify-center gap-x-2" >
                            <Zap className="size-8 text-white" />
                            <p className="text-[32px] font-bold text-white" >Swapping in Progress…</p>

                            <Progress 
                                className="absolute left-[-5px] w-[110%] bottom-[-7px] h-4" 
                                indicatorClassName="bg-tealish-green"
                                value={100} 
                            />
                        </div>
                    )
                }
            </DialogContent>
        </Dialog>
    )
}