import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-otter text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-otter-blue disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-otter-blue text-white shadow-soft hover:bg-otter-blue/90",
        destructive:
          "bg-otter-pink text-white shadow-sm hover:bg-otter-pink/90",
        outline:
          "border-2 border-otter-lavender/30 bg-transparent shadow-sm hover:bg-otter-blue/5 hover:text-otter-blue",
        secondary:
          "bg-otter-fresh text-white shadow-sm hover:bg-otter-fresh/80",
        ghost: "hover:bg-otter-blue/10 hover:text-otter-blue",
        link: "text-otter-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-otter px-10 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
