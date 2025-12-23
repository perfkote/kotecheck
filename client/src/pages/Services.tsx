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
import { Plus, Trash2, Pencil, Settings as SettingsIcon, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
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

  // Filter and categorize services
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split by category and sort alphabetically within each
  const powderServices = filteredServices
    .filter(s => s.category === 'powder')
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const ceramicServices = filteredServices
    .filter(s => s.category === 'ceramic')
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const prepServices = filteredServices
    .filter(s => s.category === 'prep')
    .sort((a, b) => a.name.localeCompare(b.name));

  const ServiceCard = ({ service }: { service: Service }) => (
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base sm:text-base">{service.name}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-bold text-lg sm:text-xl">${parseFloat(service.price).toFixed(2)}</div>
          {canCreateServices(user) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(service.id);
              }}
              data-testid={`button-delete-${service.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* MOBILE-OPTIMIZED HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Services</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage pricing for powder, ceramic, and prep services</p>
        </div>
        {canCreateServices(user) && (
          <Button 
            onClick={handleNew} 
            data-testid="button-new-service"
            className="w-full sm:w-auto h-12 sm:h-10 text-base"
          >
            <Plus className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          className="pl-10 h-12 sm:h-10 text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-services"
        />
      </div>

      {services.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center">
          <SettingsIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm sm:text-base text-muted-foreground">No services yet</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Add your first service to get started</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* POWDER COATING SECTION */}
          {powderServices.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg sm:text-xl font-semibold">Powder Coating</h2>
                <Badge className={getCategoryColor('powder')}>
                  {powderServices.length} {powderServices.length === 1 ? 'service' : 'services'}
                </Badge>
              </div>
              <div className="grid gap-3">
                {powderServices.map(service => <ServiceCard key={service.id} service={service} />)}
              </div>
            </div>
          )}

          {/* CERAMIC COATING SECTION */}
          {ceramicServices.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg sm:text-xl font-semibold">Ceramic Coating</h2>
                <Badge className={getCategoryColor('ceramic')}>
                  {ceramicServices.length} {ceramicServices.length === 1 ? 'service' : 'services'}
                </Badge>
              </div>
              <div className="grid gap-3">
                {ceramicServices.map(service => <ServiceCard key={service.id} service={service} />)}
              </div>
            </div>
          )}

          {/* PREP SERVICES SECTION */}
          {prepServices.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg sm:text-xl font-semibold">Prep Services</h2>
                <Badge className={getCategoryColor('prep')}>
                  {prepServices.length} {prepServices.length === 1 ? 'service' : 'services'}
                </Badge>
              </div>
              <div className="grid gap-3">
                {prepServices.map(service => <ServiceCard key={service.id} service={service} />)}
              </div>
            </div>
          )}

          {/* NO RESULTS */}
          {filteredServices.length === 0 && (
            <Card className="p-6 sm:p-12 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm sm:text-base text-muted-foreground">No services match your search</p>
            </Card>
          )}
        </div>
      )}

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-md h-[95vh] sm:h-auto max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              {editingService ? "Edit Service" : "Add Service"}
            </DialogTitle>
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
                      <Input {...field} placeholder="e.g., Powder Coat Wheels" className="h-12 sm:h-10 text-base" />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 sm:h-10 text-base">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="powder">Powder Coating</SelectItem>
                        <SelectItem value="ceramic">Ceramic Coating</SelectItem>
                        <SelectItem value="prep">Prep Services</SelectItem>
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
                        className="h-12 sm:h-10 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 h-12 sm:h-10 text-base"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 sm:h-10 text-base"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingService ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
