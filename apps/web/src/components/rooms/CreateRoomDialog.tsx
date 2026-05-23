"use client";

import { useState }    from "react";
import { useRouter }   from "next/navigation";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Hash, Loader2 } from "lucide-react";
import { toast }       from "sonner";
import Swal            from "sweetalert2";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { createRoomSchema, type CreateRoomInput } from "@/lib/validations/chat";
import { apiPost }                                from "@/lib/api-client";

interface CreateRoomDialogProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  onCreated:    (room: any) => void;
}

export function CreateRoomDialog({ open, onOpenChange, onCreated }: CreateRoomDialogProps) {
  const router      = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: CreateRoomInput) {
    setLoading(true);
    try {
      const room = await apiPost<any>("/api/rooms", { name: values.name });

      // Join the room after creating
      await apiPost(`/api/rooms/${room.id}/join`);

      onCreated(room);
      onOpenChange(false);
      form.reset();

      await Swal.fire({
        icon:              "success",
        title:             `# ${room.name} created!`,
        text:              "Taking you there now...",
        timer:             1200,
        timerProgressBar:  true,
        showConfirmButton: false,
        showClass: { popup: "animate__animated animate__bounceIn animate__faster" },
        hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
        confirmButtonColor:"#7c3aed",
      });

      router.push(`/rooms/${room.id}`);

    } catch (err: any) {
      if (err.status === 409) {
        form.setError("name", { message: "A room with this name already exists" });
        return;
      }
      toast.error(err.detail ?? "Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) form.reset(); }}>
      <DialogContent
        className="max-w-[min(92vw,28rem)] rounded-2xl border border-slate-200/80 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.35)]"
        style={{ background: "rgba(255,255,255,0.98)", color: "rgb(15 23 42)" }}
      >
        <DialogHeader>
          <DialogTitle style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgb(15 23 42)" }}>
            <div style={{
              width:        "28px",
              height:       "28px",
              borderRadius: "8px",
              background:   "linear-gradient(135deg, #667eea, #764ba2)",
              display:      "flex",
              alignItems:   "center",
              justifyContent:"center",
            }}>
              <Hash style={{ width: "14px", height: "14px", color: "#fff" }} />
            </div>
            Create a room
          </DialogTitle>
          <DialogDescription style={{ color: "rgb(71 85 105)" }}>
            Rooms are where your team communicates. Give it a clear name.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="room-name">Room name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="room-name"
                        placeholder="e.g. general, design, dev"
                        disabled={loading}
                        className="h-10 rounded-xl border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-400 focus-visible:ring-violet-500"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                style={{ borderRadius: "10px" }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                style={{
                  borderRadius: "10px",
                  background:   "linear-gradient(135deg, #667eea, #764ba2)",
                  border:       "none",
                  color:        "#fff",
                }}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                ) : (
                  "Create room"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}