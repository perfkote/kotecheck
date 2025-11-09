import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEstimateSchema } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
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
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Service } from "@shared/schema";

type FormData = z.infer<typeof insertEstimateSchema>;

interface SelectedService {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
}

interface EstimateFormProps {
  onSubmit: (data: FormData, services: SelectedService[]) => void;
  onCancel: () => void;
  services: Service[];
}

export function EstimateForm({ onSubmit, onCancel, services }: EstimateFormProps) {
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [openPowder, setOpenPowder] = useState(false);
  const [openCeramic, setOpenCeramic] = useState(false);
  const [openPrep, setOpenPrep] = useState(false);
  const [searchPowder, setSearchPowder] = useState("");
  const [searchCeramic, setSearchCeramic] = useState("");
  const [searchPrep, setSearchPrep] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(insertEstimateSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      date: new Date(),
      desiredFinishDate: undefined,
      status: "draft",
    },
  });

  const powderServices = services.filter(s => s.category === "powder");
  const ceramicServices = services.filter(s => s.category === "ceramic");
  const prepServices = services.filter(s => s.category === "prep");

  const filteredPowder = powderServices.filter(s =>
    s.name.toLowerCase().includes(searchPowder.toLowerCase())
  );
  const filteredCeramic = ceramicServices.filter(s =>
    s.name.toLowerCase().includes(searchCeramic.toLowerCase())
  );
  const filteredPrep = prepServices.filter(s =>
    s.name.toLowerCase().includes(searchPrep.toLowerCase())
  );

  const total = selectedServices.reduce((sum, s) => sum + s.servicePrice, 0);

  const addService = (service: Service) => {
    const existing = selectedServices.find(s => s.serviceId === service.id);
    if (!existing) {
      setSelectedServices([...selectedServices, {
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: parseFloat(service.price),
      }]);
    }
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
  };

  const handleSubmit = (data: FormData) => {
    onSubmit(data, selectedServices);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Customer name" {...field} data-testid="input-customer-name" />
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
                  <Input placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => {
              const dateValue = field.value instanceof Date && !isNaN(field.value.getTime())
                ? field.value.toISOString().split('T')[0]
                : '';
              return (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={dateValue}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                      data-testid="input-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="desiredFinishDate"
            render={({ field }) => {
              const dateValue = field.value instanceof Date && !isNaN(field.value.getTime())
                ? field.value.toISOString().split('T')[0]
                : '';
              return (
                <FormItem>
                  <FormLabel>Desired Finish Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={dateValue}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      data-testid="input-desired-finish-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Services</h3>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Powder Job Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Powder Job</label>
              <Popover open={openPowder} onOpenChange={setOpenPowder}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    data-testid="button-select-powder"
                  >
                    Select powder service...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or type new..."
                      value={searchPowder}
                      onValueChange={setSearchPowder}
                      data-testid="input-search-powder"
                    />
                    <CommandList>
                      <CommandEmpty>No powder services found.</CommandEmpty>
                      <CommandGroup>
                        {filteredPowder.map((service) => (
                          <CommandItem
                            key={service.id}
                            value={service.name}
                            onSelect={() => {
                              addService(service);
                              setOpenPowder(false);
                              setSearchPowder("");
                            }}
                            data-testid={`option-powder-${service.id}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedServices.some(s => s.serviceId === service.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {service.name} - ${parseFloat(service.price).toFixed(2)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Ceramic Job Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Ceramic Job</label>
              <Popover open={openCeramic} onOpenChange={setOpenCeramic}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    data-testid="button-select-ceramic"
                  >
                    Select ceramic service...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or type new..."
                      value={searchCeramic}
                      onValueChange={setSearchCeramic}
                      data-testid="input-search-ceramic"
                    />
                    <CommandList>
                      <CommandEmpty>No ceramic services found.</CommandEmpty>
                      <CommandGroup>
                        {filteredCeramic.map((service) => (
                          <CommandItem
                            key={service.id}
                            value={service.name}
                            onSelect={() => {
                              addService(service);
                              setOpenCeramic(false);
                              setSearchCeramic("");
                            }}
                            data-testid={`option-ceramic-${service.id}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedServices.some(s => s.serviceId === service.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {service.name} - ${parseFloat(service.price).toFixed(2)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Prep Required Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Prep Required</label>
              <Popover open={openPrep} onOpenChange={setOpenPrep}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    data-testid="button-select-prep"
                  >
                    Select prep service...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or type new..."
                      value={searchPrep}
                      onValueChange={setSearchPrep}
                      data-testid="input-search-prep"
                    />
                    <CommandList>
                      <CommandEmpty>No prep services found.</CommandEmpty>
                      <CommandGroup>
                        {filteredPrep.map((service) => (
                          <CommandItem
                            key={service.id}
                            value={service.name}
                            onSelect={() => {
                              addService(service);
                              setOpenPrep(false);
                              setSearchPrep("");
                            }}
                            data-testid={`option-prep-${service.id}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedServices.some(s => s.serviceId === service.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {service.name} - ${parseFloat(service.price).toFixed(2)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Selected Services */}
        {selectedServices.length > 0 && (
          <Card className="p-4">
            <h4 className="font-medium mb-3">Selected Services</h4>
            <div className="space-y-2">
              {selectedServices.map((service) => (
                <div
                  key={service.serviceId}
                  className="flex items-center justify-between p-2 rounded hover-elevate"
                  data-testid={`selected-service-${service.serviceId}`}
                >
                  <span>{service.serviceName}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">${service.servicePrice.toFixed(2)}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeService(service.serviceId)}
                      data-testid={`button-remove-${service.serviceId}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Total */}
        <Card className="p-6 bg-primary/5">
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Total</span>
            <span className="text-3xl font-bold" data-testid="text-total">
              ${total.toFixed(2)}
            </span>
          </div>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" data-testid="button-submit">
            Create Estimate
          </Button>
        </div>
      </form>
    </Form>
  );
}
