import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "press inline-flex shrink-0 select-none items-center justify-center gap-2 border-[3px] border-border font-bold whitespace-nowrap shadow disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-105",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-105",
        outline: "bg-card text-foreground hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:brightness-105",
        accent: "bg-accent text-accent-foreground hover:brightness-105",
        info: "bg-info text-ink hover:brightness-105",
        ghost: "border-transparent shadow-none hover:bg-accent/60",
        link: "border-transparent shadow-none text-foreground underline underline-offset-4",
      },
      size: {
        default: "h-12 px-5 text-base",
        sm: "h-10 px-3 text-sm",
        lg: "h-14 px-7 text-lg",
        xl: "h-16 px-8 text-xl uppercase tracking-wider",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
