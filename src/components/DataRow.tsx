import { GripVertical, Copy, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTypeSelector from "./DataTypeSelector";

interface DataField {
  id: string;
  type: string;
  propertyName: string;
  option: string;
  checked: boolean;
  value?: string;
}

interface DataRowProps {
  field: DataField;
  index: number;
  onUpdate: (id: string, updates: Partial<DataField>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const OPTIONS_BY_TYPE: Record<string, string[]> = {
  names: ["Full name", "First name", "Last name"],
  phone: ["+1 ###-###-####", "+44 #### ######", "###-####"],
  email: ["Standard", "Corporate", "Random"],
  currency: ["USD", "EUR", "GBP", "JPY"],
  date: ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"],
  number: ["1-100", "1-1000", "Custom"],
  password: ["8 chars", "12 chars", "16 chars"],
};

const DataRow = ({ field, index, onUpdate, onDelete, onDuplicate }: DataRowProps) => {
  const options = OPTIONS_BY_TYPE[field.type] || [];
  
  return (
    <div className="data-row animate-fade-in group">
      <button className="cursor-grab text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4" />
      </button>
      
      <Checkbox
        checked={field.checked}
        onCheckedChange={(checked) => onUpdate(field.id, { checked: !!checked })}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      
      <span className="w-8 text-sm font-medium text-primary">
        {String(index + 1).padStart(2, "0")}
      </span>
      
      <DataTypeSelector
        value={field.type}
        onChange={(type) => onUpdate(field.id, { type, option: OPTIONS_BY_TYPE[type]?.[0] || "" })}
      />
      
      <Input
        value={field.propertyName}
        onChange={(e) => onUpdate(field.id, { propertyName: e.target.value })}
        placeholder="property_name"
        className="w-[140px] bg-card"
      />

      {field.type === 'constant' ? (
        <Input
          value={field.value || ''}
          onChange={(e) => onUpdate(field.id, { value: e.target.value })}
          placeholder="Enter constant value"
          className="w-[160px] bg-card"
        />
      ) : options.length > 0 ? (
        <Select value={field.option} onValueChange={(option) => onUpdate(field.id, { option })}>
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="w-[160px]" />
      )}
      
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onDuplicate(field.id)}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(field.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DataRow;
export type { DataField };
