import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface MySQLConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export const MySQLConfigModal: React.FC<MySQLConfigModalProps> = ({ open, onClose }) => {
  const handleSave = () => {
    toast({ title: "✅ MySQL configuration saved!" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">MySQL</DialogTitle>
          <p className="text-sm text-muted-foreground">Configure your MySQL connection</p>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Display name *</label>
            <Input placeholder="My MySQL Database" defaultValue="My MySQL Database" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Host *</label>
              <Input placeholder="e.g. 127.0.0.1" defaultValue="65.2.71.162" />
            </div>
            <div className="w-[30%]">
              <label className="text-sm font-medium">Port *</label>
              <Input placeholder="3306" defaultValue="3306" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Username *</label>
              <Input placeholder="e.g. root" defaultValue="root" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Password *</label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave}>Connect</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
