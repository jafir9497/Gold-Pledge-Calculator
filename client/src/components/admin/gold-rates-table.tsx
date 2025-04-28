import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GoldRate } from "@shared/schema";
import { formatCurrency, getFormattedDate, getGoldPurityLabel } from "@/lib/utils";

interface GoldRatesTableProps {
  goldRates: GoldRate[];
}

export default function GoldRatesTable({ goldRates }: GoldRatesTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px]">Gold Type</TableHead>
            <TableHead>Rate (per gram)</TableHead>
            <TableHead className="hidden md:table-cell">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {goldRates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                No gold rates found. Please add some rates.
              </TableCell>
            </TableRow>
          ) : (
            goldRates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className="font-medium">
                  {getGoldPurityLabel(rate.purity)}
                </TableCell>
                <TableCell className="text-gold-700 font-semibold">
                  {formatCurrency(rate.ratePerGram)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {getFormattedDate(new Date(rate.updatedAt))}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
