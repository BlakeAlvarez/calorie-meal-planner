import { useStepNavigator } from "@/hooks/useStepNavigator";
import { stepLabels } from "@/stores/stepStore";
import clsx from "clsx";

export const StepProgressBar = () => {
  const { stepOrder, currentStep } = useStepNavigator();

  return (
    <div className="flex justify-between items-center border-b pb-4 mb-6">
      {stepOrder.map((step, i) => {
        const isActive = step === currentStep;
        const isCompleted = stepOrder.indexOf(currentStep) > i;

        return (
          <div
            key={step}
            className="flex-1 flex flex-col items-center relative"
          >
            {/* circle for step */}
            <div
              className={clsx(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium z-10",
                {
                  "bg-primary text-white border-primary": isActive,
                  "bg-muted text-muted-foreground": !isActive && !isCompleted,
                  "bg-green-500 text-white border-green-500": isCompleted,
                }
              )}
            >
              {i + 1}
            </div>

            {/* step labels */}
          <span className="mt-1 text-xs text-center">
            {stepLabels[step] ?? step}
          </span>
            {/* connector */}
            {i < stepOrder.length - 1 && (
              <div className="absolute top-4 left-1/2 w-full h-0.5 bg-muted -z-0" />
            )}
          </div>
        );
      })}
    </div>
  );
};
