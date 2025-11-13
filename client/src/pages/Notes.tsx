import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { canAccessDashboard } from "@/lib/authUtils";
import type { Note, InsertNote } from "@shared/schema";
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
import { useToast } from "@/hooks/use-toast";

export default function Notes() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  // Redirect employees away from this page
  useEffect(() => {
    if (user && !canAccessDashboard(user)) {
      setLocation("/estimates");
    }
  }, [user, setLocation]);

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertNote) =>
      apiRequest("POST", "/api/notes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setNewNote("");
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    },
  });

  const filteredNotes = notes.filter(note => {
    if (filterType === "all") return true;
    if (filterType === "job") return note.jobId !== null;
    if (filterType === "customer") return note.customerId !== null;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    createMutation.mutate({
      content: newNote,
      author: "Current User",
      jobId: null,
      customerId: null,
    });
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

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
          <div className="flex items-center justify-end gap-4">
            <Button type="submit" disabled={!newNote.trim() || createMutation.isPending} data-testid="button-add-note">
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
        {filteredNotes.length === 0 ? (
          <Card className="p-8">
            <p className="text-muted-foreground text-center">No notes yet</p>
          </Card>
        ) : (
          filteredNotes.map((note) => (
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
                    <span className="text-sm text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-foreground">{note.content}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
