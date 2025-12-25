import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema } from "@shared/schema";
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
import { formatPhoneNumber } from "@/lib/formatters";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Check,
  Loader2,
} from "lucide-react";

// ============================================
// SCHEMA
// ============================================

const formSchema = insertCustomerSchema.extend({
  email: z.string().email().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// PROPS
// ============================================

interface CustomerFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<FormData>;
  isSubmitting?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function CustomerForm({ 
  onSubmit, 
  onCancel, 
  defaultValues,
  isSubmitting = false,
}: CustomerFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      phone: "",
      address: "",
      projectList: "",
    },
  });

  const isEditing = !!defaultValues?.name;
  const isPending = isSubmitting || form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* ============================================ */}
        {/* CONTACT INFORMATION */}
        {/* ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            Contact Information
          </h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="John Smith" 
                      className="pl-10"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="555-123-4567" 
                        className="pl-10"
                        {...field} 
                        value={field.value || ""} 
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="123 Main St, City, State ZIP" 
                    className="resize-none min-h-[80px]"
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
        {/* NOTES */}
        {/* ============================================ */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Notes & Projects
          </h3>

          <FormField
            control={form.control}
            name="projectList"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Customer preferences, project history, reminders, color choices..."
                    className="resize-none min-h-[120px]"
                    {...field} 
                    value={field.value || ""} 
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Keep track of preferences, ongoing projects, and important details
                </FormDescription>
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
            className="flex-1 sm:flex-none"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 sm:flex-none sm:ml-auto bg-blue-600 hover:bg-blue-700"
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
                {isEditing ? 'Update Customer' : 'Add Customer'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
