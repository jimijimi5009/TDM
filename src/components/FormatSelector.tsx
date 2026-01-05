import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const FORMATS = [
  { value: "json", label: "JSON" },
  { value: "csv", label: "CSV" },
  { value: "sql", label: "SQL" },
];

interface FormatSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const FormatSelector = ({ value, onChange }: FormatSelectorProps) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="flex flex-wrap gap-3"
    >
      {FORMATS.map((format) => (
        <div key={format.value} className="flex items-center">
          <RadioGroupItem
            value={format.value}
            id={format.value}
            className="peer sr-only"
          />
          <Label
            htmlFor={format.value}
            className={`format-chip ${
              value === format.value ? "format-chip-selected" : "format-chip-unselected"
            }`}
          >
            {format.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

export default FormatSelector;
