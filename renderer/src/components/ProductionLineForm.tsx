/**
 * Production Line Form Component
 * Reusable form for creating and editing production lines
 */

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ProductionLineFormData {
  name: string;
}

interface ProductionLineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductionLineFormData) => Promise<void>;
  initialData?: ProductionLineFormData | null;
  title: string;
  description: string;
  isLoading?: boolean;
}

const ProductionLineForm: React.FC<ProductionLineFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  description,
  isLoading = false,
}) => {
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setError('');
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Production line name is required');
      return;
    }

    if (name.trim().length > 100) {
      setError('Production line name must be 100 characters or less');
      return;
    }

    try {
      await onSubmit({ name: name.trim() });
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Enter production line name"
                disabled={isLoading}
                maxLength={100}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionLineForm;
