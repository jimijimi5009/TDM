import type { DataField } from "@/components/DataRow";

const FIRST_NAMES = ["James", "Emma", "Michael", "Olivia", "William", "Ava", "Alexander", "Sophia", "Daniel", "Isabella", "David", "Mia", "Joseph", "Charlotte", "Andrew", "Amelia"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor"];
const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "example.com", "test.org", "company.io"];
const STREETS = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm Blvd", "Park Way", "Lake View"];
const CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"];
const COUNTRIES = ["United States", "Canada", "United Kingdom", "Germany", "France", "Australia", "Japan", "Brazil"];
const REGIONS = ["California", "Texas", "Florida", "New York", "Pennsylvania", "Illinois", "Ohio", "Georgia"];
const LOREM = ["Lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor"];

const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNum = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDigits = (n: number) => Array.from({ length: n }, () => randomNum(0, 9)).join("");
const randomLetters = (n: number) => Array.from({ length: n }, () => random("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""))).join("");

const generateValue = (field: DataField): string => {
  switch (field.type) {
    case "names": {
      const first = random(FIRST_NAMES);
      const last = random(LAST_NAMES);
      if (field.option === "First name") return first;
      if (field.option === "Last name") return last;
      return `${first} ${last}`;
    }
    case "phone": {
      if (field.option === "+44 #### ######") return `+44 ${randomDigits(4)} ${randomDigits(6)}`;
      if (field.option === "###-####") return `${randomDigits(3)}-${randomDigits(4)}`;
      return `+1 ${randomDigits(3)}-${randomDigits(3)}-${randomDigits(4)}`;
    }
    case "email": {
      const name = random(FIRST_NAMES).toLowerCase() + randomNum(1, 999);
      return `${name}@${random(DOMAINS)}`;
    }
    case "text":
      return Array.from({ length: randomNum(5, 12) }, () => random(LOREM)).join(" ");
    case "address":
      return `${randomNum(100, 9999)} ${random(STREETS)}, ${random(CITIES)}`;
    case "postal":
      return randomDigits(5);
    case "region":
      return random(REGIONS);
    case "country":
      return random(COUNTRIES);
    case "alphanumeric":
      return Array.from({ length: 10 }, () => 
        random("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""))
      ).join("");
    case "subscriber_id":
      return randomLetters(3) + randomDigits(7);
    case "number": {
      const [min, max] = field.option === "1-1000" ? [1, 1000] : [1, 100];
      return String(randomNum(min, max));
    }
    case "currency": {
      const amount = (randomNum(100, 99999) / 100).toFixed(2);
      const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
      return `${symbols[field.option] || "$"}${amount}`;
    }
    case "date": {
      const d = new Date(Date.now() - randomNum(0, 365 * 5) * 24 * 60 * 60 * 1000);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      if (field.option === "MM/DD/YYYY") return `${month}/${day}/${year}`;
      if (field.option === "DD/MM/YYYY") return `${day}/${month}/${year}`;
      return `${year}-${month}-${day}`;
    }
    case "constant":
      return ""; // This type is now effectively handled by the custom value input
    case "creditcard":
      return `4${randomDigits(3)}-${randomDigits(4)}-${randomDigits(4)}-${randomDigits(4)}`;
    case "password": {
      const len = field.option === "16 chars" ? 16 : field.option === "12 chars" ? 12 : 8;
      return Array.from({ length: len }, () => 
        random("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%".split(""))
      ).join("");
    }
    default:
      return "";
  }
};

export const generateData = (fields: DataField[], rows: number, format: string): string => {
  const activeFields = fields.filter(f => f.checked);
  const data = Array.from({ length: rows }, () => {
    const row: Record<string, string> = {};
    activeFields.forEach(field => {
      row[field.propertyName || field.type] = field.value ? field.value : generateValue(field);
    });
    return row;
  });

  switch (format) {
    case "json":
      return JSON.stringify(data, null, 2);
    
    case "csv": {
      const headers = activeFields.map(f => f.propertyName || f.type);
      const csvRows = data.map(row => headers.map(h => `"${row[h]}"`).join(","));
      return [headers.join(","), ...csvRows].join("\n");
    }
    
    case "xml": {
      const rows = data.map(row => {
        const fields = Object.entries(row).map(([k, v]) => `    <${k}>${v}</${k}>`).join("\n");
        return `  <row>\n${fields}\n  </row>`;
      }).join("\n");
      return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${rows}\n</data>`;
    }
    
    case "sql": {
      const headers = activeFields.map(f => f.propertyName || f.type);
      return data.map(row => {
        const values = headers.map(h => `'${row[h].replace(/'/g, "''")}'`).join(", ");
        return `INSERT INTO table_name (${headers.join(", ")}) VALUES (${values});`;
      }).join("\n");
    }
    
    case "python": {
      return `data = ${JSON.stringify(data, null, 2)}`;
    }
    
    case "javascript": {
      return `const data = ${JSON.stringify(data, null, 2)};`;
    }
    
    case "php": {
      const phpArray = data.map(row => {
        const pairs = Object.entries(row).map(([k, v]) => `        "${k}" => "${v}"`).join(",\n");
        return `    [\n${pairs}\n    ]`;
      }).join(",\n");
      return `<?php\n$data = [\n${phpArray}\n];\n?>`;
    }
    
    case "pipe": {
      const headers = activeFields.map(f => f.propertyName || f.type);
      const pipeRows = data.map(row => headers.map(h => row[h]).join("|"));
      return [headers.join("|"), ...pipeRows].join("\n");
    }
    
    default:
      return JSON.stringify(data, null, 2);
  }
};
