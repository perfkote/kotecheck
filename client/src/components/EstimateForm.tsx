import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { insertEstimateSchema, type Service } from "@shared/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPhoneNumber } from "@/lib/formatters";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Flame,
  Droplets,
  Wrench,
  DollarSign,
  FileText,
  Check,
  Loader2,
} from "lucide-react";

// ============================================
// SCHEMA & TYPES
// ============================================

const formSchema = insertEstimateSchema.extend({
  serviceIds: z.array(z.string()).min(1, "At least one service is required"),
  total: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  desiredFinishDate: z.date().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

type EstimateFormSubmission = Omit<FormData, 'serviceType'> & {
  serviceType: "powder" | "ceramic" | "misc";
  serviceIds: string[];
};

interface EstimateFormProps {
  onSubmit: (data: EstimateFormSubmission) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// ============================================
// CATEGORY CONFIG
// ============================================

const CATEGORIES = {
  powder: {
    label: 'Powder Coating',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-200',
  },
  ceramic: {
    label: 'Ceramic Coating',
    icon: Droplets,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-200',
  },
  prep: {
    label: 'Prep Services',
    icon: Wrench,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-200',
  },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

// ============================================
// MAIN COMPONENT
// ============================================

export function EstimateForm({ onSubmit, onCancel, isSubmitting = false }: EstimateFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [manuallyEditedTotal, setManuallyEditedTotal] = useState(false);

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      email: "",
      serviceType: "powder",
      serviceIds: [],
      date: new Date(),
      desiredFinishDate: null,
      notes: "",
      status: "pending",
      total: undefined,
    },
  });

  // Group services by category
  const servicesByCategory = useMemo(() => {
    return {
      powder: services.filter(s => s.category === 'powder').sort((a, b) => a.name.localeCompare(b.name)),
      ceramic: services.filter(s => s.category === 'ceramic').sort((a, b) => a.name.localeCompare(b.name)),
      prep: services.filter(s => s.category === 'prep').sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [services]);

  // Calculate totals
  const { serviceTotal, selectedByCategory } = useMemo(() => {
    let total = 0;
    const byCategory: Record<string, number> = { powder: 0, ceramic: 0, prep: 0 };
    
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const price = parseFloat(service.price);
        total += price;
        byCategory[service.category] = (byCategory[service.category] || 0) + price;
      }
    });
    
    return { serviceTotal: total, selectedByCategory: byCategory };
  }, [selectedServices, services]);

  // Update form serviceIds when selectedServices changes
  useEffect(() => {
    form.setValue("serviceIds", selectedServices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServices]);

  // Reset manual edit flag when all services are removed
  useEffect(() => {
    if (selectedServices.length === 0) {
      setManuallyEditedTotal(false);
    }
  }, [selectedServices.length]);

  // Update total field when service total changes (unless manually edited)
  useEffect(() => {
    if (selectedServices.length > 0 && !manuallyEditedTotal) {
      form.setValue("total", String(serviceTotal));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceTotal, selectedServices.length, manuallyEditedTotal]);

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data as EstimateFormSubmission);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = isSubmitting || form.formState.isSubmitting;

  // ============================================
  // RENDER SERVICE CATEGORY
  // ============================================

  const renderServiceCategory = (categoryKey: CategoryKey) => {
    const categoryServices = servicesByCategory[categoryKey];
    if (categoryServices.length === 0) return null;

    const cat = CATEGORIES[categoryKey];
    const Icon = cat.icon;
    const categoryTotal = selectedByCategory[categoryKey] || 0;
    const selectedCount = categoryServices.filter(s => selectedServices.includes(s.id)).length;

    return (
      <div key={categoryKey} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${cat.color}`} />
            <span className="font-medium text-sm">{cat.label}</span>
            {selectedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedCount} selected
              </Badge>
            )}
          </div>
          {categoryTotal > 0 && (
            <span className={`text-sm font-medium ${cat.color}`}>
              ${categoryTotal.toFixed(2)}
            </span>
          )}
        </div>
        
        <div className="grid gap-2">
          {categoryServices.map((service) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <div
                key={service.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? `${cat.bg} ${cat.border} border-2` 
                    : 'bg-card hover:bg-accent/50 border-border'
                }`}
                onClick={() => toggleService(service.id)}
              >
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={() => toggleService(service.id)}
                  className="pointer-events-none"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{service.name}</span>
                </div>
                <span className={`font-semibold ${isSelected ? cat.color : 'text-muted-foreground'}`}>
                  ${parseFloat(service.price).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
        {/* ============================================ */}
        {/* CUSTOMER INFO SECTION */}
        {/* ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer Information
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Smith" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="555-123-4567" 
                        className="pl-10"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="email"
                        placeholder="john@example.com" 
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    For sending estimate digitally
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desiredFinishDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desired Finish Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="date"
                        className="pl-10"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          field.onChange(e.target.value ? new Date(e.target.value) : null);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    When does the customer need this done?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* SERVICES SECTION */}
        {/* ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Services
          </h3>

          <FormField
            control={form.control}
            name="serviceIds"
            render={() => (
              <FormItem>
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading services...
                  </div>
                ) : services.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">No services available.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add services in the Services page first.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {renderServiceCategory('powder')}
                    {renderServiceCategory('ceramic')}
                    {renderServiceCategory('prep')}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ============================================ */}
        {/* TOTAL & NOTES SECTION */}
        {/* ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pricing & Notes
          </h3>

          {/* Running Total Card */}
          {selectedServices.length > 0 && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                        ${serviceTotal.toFixed(2)}
                      </span>
                      {manuallyEditedTotal && (
                        <Badge variant="outline" className="text-xs">
                          Modified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <FormField
            control={form.control}
            name="total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Final Total {selectedServices.length > 0 && "(adjustable)"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-10 text-lg font-semibold"
                      {...field}
                      value={field.value ?? serviceTotal}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                        setManuallyEditedTotal(true);
                      }}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Adjust for discounts, add-ons, or custom pricing
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional details, special requests, item descriptions..."
                    className="min-h-[100px] resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ============================================ */}
        {/* ACTIONS */}
        {/* ============================================ */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={isPending || selectedServices.length === 0}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Create Estimate
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
