/**
 * Item Form Component
 * Reusable form for creating and editing items
 */

import React, { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductionLineType } from '@/types/index';

export interface ItemFormData {
  code: string;
  description1: string;
  description2: string;
  unitOfMeasure: string;
  identifier: string;
  productionLineId: number | null;
}

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ItemFormData) => Promise<void>;
  initialData?: ItemFormData | null;
  productionLines: ProductionLineType[];
  title: string;
  description: string;
  isLoading?: boolean;
}

const ItemForm: React.FC<ItemFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  productionLines,
  title,
  description,
  isLoading = false,
}) => {
  const [code, setCode] = useState('');
  const [description1, setDescription1] = useState('');
  const [description2, setDescription2] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [productionLineId, setProductionLineId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      setCode(initialData?.code || '');
      setDescription1(initialData?.description1 || '');
      setDescription2(initialData?.description2 || '');
      setUnitOfMeasure(initialData?.unitOfMeasure || '');
      setIdentifier(initialData?.identifier || initialData?.code || '');
      setProductionLineId(initialData?.productionLineId || null);
      setError('');
    }
  }, [open, initialData]);

  // Auto-fill identifier with code if identifier is empty
  useEffect(() => {
    if (!identifier && code) {
      setIdentifier(code);
    }
  }, [code, identifier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Item code is required');
      return;
    }

    if (code.trim().length > 50) {
      setError('Item code must be 50 characters or less');
      return;
    }

    try {
      await onSubmit({
        code: code.trim(),
        description1: description1.trim(),
        description2: description2.trim(),
        unitOfMeasure: unitOfMeasure.trim(),
        identifier: identifier.trim() || code.trim(),
        productionLineId,
      });
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter item code"
                  disabled={isLoading}
                  maxLength={50}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                <Input
                  id="unitOfMeasure"
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  placeholder="e.g., PCS, KG, L"
                  disabled={isLoading}
                  maxLength={20}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description1">Description 1</Label>
              <Input
                id="description1"
                value={description1}
                onChange={(e) => setDescription1(e.target.value)}
                placeholder="Enter description 1"
                disabled={isLoading}
                maxLength={500}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description2">Description 2</Label>
              <Input
                id="description2"
                value={description2}
                onChange={(e) => setDescription2(e.target.value)}
                placeholder="Enter description 2"
                disabled={isLoading}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="identifier">Identifier</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Auto-filled from code if empty"
                  disabled={isLoading}
                  maxLength={100}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productionLine">Production Line</Label>
                <Select
                  value={productionLineId?.toString() || 'none'}
                  onValueChange={(value) => setProductionLineId(value === 'none' ? null : parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="productionLine">
                    <SelectValue placeholder="Select production line" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {productionLines.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id.toString()}>
                        {pl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
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

export default ItemForm;
