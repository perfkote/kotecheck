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

type FormData = z.infer<typeof insertEstimateSchema>;

interface EstimateFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

export function EstimateForm({ onSubmit, onCancel }: EstimateFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(insertEstimateSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      serviceType: "powder",
      date: new Date(),
      notes: "",
      status: "draft",
    },
  });

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
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-service-type">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="powder">Powder</SelectItem>
                  <SelectItem value="ceramic">Ceramic</SelectItem>
                  <SelectItem value="misc">Misc</SelectItem>
                </SelectContent>
              </Select>
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
