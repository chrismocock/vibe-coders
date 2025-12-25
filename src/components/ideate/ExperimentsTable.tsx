import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Experiment } from "@/app/project/[id]/ideate/page";
import { Send } from "lucide-react";

const statusColor: Record<Experiment["status"], string> = {
  draft: "bg-amber-100 text-amber-700",
  validating: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
};

export function ExperimentsTable({
  items,
  onSend,
}: {
  items: Experiment[];
  onSend: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Goal</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Start</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((exp) => (
          <TableRow key={exp.id}>
            <TableCell className="font-medium">{exp.name}</TableCell>
            <TableCell>{exp.goal}</TableCell>
            <TableCell>{exp.owner}</TableCell>
            <TableCell>{exp.startDate}</TableCell>
            <TableCell className="text-right">
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Badge className={`px-3 py-1 capitalize ${statusColor[exp.status]}`}>
                  {exp.status}
                </Badge>
                {exp.status === "draft" && (
                  <Button size="sm" onClick={() => onSend(exp.id)}>
                    <Send className="mr-2 h-4 w-4" /> Send to Validate
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
