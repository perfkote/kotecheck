import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobSchemaWithValidation } from "@shared/schema";
import type { Service } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/formatters";

type FormData = z.infer<typeof createJobSchemaWithValidation>;

interface JobFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<FormData>;
  customers?: Array<{ id: string; name: string; phone?: string | null }>;
}

export function JobForm({ onSubmit, onCancel, defaultValues, customers = [] }: JobFormProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(createJobSchemaWithValidation),
    defaultValues: defaultValues || {
      customerId: "",
      customerName: "",
      phoneNumber: "",
      receivedDate: new Date(),
      serviceIds: [],
      coatingType: undefined,
      items: "",
      detailedNotes: "",
      price: undefined,
      status: "received",
    },
  });

  // Initialize selected services from default values
  useEffect(() => {
    if (defaultValues?.serviceIds) {
      setSelectedServices(defaultValues.serviceIds);
    }
  }, [defaultValues?.serviceIds]);

  // Update form serviceIds when selectedServices changes
  useEffect(() => {
    form.setValue("serviceIds", selectedServices);
  }, [selectedServices, form]);

  // Calculate service total
  const serviceTotal = selectedServices.reduce((sum, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return sum + (service ? parseFloat(service.price) : 0);
  }, 0);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Check if search matches any existing customer exactly
  const exactMatch = customers.find(
    (c) => c.name.toLowerCase() === searchValue.trim().toLowerCase()
  );

  // Show create option if there's search text and no exact match
  const showCreateOption = searchValue.trim().length > 0 && !exactMatch;

  // Get selected customer name for display
  const selectedCustomer = customers.find(
    (c) => c.id === form.watch("customerId")
  );
  const displayValue = selectedCustomer?.name || form.watch("customerName") || "";

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(
        onSubmit,
        (errors) => {
          console.error("Form validation errors:", errors);
        }
      )} className="space-y-5 sm:space-y-6">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Customer</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="justify-between"
                      data-testid="button-select-customer"
                    >
                      {displayValue || "Select or create a customer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or type new customer name..."
                      value={searchValue}
                      onValueChange={setSearchValue}
                      data-testid="input-search-customer"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchValue.trim().length > 0
                          ? "No customers found. Press Enter to create a new one."
                          : "Start typing to create a new customer..."}
                      </CommandEmpty>
                      {filteredCustomers.length > 0 && (
                        <CommandGroup heading="Existing Customers">
                          {filteredCustomers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => {
                                form.setValue("customerId", customer.id);
                                form.setValue("customerName", "");
                                if (customer.phone) {
                                  form.setValue("phoneNumber", customer.phone);
                                }
                                setOpen(false);
                                setSearchValue("");
                              }}
                              data-testid={`option-customer-${customer.id}`}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {customer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {showCreateOption && (
                        <CommandGroup heading="Create New">
                          <CommandItem
                            value={`create-${searchValue}`}
                            onSelect={() => {
                              form.setValue("customerId", "");
                              form.setValue("customerName", searchValue.trim());
                              form.setValue("phoneNumber", "");
                              setOpen(false);
                              setSearchValue("");
                            }}
                            data-testid="option-create-customer"
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            Create &quot;{searchValue.trim()}&quot;
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="555-123-4567" 
                  {...field}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    field.onChange(formatted);
                  }}
                  data-testid="input-phone-number" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receivedDate"
          render={({ field }) => {
            const dateValue = field.value instanceof Date && !isNaN(field.value.getTime())
              ? field.value.toISOString().split('T')[0]
              : '';
            return (
              <FormItem>
                <FormLabel>Received Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={dateValue}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      field.onChange(newDate);
                    }}
                    data-testid="input-received-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
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
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-3 px-3 sm:px-4 rounded-md border bg-card hover-elevate"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
                            <span className="font-medium text-sm sm:text-base">{service.name}</span>
                            <span className="text-sm text-muted-foreground">
                              ${parseFloat(service.price).toFixed(2)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeService(serviceId)}
                            data-testid={`button-remove-service-${serviceId}`}
                            className="h-9 w-9 flex-shrink-0 self-end sm:self-center"
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
                    <SelectTrigger data-testid="select-add-service">
                      <SelectValue placeholder="Add service..." />
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
          name="items"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Items</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="List parts dropped off for service (e.g., bumper, wheels, frame)..." 
                  {...field}
                  value={field.value || ""}
                  data-testid="input-items"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="detailedNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any special instructions or details about the coating job..." 
                  {...field}
                  value={field.value || ""}
                  data-testid="input-detailed-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => {
              // Auto-populate with service total if no custom price is set
              const displayValue = field.value ?? (selectedServices.length > 0 ? serviceTotal : undefined);
              
              return (
                <FormItem>
                  <FormLabel>Price {selectedServices.length > 0 && '(Editable)'}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={displayValue ?? ""}
                      data-testid="input-price"
                    />
                  </FormControl>
                  {selectedServices.length > 0 && !field.value && (
                    <p className="text-xs text-muted-foreground">Auto-calculated from services: ${serviceTotal.toFixed(2)}</p>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="prepped">Prepped</SelectItem>
                    <SelectItem value="coated">Coated</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" data-testid="button-submit">
            Save Job
          </Button>
        </div>
      </form>
    </Form>
  );
}
