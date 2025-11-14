import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Service, InsertService } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { canCreateServices, canAccessServices } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Pencil, Settings as SettingsIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MoneyInput } from "@/components/MoneyInput";

export default function Services() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();

  // Redirect employees away from this page
  useEffect(() => {
    if (user && !canAccessServices(user)) {
      setLocation("/estimates");
    }
  }, [user, setLocation]);

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<InsertService>({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      name: "",
      category: "powder",
      price: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertService) =>
      apiRequest("POST", "/api/services", {
        ...data,
        price: data.price.toString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Success", description: "Service created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to create service";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertService> }) =>
      apiRequest("PATCH", `/api/services/${id}`, {
        ...data,
        price: data.price ? data.price.toString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Success", description: "Service updated successfully" });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to update service";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Success", description: "Service deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    },
  });

  const handleSubmit = (data: InsertService) => {
    if (!canCreateServices(user)) {
      toast({ 
        title: "Unauthorized", 
        description: "You don't have permission to modify services", 
        variant: "destructive" 
      });
      return;
    }
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: Service) => {
    if (!canCreateServices(user)) {
      toast({ 
        title: "Unauthorized", 
        description: "You don't have permission to modify services", 
        variant: "destructive" 
      });
      return;
    }
    setEditingService(service);
    form.reset({
      name: service.name,
      category: service.category as "powder" | "ceramic" | "prep",
      price: parseFloat(service.price),
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    if (!canCreateServices(user)) {
      toast({ 
        title: "Unauthorized", 
        description: "You don't have permission to modify services", 
        variant: "destructive" 
      });
      return;
    }
    setEditingService(null);
    form.reset({ name: "", category: "powder", price: 0 });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!canCreateServices(user)) {
      toast({ 
        title: "Unauthorized", 
        description: "You don't have permission to modify services", 
        variant: "destructive" 
      });
      return;
    }
    deleteMutation.mutate(id);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "powder": return "bg-blue-100 text-blue-800";
      case "ceramic": return "bg-purple-100 text-purple-800";
      case "prep": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Service Management</h1>
          <p className="text-muted-foreground mt-1">Manage pricing for powder coating, ceramic coating, and prep services</p>
        </div>
        {canCreateServices(user) && (
          <Button onClick={handleNew} data-testid="button-new-service">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {services.length === 0 ? (
          <Card className="p-12 text-center">
            <SettingsIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No services yet</p>
            <p className="text-sm text-muted-foreground">Add your first service to get started</p>
          </Card>
        ) : (
          services.map((service) => (
            <Card 
              key={service.id}
              className={canCreateServices(user) ? "p-4 hover-elevate cursor-pointer" : "p-4"}
              data-testid={`card-service-${service.id}`}
              onClick={canCreateServices(user) ? () => handleEdit(service) : undefined}
              onKeyDown={canCreateServices(user) ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEdit(service);
                }
              } : undefined}
              role={canCreateServices(user) ? "button" : undefined}
              tabIndex={canCreateServices(user) ? 0 : undefined}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-base">{service.name}</div>
                  <Badge className={`${getCategoryColor(service.category)} mt-2`}>
                    {service.category}
                  </Badge>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="font-bold text-xl">${parseFloat(service.price).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Price</div>
                </div>
              </div>
              {canCreateServices(user) && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(service);
                    }}
                    data-testid={`button-edit-mobile-${service.id}`}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(service.id);
                    }}
                    data-testid={`button-delete-mobile-${service.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Service Name</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-right p-4 font-medium">Price</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No services yet. Add your first service to get started.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="border-t hover-elevate" data-testid={`row-service-${service.id}`}>
                    <td className="p-4">{service.name}</td>
                    <td className="p-4">
                      <Badge className={getCategoryColor(service.category)}>
                        {service.category}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-medium">${parseFloat(service.price).toFixed(2)}</td>
                    <td className="p-4 text-right">
                      {canCreateServices(user) && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(service)}
                            data-testid={`button-edit-${service.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(service.id)}
                            data-testid={`button-delete-${service.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-md lg:max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Basic Powder Coat" {...field} data-testid="input-service-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="powder">Powder</SelectItem>
                        <SelectItem value="ceramic">Ceramic</SelectItem>
                        <SelectItem value="prep">Prep</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onChange={field.onChange}
                        data-testid="input-service-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit">
                  {editingService ? "Update Service" : "Create Service"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
