import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPhoneNumber, formatMoney } from "@/lib/formatters";
import { X } from "lucide-react";

const formSchema = insertEstimateSchema.extend({
  serviceIds: z.array(z.string()).min(1, "At least one service is required"),
  total: z.union([z.string(), z.number()]).pipe(z.coerce.number().min(0)).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EstimateFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

export function EstimateForm({ onSubmit, onCancel }: EstimateFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      serviceType: "powder",
      serviceIds: [],
      date: new Date(),
      notes: "",
      status: "draft",
      total: undefined,
    },
  });

  // Update form serviceIds when selectedServices changes
  useEffect(() => {
    form.setValue("serviceIds", selectedServices);
  }, [selectedServices, form]);

  // Calculate service total
  const serviceTotal = selectedServices.reduce((sum, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return sum + (service ? parseFloat(service.price) : 0);
  }, 0);

  // Update total field when service total changes (unless manually edited)
  useEffect(() => {
    if (selectedServices.length > 0 && !form.getValues("total")) {
      form.setValue("total", serviceTotal);
    }
  }, [serviceTotal, selectedServices.length, form]);

  const addService = (serviceId: string) => {
    if (!selectedServices.includes(serviceId)) {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(id => id !== serviceId));
  };

  // Get available services (not already selected)
  const availableServices = services.filter(s => !selectedServices.includes(s.id));

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter customer name" 
                  {...field}
                  data-testid="input-customer-name" 
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
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input 
                  placeholder="555-123-4567" 
                  {...field}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                  data-testid="input-phone" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceIds"
          render={() => (
            <FormItem>
              <FormLabel>Services</FormLabel>
              <div className="space-y-3">
                {selectedServices.length > 0 && (
                  <div className="space-y-1" data-testid="selected-services-list">
                    {selectedServices.map((serviceId) => {
                      const service = services.find(s => s.id === serviceId);
                      if (!service) return null;
                      return (
                        <div 
                          key={serviceId} 
                          className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover-elevate"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="font-medium truncate">{service.name}</span>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              ${parseFloat(service.price).toFixed(2)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeService(serviceId)}
                            data-testid={`button-remove-service-${serviceId}`}
                            className="h-8 w-8 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {availableServices.length > 0 && (
                  <Select onValueChange={addService} value="">
                    <SelectTrigger data-testid="select-add-service" disabled={servicesLoading}>
                      <SelectValue placeholder={servicesLoading ? "Loading..." : "Add service..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id} data-testid={`option-service-${service.id}`}>
                          {service.name} - ${parseFloat(service.price).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="total"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Total {selectedServices.length > 0 && "(Editable)"}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  value={field.value ?? serviceTotal}
                  onChange={(e) => {
                    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                  data-testid="input-total"
                />
              </FormControl>
              {selectedServices.length > 0 && (
                <FormDescription>
                  Auto-calculated from services: ${serviceTotal.toFixed(2)}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or details"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={form.formState.isSubmitting}
            data-testid="button-submit"
          >
            {form.formState.isSubmitting ? "Creating..." : "Create Estimate"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
