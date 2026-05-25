import logo from "@/assets/images/commons/logo-vina.svg";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  alt?: string;
};

export function BrandLogo({ className, alt = "Sữa Vina" }: BrandLogoProps) {
  return (
    <img
      src={logo}
      alt={alt}
      className={cn("h-9 w-auto shrink-0 object-contain", className)}
    />
  );
}
