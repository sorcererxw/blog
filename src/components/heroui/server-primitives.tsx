import * as React from "react";
import { cardVariants, separatorVariants } from "@heroui/styles";

import { cn } from "@/lib/utils";

type CardVariant = "transparent" | "default" | "secondary" | "tertiary";
type SeparatorVariant = "default" | "secondary" | "tertiary";

function HeroCard({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: CardVariant }) {
  return (
    <div
      className={cn(cardVariants({ variant }).base(), className)}
      {...props}
    />
  );
}

function HeroCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(cardVariants().header(), className)} {...props} />;
}

function HeroCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(cardVariants().content(), className)} {...props} />;
}

function HeroCardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(cardVariants().title(), "font-heading", className)}
      {...props}
    />
  );
}

function HeroCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn(cardVariants().description(), className)} {...props} />
  );
}

function HeroSeparator({
  className,
  orientation = "horizontal",
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
  variant?: SeparatorVariant;
}) {
  return (
    <div
      aria-orientation={orientation}
      className={cn(separatorVariants({ orientation, variant }), className)}
      role="separator"
      {...props}
    />
  );
}

export {
  HeroCard,
  HeroCardContent,
  HeroCardDescription,
  HeroCardHeader,
  HeroCardTitle,
  HeroSeparator,
};
