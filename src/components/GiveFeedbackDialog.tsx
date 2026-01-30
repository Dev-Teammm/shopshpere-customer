"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback, SubmitFeedbackRequest } from "@/lib/feedbackService";

interface GiveFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  defaultEmail?: string;
}

export function GiveFeedbackDialog({
  open,
  onOpenChange,
  defaultName = "",
  defaultEmail = "",
}: GiveFeedbackDialogProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const resetForm = () => {
    setName(defaultName);
    setEmail(defaultEmail);
    setContent("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedContent = content.trim();
    if (!trimmedName) {
      toast.error("Please enter your name");
      return;
    }
    if (!trimmedEmail) {
      toast.error("Please enter your email");
      return;
    }
    if (!trimmedContent) {
      toast.error("Please enter your feedback");
      return;
    }
    try {
      setSending(true);
      const request: SubmitFeedbackRequest = {
        username: trimmedName,
        email: trimmedEmail,
        content: trimmedContent,
      };
      await submitFeedback(request);
      toast.success("Thank you! Your feedback has been sent.");
      handleClose(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to send feedback");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Give Feedback
          </DialogTitle>
          <DialogDescription>
            Share your ideas to help us improve. No account required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="feedback-name">Your name</Label>
            <Input
              id="feedback-name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="feedback-email">Email</Label>
            <Input
              id="feedback-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="feedback-content">Your feedback</Label>
            <Textarea
              id="feedback-content"
              placeholder="Tell us what we can improve..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Close
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
