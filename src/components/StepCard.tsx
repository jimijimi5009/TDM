import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StepCardProps {
  step: number;
  title: string;
  children: ReactNode;
}

const StepCard = ({ step, title, children }: StepCardProps) => {
  return (
    <Card className="shadow-card border-border/50 overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        <div className="step-badge">{step}</div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default StepCard;
