import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DATA_TYPES = [
  { value: "names", label: "Names", icon: "👤" },
  { value: "phone", label: "Phone", icon: "📞" },
  { value: "email", label: "Email", icon: "✉️" },
  { value: "text", label: "Text", icon: "📝" },
  { value: "address", label: "Street Address", icon: "🏠" },
  { value: "postal", label: "Postal / Zip", icon: "📮" },
  { value: "region", label: "Region", icon: "🗺️" },
  { value: "country", label: "Country", icon: "🌍" },
  { value: "alphanumeric", label: "Alphanumeric", icon: "🔤" },
  { value: "subscriber_id", label: "Subscriber ID", icon: "🛂" },
  { value: "number", label: "Number Range", icon: "🔢" },
  { value: "currency", label: "Currency", icon: "💰" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "constant", label: "Constant Value", icon: "📌" },
  { value: "creditcard", label: "Credit Card", icon: "💳" },
  { value: "password", label: "Password", icon: "🔒" },
];

interface DataTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const DataTypeSelector = ({ value, onChange }: DataTypeSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-card">
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent>
        {DATA_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <span className="flex items-center gap-2">
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DataTypeSelector;
export { DATA_TYPES };
