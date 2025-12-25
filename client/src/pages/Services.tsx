import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Service, InsertService } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { canCreateServices, canAccessServices } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Search, 
  Flame, 
  Droplets, 
  Wrench,
  DollarSign,
  Layers,
  SparklesIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

// ============================================
// CATEGORY CONFIGURATION
// ============================================

const CATEGORIES = {
  powder: {
    label: 'Powder Coating',
    icon: Flame,
    color: 'orange',
    bgLight: 'bg-orange-500/5',
    bgMedium: 'bg-orange-500/10',
    border: 'border-l-orange-500',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
  },
  ceramic: {
    label: 'Ceramic Coating',
    icon: Droplets,
    color: 'blue',
    bgLight: 'bg-blue-500/5',
    bgMedium: 'bg-blue-500/10',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  prep: {
    label: 'Prep Services',
    icon: Wrench,
    color: 'green',
    bgLight: 'bg-green-500/5',
    bgMedium: 'bg-green-500/10',
    border: 'border-l-green-500',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800 border-green-200',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

// ============================================
// MAIN COMPONENT
// ============================================

export default function Services() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Redirect employees away from this page
  useEffect(() => {
    if (user && !canAccessServices(user)) {
      setLocation("/estimates");
    }
  }, [user, setLocation]);

  const { data: services = [], isLoading } = useQuery<Service[]>({
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

  // ============================================
  // MUTATIONS
  // ============================================

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
    mutationFn: (id: string) => apiRequest("DELETE", `/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Success", description: "Service deleted successfully" });
      setDeletingService(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
    },
  });

  // ============================================
  // COMPUTED DATA
  // ============================================

  const stats = useMemo(() => {
    const byCategory = (cat: string) => services.filter(s => s.category === cat);
    const avgPrice = (items: Service[]) => 
      items.length > 0 
        ? items.reduce((sum, s) => sum + parseFloat(s.price), 0) / items.length 
        : 0;
    const priceRange = (items: Service[]) => {
      if (items.length === 0) return { min: 0, max: 0 };
      const prices = items.map(s => parseFloat(s.price));
      return { min: Math.min(...prices), max: Math.max(...prices) };
    };

    const powder = byCategory('powder');
    const ceramic = byCategory('ceramic');
    const prep = byCategory('prep');

    return {
      total: services.length,
      powder: { count: powder.length, avg: avgPrice(powder), range: priceRange(powder) },
      ceramic: { count: ceramic.length, avg: avgPrice(ceramic), range: priceRange(ceramic) },
      prep: { count: prep.length, avg: avgPrice(prep), range: priceRange(prep) },
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    const filtered = services.filter(service =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      powder: filtered.filter(s => s.category === 'powder').sort((a, b) => a.name.localeCompare(b.name)),
      ceramic: filtered.filter(s => s.category === 'ceramic').sort((a, b) => a.name.localeCompare(b.name)),
      prep: filtered.filter(s => s.category === 'prep').sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [services, searchQuery]);

  // ============================================
  // HANDLERS
  // ============================================

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
      category: service.category as CategoryKey,
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

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderCategorySection = (categoryKey: CategoryKey, categoryServices: Service[]) => {
    if (categoryServices.length === 0) return null;
    
    const cat = CATEGORIES[categoryKey];
    const Icon = cat.icon;
    const catStats = stats[categoryKey];

    return (
      <Card className={`overflow-hidden border-l-4 ${cat.border}`}>
        <CardHeader className={`${cat.bgLight} py-3 px-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${cat.iconBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${cat.iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">{cat.label}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {catStats.count} {catStats.count === 1 ? 'service' : 'services'} · 
                  Avg ${catStats.avg.toFixed(0)}
                </p>
              </div>
            </div>
            {catStats.range.max > 0 && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Price Range</p>
                <p className={`text-sm font-medium ${cat.text}`}>
                  ${catStats.range.min.toFixed(0)} - ${catStats.range.max.toFixed(0)}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {categoryServices.map((service) => (
              <div
                key={service.id}
                className={`p-3 flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors ${
                  canCreateServices(user) ? 'cursor-pointer' : ''
                }`}
                onClick={canCreateServices(user) ? () => handleEdit(service) : undefined}
                role={canCreateServices(user) ? "button" : undefined}
                tabIndex={canCreateServices(user) ? 0 : undefined}
                onKeyDown={canCreateServices(user) ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleEdit(service);
                  }
                } : undefined}
              >
                <span className="font-medium text-sm">{service.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">
                    ${parseFloat(service.price).toFixed(2)}
                  </span>
                  {canCreateServices(user) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingService(service);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading services...</div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="space-y-6 pb-8">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Services</h1>
              <p className="text-slate-400 mt-1">Manage your coating and prep service pricing</p>
            </div>
            {canCreateServices(user) && (
              <Button 
                onClick={handleNew}
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* STATS CARDS */}
      {/* ============================================ */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.powder.count}</p>
                <p className="text-xs text-muted-foreground">Powder</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ceramic.count}</p>
                <p className="text-xs text-muted-foreground">Ceramic</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.prep.count}</p>
                <p className="text-xs text-muted-foreground">Prep</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* SEARCH */}
      {/* ============================================ */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ============================================ */}
      {/* SERVICES LIST */}
      {/* ============================================ */}
      {services.length === 0 ? (
        <Card className="p-12 text-center">
          <SparklesIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No services yet</h3>
          <p className="text-muted-foreground mb-4">Add your first service to start building your price list</p>
          {canCreateServices(user) && (
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Service
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {renderCategorySection('powder', filteredServices.powder)}
          {renderCategorySection('ceramic', filteredServices.ceramic)}
          {renderCategorySection('prep', filteredServices.prep)}

          {/* No search results */}
          {filteredServices.powder.length === 0 && 
           filteredServices.ceramic.length === 0 && 
           filteredServices.prep.length === 0 && 
           searchQuery && (
            <Card className="p-8 text-center">
              <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No services match "{searchQuery}"</p>
            </Card>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* ADD/EDIT DIALOG */}
      {/* ============================================ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
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
                      <Input {...field} placeholder="e.g., Powder Coat Wheels" />
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="powder">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            Powder Coating
                          </div>
                        </SelectItem>
                        <SelectItem value="ceramic">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            Ceramic Coating
                          </div>
                        </SelectItem>
                        <SelectItem value="prep">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-green-500" />
                            Prep Services
                          </div>
                        </SelectItem>
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
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    editingService ? "Update" : "Create"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DELETE CONFIRMATION */}
      {/* ============================================ */}
      <AlertDialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{deletingService?.name}</span>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingService && deleteMutation.mutate(deletingService.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
