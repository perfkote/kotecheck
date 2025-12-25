import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobSchemaWithValidation } from "@shared/schema";
import type { Service, InventoryItem } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  Check, 
  ChevronsUpDown, 
  X, 
  User,
  Phone,
  Calendar,
  Flame,
  Droplets,
  Wrench,
  DollarSign,
  FileText,
  Package,
  Loader2,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/formatters";

// ============================================
// TYPES
// ============================================

type FormData = z.infer<typeof createJobSchemaWithValidation>;

interface JobFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
  defaultValues?: Partial<FormData>;
  customers?: Array<{ id: string; name: string; phone?: string | null }>;
  isSubmitting?: boolean;
}

// ============================================
// STATUS CONFIG
// ============================================

const STATUS_CONFIG = {
  received: { label: 'Received', color: 'text-amber-600', bg: 'bg-amber-100' },
  prepped: { label: 'Prepped', color: 'text-blue-600', bg: 'bg-blue-100' },
  coated: { label: 'Coated', color: 'text-purple-600', bg: 'bg-purple-100' },
  finished: { label: 'Finished', color: 'text-green-600', bg: 'bg-green-100' },
  paid: { label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-100' },
} as const;

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

export function JobForm({ 
  onSubmit, 
  onCancel, 
  onDelete,
  defaultValues, 
  customers = [],
  isSubmitting = false,
}: JobFormProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<Array<{ inventoryId: string; quantity: number }>>([]);
  const [manuallyEditedPrice, setManuallyEditedPrice] = useState(false);

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
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

  const isEditing = !!defaultValues;

  // Initialize selected services from default values
  useEffect(() => {
    if (defaultValues?.serviceIds) {
      setSelectedServices(defaultValues.serviceIds);
    }
  }, [defaultValues?.serviceIds]);

  // Initialize selected inventory from default values
  useEffect(() => {
    if (defaultValues?.inventoryItems) {
      setSelectedInventory(defaultValues.inventoryItems);
    }
  }, [defaultValues?.inventoryItems]);

  // Check if price was manually set in defaultValues
  useEffect(() => {
    if (defaultValues?.price !== undefined) {
      setManuallyEditedPrice(true);
    }
  }, [defaultValues?.price]);

  // Update form serviceIds when selectedServices changes
  useEffect(() => {
    form.setValue("serviceIds", selectedServices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServices]);

  // Update form inventoryItems when selectedInventory changes
  useEffect(() => {
    form.setValue("inventoryItems", selectedInventory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInventory]);

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

  // Update price when services change (unless manually edited)
  useEffect(() => {
    if (selectedServices.length > 0 && !manuallyEditedPrice) {
      form.setValue("price", serviceTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceTotal, selectedServices.length, manuallyEditedPrice]);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const exactMatch = customers.find(
    (c) => c.name.toLowerCase() === searchValue.trim().toLowerCase()
  );

  const showCreateOption = searchValue.trim().length > 0 && !exactMatch;

  const selectedCustomer = customers.find(
    (c) => c.id === form.watch("customerId")
  );
  const displayValue = selectedCustomer?.name || form.watch("customerName") || "";

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const addInventory = (inventoryId: string) => {
    if (!selectedInventory.find(i => i.inventoryId === inventoryId)) {
      setSelectedInventory([...selectedInventory, { inventoryId, quantity: 1 }]);
    }
  };

  const removeInventory = (inventoryId: string) => {
    setSelectedInventory(selectedInventory.filter(i => i.inventoryId !== inventoryId));
  };

  const updateInventoryQuantity = (inventoryId: string, quantity: number) => {
    setSelectedInventory(selectedInventory.map(i =>
      i.inventoryId === inventoryId ? { ...i, quantity } : i
    ));
  };

  const availableInventory = inventoryItems.filter(i => !selectedInventory.find(si => si.inventoryId === i.id));

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
                {selectedCount}
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
      <form onSubmit={form.handleSubmit(
        onSubmit,
        (errors) => console.error("Form validation errors:", errors)
      )} className="space-y-6">
        
        {/* ============================================ */}
        {/* CUSTOMER SECTION */}
        {/* ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer Information
          </h3>
          
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Customer *</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="justify-between h-10"
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {displayValue || "Select or create customer..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search or type new name..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchValue.trim().length > 0
                            ? "No customers found."
                            : "Start typing to search..."}
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
                                  const formattedPhone = customer.phone ? formatPhoneNumber(customer.phone) : "";
                                  form.setValue("phoneNumber", formattedPhone);
                                  setOpen(false);
                                  setSearchValue("");
                                }}
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
                            >
                              <Check className="mr-2 h-4 w-4 opacity-0" />
                              Create "{searchValue.trim()}"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phoneNumber"
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
                        autoComplete="off"
                      />
                    </div>
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
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="date"
                          className="pl-10"
                          value={dateValue}
                          onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            field.onChange(newDate);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
        {/* INVENTORY SECTION */}
        {/* ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory (Optional)
          </h3>

          <FormField
            control={form.control}
            name="inventoryItems"
            render={() => (
              <FormItem>
                <div className="space-y-3">
                  {selectedInventory.length > 0 && (
                    <div className="space-y-2">
                      {selectedInventory.map((item) => {
                        const inventoryItem = inventoryItems.find(i => i.id === item.inventoryId);
                        if (!inventoryItem) return null;
                        return (
                          <div 
                            key={item.inventoryId} 
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm">{inventoryItem.name}</span>
                              {inventoryItem.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {inventoryItem.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateInventoryQuantity(item.inventoryId, parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-center"
                              />
                              <span className="text-xs text-muted-foreground w-12">
                                {inventoryItem.unit}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeInventory(item.inventoryId)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {availableInventory.length > 0 && (
                    <Select onValueChange={addInventory} value="">
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Add inventory item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableInventory.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.category.replace(/_/g, ' ')})
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
        </div>

        {/* ============================================ */}
        {/* ITEMS & NOTES SECTION */}
        {/* ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Job Details
          </h3>

          <FormField
            control={form.control}
            name="items"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Items Dropped Off</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="List parts (e.g., bumper, wheels, frame)..." 
                    className="min-h-[80px] resize-none"
                    {...field}
                    value={field.value || ""}
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
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Special instructions, color preferences, details..." 
                    className="min-h-[80px] resize-none"
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
        {/* PRICING & STATUS SECTION */}
        {/* ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pricing & Status
          </h3>

          {/* Running Total Card */}
          {selectedServices.length > 0 && (
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                        ${serviceTotal.toFixed(2)}
                      </span>
                      {manuallyEditedPrice && (
                        <Badge variant="outline" className="text-xs">
                          Modified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => {
                const displayValue = field.value ?? (selectedServices.length > 0 ? serviceTotal : undefined);
                
                return (
                  <FormItem>
                    <FormLabel>Price {selectedServices.length > 0 && "(adjustable)"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-10 text-lg font-semibold"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined);
                            setManuallyEditedPrice(true);
                          }}
                          value={displayValue ?? ""}
                        />
                      </div>
                    </FormControl>
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
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${config.bg}`} />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* ACTIONS */}
        {/* ============================================ */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:w-auto"
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          
          <div className="flex-1" />
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-orange-500 hover:bg-orange-600"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                {isEditing ? 'Update Job' : 'Create Job'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
