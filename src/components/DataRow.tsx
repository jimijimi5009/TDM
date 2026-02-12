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
  example?: string;
}

interface DataRowProps {
  field: DataField;
  index: number;
  onUpdate: (id: string, updates: Partial<DataField>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isCreateMode: boolean;
  isIntakeMode?: boolean;
}

const DataRow = ({ field, index, onUpdate, onDelete, onDuplicate, isCreateMode, isIntakeMode }: DataRowProps) => {
  if (isIntakeMode) {
    return (
      <div className="data-row animate-fade-in group flex items-center gap-4 px-4 py-3 bg-card hover:bg-muted/50 border-b border-border transition-colors">
        <div className="flex-1 text-sm font-medium text-foreground">
          {field.propertyName}
        </div>
        
        <div className="flex-1">
          <Input
            value={field.value || ""}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            placeholder={field.example ? `e.g. ${field.example}` : "Leave empty for random data"}
            className="h-8"
          />
        </div>
        
        <div className="flex items-center gap-1 w-20">
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
  }

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
        onChange={(type) => onUpdate(field.id, { type })}
      />
      
      <div className="w-[140px] text-sm text-foreground truncate" title={field.propertyName}>
        {field.propertyName}
      </div>

      {/* This is the placeholder for the old "Options" column */}
      <div className="w-[160px]" />

      <div className="w-[160px]">
        {isCreateMode ? (
          <Input
            value={field.value || ""}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            placeholder="Enter value"
            className="h-8"
          />
        ) : (
          <Input
            value={field.value || ""}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            placeholder="Filter (optional)"
            className="h-8"
          />
        )}
      </div>
      
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
