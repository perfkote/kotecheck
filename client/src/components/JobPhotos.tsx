import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { uploadJobPhoto, deleteJobPhoto, getJobPhotoUrl } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2, ImageIcon, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface JobPhoto {
  id: string;
  jobId: string;
  filePath: string;
  fileName: string;
  fileSize: number | null;
  uploadedAt: string;
}

interface JobPhotosProps {
  jobId: string;
}

export function JobPhotos({ jobId }: JobPhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: photos = [], isLoading } = useQuery<JobPhoto[]>({
    queryKey: [`/api/jobs/${jobId}/photos`],
    enabled: !!jobId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (photo: JobPhoto) => {
      // Delete from Supabase Storage
      await deleteJobPhoto(photo.filePath);
      // Delete metadata from our DB
      await apiRequest("DELETE", `/api/jobs/${jobId}/photos/${photo.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/photos`] });
      toast({ title: "Photo deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: "Failed to delete photo", variant: "destructive" });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({ title: "Error", description: `${file.name} is not an image`, variant: "destructive" });
          continue;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: "Error", description: `${file.name} is too large (max 10MB)`, variant: "destructive" });
          continue;
        }

        // Upload to Supabase Storage
        const { path } = await uploadJobPhoto(jobId, file);

        // Save metadata to our DB
        await apiRequest("POST", `/api/jobs/${jobId}/photos`, {
          filePath: path,
          fileName: file.name,
          fileSize: file.size,
        });
      }

      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/photos`] });
      toast({ title: "Photos uploaded", description: `${files.length} photo${files.length > 1 ? 's' : ''} added` });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Photos</span>
          {photos.length > 0 && (
            <span className="text-xs text-muted-foreground">({photos.length})</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-8 text-xs"
        >
          {uploading ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="w-3 h-3 mr-1" />
              Add Photos
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Photo Grid */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading photos...</div>
      ) : photos.length === 0 ? (
        <div 
          className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">Tap to add intake photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const url = getJobPhotoUrl(photo.filePath);
            return (
              <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={url}
                  alt={photo.fileName}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setViewingPhoto(url)}
                  loading="lazy"
                />
                {/* Expand button */}
                <button
                  type="button"
                  className="absolute bottom-1 left-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={() => setViewingPhoto(url)}
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                {/* Delete button */}
                <button
                  type="button"
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(photo);
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
                {/* Upload date */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate">
                    {new Date(photo.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-size Photo Viewer */}
      <Dialog open={!!viewingPhoto} onOpenChange={(open) => !open && setViewingPhoto(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl p-2">
          {viewingPhoto && (
            <img
              src={viewingPhoto}
              alt="Job photo"
              className="w-full h-auto max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
