import * as React from "react"
import { cn } from "@/lib/utils"

type AccordionValue = string | string[]

type AccordionContextValue = {
  type: "single" | "multiple"
  openValues: string[]
  toggleValue: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

function useAccordionContext() {
  const context = React.useContext(AccordionContext)
  if (!context) {
    throw new Error("Accordion components must be used within <Accordion>")
  }
  return context
}

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple"
  value?: AccordionValue
  defaultValue?: AccordionValue
  onValueChange?: (value: AccordionValue) => void
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      className,
      children,
      type = "single",
      value,
      defaultValue,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const normalize = (input?: AccordionValue) =>
      Array.isArray(input) ? input : input ? [input] : []

    const [internalOpen, setInternalOpen] = React.useState<string[]>(
      normalize(defaultValue)
    )

    const openValues = isControlled ? normalize(value) : internalOpen

    const toggleValue = (item: string) => {
      let next = openValues
      if (type === "single") {
        next = openValues[0] === item ? [] : [item]
      } else {
        next = openValues.includes(item)
          ? openValues.filter((v) => v !== item)
          : [...openValues, item]
      }

      if (!isControlled) {
        setInternalOpen(next)
      }

      onValueChange?.(type === "single" ? next[0] ?? "" : next)
    }

    return (
      <AccordionContext.Provider value={{ type, openValues, toggleValue }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => (
    <div
      ref={ref}
      data-accordion-item=""
      data-value={value}
      className={cn("rounded-md border bg-background", className)}
      {...props}
    >
      {children}
    </div>
  )
)
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => {
  const { openValues, toggleValue } = useAccordionContext()
  const parentValue =
    value ??
    (props as any)?.["data-accordion-item-value"] ??
    (props as any)?.["data-value"]
  const isOpen = parentValue ? openValues.includes(parentValue) : false

  return (
    <button
      ref={ref}
      type="button"
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted",
        className
      )}
      onClick={() => parentValue && toggleValue(parentValue)}
      {...props}
    >
      {children}
      <svg
        aria-hidden
        className={cn(
          "h-4 w-4 shrink-0 transition-transform",
          isOpen && "rotate-180"
        )}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 9L12 15L18 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => {
  const { openValues } = useAccordionContext()
  const parentValue =
    value ??
    (props as any)?.["data-accordion-item-value"] ??
    (props as any)?.["data-value"]
  const isOpen = parentValue ? openValues.includes(parentValue) : false

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      data-state={isOpen ? "open" : "closed"}
      className={cn("pt-0", className)}
      {...props}
    >
      {children}
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
