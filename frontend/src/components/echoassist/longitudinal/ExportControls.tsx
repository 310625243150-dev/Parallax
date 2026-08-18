import { Download, Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Patient, Examination } from "@/lib/echoassist/types";
import { generateHistoryCsv, downloadFile } from "@/lib/echoassist/longitudinal";

export interface ExportControlsProps {
  patient: Patient;
  examinations: Examination[];
}

export function ExportControls({ patient, examinations }: ExportControlsProps) {
  function handleExportCsv() {
    const csvContent = generateHistoryCsv(patient, examinations);
    const filename = `echoassist_longitudinal_${patient.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(filename, csvContent, "text/csv");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCsv}
        disabled={examinations.length === 0}
        className="text-xs"
      >
        <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
        Export CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={examinations.length === 0}
        className="text-xs"
        title="Open browser print dialog to print or save as PDF"
      >
        <Printer className="h-4 w-4 mr-1.5 text-secondary" />
        Print / Save PDF
      </Button>
    </div>
  );
}
