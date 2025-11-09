import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//todo: remove mock functionality
const mockNotes = [
  { id: "1", content: "Customer called to confirm appointment for tomorrow morning", author: "John Doe", date: "2024-03-15 10:30 AM", type: "job", reference: "Engine Repair - Acme Corp" },
  { id: "2", content: "Parts ordered and expected to arrive on Friday", author: "Jane Smith", date: "2024-03-15 2:15 PM", type: "job", reference: "Transmission Fix - Smith Auto" },
  { id: "3", content: "Customer requested additional estimate for tire rotation", author: "John Doe", date: "2024-03-16 9:00 AM", type: "customer", reference: "Tech Solutions Inc" },
  { id: "4", content: "Job completed successfully, customer very satisfied", author: "Mike Johnson", date: "2024-03-14 4:45 PM", type: "job", reference: "Brake Service - Global Industries" },
];

export default function Notes() {
  const [newNote, setNewNote] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredNotes = mockNotes.filter(note =>
    filterType === "all" || note.type === filterType
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("New note:", newNote);
    setNewNote("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Notes</h1>
          <p className="text-muted-foreground mt-1">Activity log and comments</p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Add New Note</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Write a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-24"
            data-testid="input-note-content"
          />
          <div className="flex items-center justify-between gap-4">
            <Select defaultValue="general">
              <SelectTrigger className="w-48" data-testid="select-note-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Note</SelectItem>
                <SelectItem value="job">Job Note</SelectItem>
                <SelectItem value="customer">Customer Note</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!newNote.trim()} data-testid="button-add-note">
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex items-center gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48" data-testid="select-filter-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notes</SelectItem>
            <SelectItem value="job">Job Notes</SelectItem>
            <SelectItem value="customer">Customer Notes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="p-6" data-testid={`card-note-${note.id}`}>
            <div className="flex gap-4">
              <Avatar>
                <AvatarFallback>
                  {note.author.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{note.author}</span>
                  <span className="text-sm text-muted-foreground">{note.date}</span>
                </div>
                <p className="text-foreground mb-2">{note.content}</p>
                <div className="text-sm text-muted-foreground">
                  Related to: {note.reference}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
