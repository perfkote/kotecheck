import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, Eye, Send, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

//todo: remove mock functionality
const mockEstimates = [
  { id: "1", title: "Engine Repair Quote", customer: "Acme Corp", total: "$1,250.00", status: "sent", date: "2024-03-15" },
  { id: "2", title: "Brake Service Estimate", customer: "Tech Solutions", total: "$450.00", status: "draft", date: "2024-03-16" },
  { id: "3", title: "Transmission Work", customer: "Global Industries", total: "$2,800.00", status: "approved", date: "2024-03-14" },
  { id: "4", title: "Oil Change Package", customer: "Smith Auto", total: "$85.00", status: "sent", date: "2024-03-17" },
];

export default function Estimates() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEstimates = mockEstimates.filter(estimate =>
    estimate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    estimate.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Estimates</h1>
          <p className="text-muted-foreground mt-1">Create and manage customer estimates</p>
        </div>
        <Button data-testid="button-new-estimate">
          <Plus className="w-4 h-4 mr-2" />
          New Estimate
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search estimates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-estimates"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEstimates.map((estimate) => (
          <Card key={estimate.id} className="p-6" data-testid={`card-estimate-${estimate.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-medium">{estimate.title}</h3>
                  <StatusBadge status={estimate.status} type="estimate" />
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>{estimate.customer}</span>
                  <span>{estimate.date}</span>
                  <span className="font-medium text-foreground">{estimate.total}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" data-testid={`button-view-${estimate.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                {estimate.status === "draft" && (
                  <Button size="sm" data-testid={`button-send-${estimate.id}`}>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-menu-${estimate.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid="menu-edit">Edit</DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-duplicate">Duplicate</DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-download">Download PDF</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" data-testid="menu-delete">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
