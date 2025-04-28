
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
import { InsertInterestScheme, InterestScheme } from "@shared/schema";

export default function InterestSchemeManagement() {
  const { toast } = useToast();
  const [editingScheme, setEditingScheme] = useState<InterestScheme | null>(null);
  const [newRate, setNewRate] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const { data: schemes = [], isLoading, refetch } = useQuery<InterestScheme[]>({
    queryKey: ["/api/interest-schemes"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertInterestScheme) => {
      const res = await apiRequest("POST", "/api/interest-schemes", data);
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setNewRate("");
      setNewLabel("");
      toast({ title: "Success", description: "Interest scheme added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertInterestScheme }) => {
      const res = await apiRequest("PUT", `/api/interest-schemes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setEditingScheme(null);
      toast({ title: "Success", description: "Interest scheme updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/interest-schemes/${id}`);
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Success", description: "Interest scheme deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    try {
      const rate = parseFloat(newRate);
      if (isNaN(rate) || rate <= 0) {
        toast({ title: "Error", description: "Rate must be a positive number", variant: "destructive" });
        return;
      }
      if (!newLabel || !newLabel.trim()) {
        toast({ title: "Error", description: "Label is required", variant: "destructive" });
        return;
      }
      addMutation.mutate({ 
        rate: rate,
        label: newLabel.trim()
      });
      setNewRate("");
      setNewLabel("");
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to add scheme. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleUpdate = (id: number) => {
    if (!editingScheme) return;
    const rate = parseFloat(editingScheme.rate.toString());
    if (isNaN(rate)) {
      toast({ title: "Error", description: "Invalid rate", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id, data: { rate, label: editingScheme.label } });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div className="grid gap-2">
          <label>Rate (%)</label>
          <Input
            type="number"
            step="0.1"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            placeholder="0.5"
          />
        </div>
        <div className="grid gap-2">
          <label>Label</label>
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="0.5% Interest"
          />
        </div>
        <Button onClick={handleAdd} disabled={addMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Add Scheme
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rate (%)</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schemes.map((scheme) => (
              <TableRow key={scheme.id}>
                <TableCell>
                  {editingScheme?.id === scheme.id ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editingScheme.rate}
                      onChange={(e) =>
                        setEditingScheme({ ...editingScheme, rate: parseFloat(e.target.value) })
                      }
                    />
                  ) : (
                    scheme.rate
                  )}
                </TableCell>
                <TableCell>
                  {editingScheme?.id === scheme.id ? (
                    <Input
                      value={editingScheme.label}
                      onChange={(e) =>
                        setEditingScheme({ ...editingScheme, label: e.target.value })
                      }
                    />
                  ) : (
                    scheme.label
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {editingScheme?.id === scheme.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(scheme.id)}
                          disabled={updateMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingScheme(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setEditingScheme(scheme)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(scheme.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
