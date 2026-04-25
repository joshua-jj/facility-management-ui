import { Popover as PopoverPrimitive } from '@base-ui/react/popover'

import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

function PopoverContent({
   className,
   align = 'center',
   side = 'bottom',
   sideOffset = 4,
   ...props
}: PopoverPrimitive.Popup.Props & {
   align?: PopoverPrimitive.Positioner.Props['align']
   side?: PopoverPrimitive.Positioner.Props['side']
   sideOffset?: PopoverPrimitive.Positioner.Props['sideOffset']
}) {
   return (
      <PopoverPrimitive.Portal>
         {/* z-index must clear the sticky Header (z-[5001]) so the popover renders above it. */}
         <PopoverPrimitive.Positioner
            side={side}
            align={align}
            sideOffset={sideOffset}
            className="z-[5100]"
         >
            <PopoverPrimitive.Popup
               data-slot="popover-content"
               className={cn(
                  'bg-popover text-popover-foreground data-[ending-style]:animate-out data-[starting-style]:animate-in data-[ending-style]:fade-out-0 data-[starting-style]:fade-in-0 data-[ending-style]:zoom-out-95 data-[starting-style]:zoom-in-95 w-72 rounded-lg border p-4 shadow-md outline-none',
                  className,
               )}
               {...props}
            />
         </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
   )
}

export { Popover, PopoverTrigger, PopoverContent }
