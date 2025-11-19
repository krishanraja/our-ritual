import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface JoinCoupleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinCoupleDialog = ({ open, onOpenChange }: JoinCoupleDialogProps) => {
  const [yourName, setYourName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!yourName.trim() || !code.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (code.length !== 6) {
      toast.error("Code must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first");
        navigate("/auth");
        return;
      }

      // Find couple with this code
      const { data: couple, error: findError } = await supabase
        .from('couples')
        .select('*')
        .eq('couple_code', code)
        .maybeSingle();

      if (findError) throw findError;
      if (!couple) {
        toast.error("Invalid couple code");
        return;
      }

      if (couple.partner_two) {
        toast.error("This couple is already complete");
        return;
      }

      // Join the couple
      const { error: updateError } = await supabase
        .from('couples')
        .update({ partner_two: user.id })
        .eq('id', couple.id);

      if (updateError) throw updateError;

      toast.success("Successfully joined your partner's ritual!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-warm border-none shadow-card rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold text-foreground">
            Join your partner
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="join-name" className="text-foreground">Your name</Label>
            <Input
              id="join-name"
              placeholder="Enter your name"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              className="border-primary/30 rounded-xl h-12 text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-foreground">Partner's code</Label>
            <Input
              id="code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="border-primary/30 rounded-xl h-12 text-lg text-center tracking-widest text-2xl font-bold"
              maxLength={6}
            />
          </div>

          <Button
            onClick={handleJoin}
            disabled={!yourName.trim() || code.length !== 6 || loading}
            className="w-full bg-gradient-ritual text-white hover:opacity-90 h-12 rounded-xl text-lg"
          >
            {loading ? "Joining..." : "Join Ritual"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
