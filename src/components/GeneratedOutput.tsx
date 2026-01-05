import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface GeneratedOutputProps {
  data: string;
  format: string;
}

const GeneratedOutput = ({ data, format }: GeneratedOutputProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      json: "json",
      xml: "xml",
      csv: "csv",
      sql: "sql",
      python: "py",
      javascript: "js",
      php: "php",
      html: "html",
      pipe: "txt",
    };
    const ext = extensions[format] || "txt";
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-data.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "File downloaded!" });
  };

  return (
    <Card className="shadow-card border-border/50 animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Generated Data</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted rounded-lg p-4 overflow-auto max-h-[400px] text-sm font-mono text-foreground">
          {data}
        </pre>
      </CardContent>
    </Card>
  );
};

export default GeneratedOutput;
