import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const schemeSchema = z.object({
    rate: z.coerce.number().positive("Rate must be positive"),
    label: z.string().min(1, "Label required"),
});

type SchemeForm = z.infer<typeof schemeSchema>;

export default function InterestSchemeManagement() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [editScheme, setEditScheme] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: schemes = [], isLoading } = useQuery<any[]>({
        queryKey: ["interest-schemes"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/interest-schemes");
            return res.json();
        },
    });

    const addMutation = useMutation({
        mutationFn: async (data: SchemeForm) => {
            const res = await apiRequest("POST", "/api/interest-schemes", data);
            if (!res.ok) throw new Error("Failed to add scheme");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["interest-schemes"]);
            setIsDialogOpen(false);
            toast({ title: "Scheme added" });
        },
        onError: () => toast({ title: "Failed to add scheme", variant: "destructive" }),
    });

    const editMutation = useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            const res = await apiRequest("PUT", `/api/interest-schemes/${id}`, data);
            if (!res.ok) throw new Error("Failed to update scheme");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["interest-schemes"]);
            setEditScheme(null);
            toast({ title: "Scheme updated" });
        },
        onError: () => toast({ title: "Failed to update scheme", variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/interest-schemes/${id}`);
            if (!res.ok) throw new Error("Failed to delete scheme");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["interest-schemes"]);
            toast({ title: "Scheme deleted" });
        },
        onError: () => toast({ title: "Failed to delete scheme", variant: "destructive" }),
    });

    // Add form
    const addForm = useForm<SchemeForm>({
        resolver: zodResolver(schemeSchema),
        defaultValues: { rate: undefined, label: "" },
    });

    // Edit form
    const editForm = useForm<SchemeForm>({
        resolver: zodResolver(schemeSchema),
        defaultValues: { rate: undefined, label: "" },
        values: editScheme ? { rate: editScheme.rate, label: editScheme.label } : undefined,
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Interest Schemes</h3>
                <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Scheme
                </Button>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
                </div>
            ) : (
                <table className="w-full border text-sm">
                    <thead>
                        <tr className="bg-gold-50">
                            <th className="p-2 text-left">Label</th>
                            <th className="p-2 text-left">Rate (%)</th>
                            <th className="p-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schemes.map((scheme) => (
                            <tr key={scheme.id} className="border-b">
                                <td className="p-2">{scheme.label}</td>
                                <td className="p-2">{scheme.rate}</td>
                                <td className="p-2 flex gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => setEditScheme(scheme)}><Edit className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(scheme.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Interest Scheme</DialogTitle>
                    </DialogHeader>
                    <Form {...addForm}>
                        <form onSubmit={addForm.handleSubmit((values) => addMutation.mutate(values))} className="space-y-4">
                            <FormField
                                control={addForm.control}
                                name="label"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Label</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={addForm.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rate (%)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" loading={addMutation.isPending}>Add</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editScheme} onOpenChange={() => setEditScheme(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Interest Scheme</DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit((values) => editMutation.mutate({ id: editScheme.id, ...values }))} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="label"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Label</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rate (%)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditScheme(null)}>Cancel</Button>
                                <Button type="submit" loading={editMutation.isPending}>Save</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
} 