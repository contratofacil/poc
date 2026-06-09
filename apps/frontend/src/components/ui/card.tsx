import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "bg-white border border-[#e8e4dd] rounded-xl shadow-[0_1px_3px_0_rgb(0_0_0/0.06)]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: CardHeaderProps) {
  return (
    <div
      className={["flex flex-col space-y-1 p-5 border-b border-[#e8e4dd]", className].join(" ")}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }: CardTitleProps) {
  return (
    <h3
      className={[
        "font-serif text-lg font-semibold text-[#1a3a5c] leading-tight",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: CardContentProps) {
  return <div className={["p-5", className].join(" ")} {...props} />;
}

export function CardFooter({ className = "", ...props }: CardFooterProps) {
  return (
    <div
      className={["flex items-center p-5 pt-0", className].join(" ")}
      {...props}
    />
  );
}
