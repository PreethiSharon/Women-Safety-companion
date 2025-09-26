'use client';

import { useState } from 'react';
import type { Guardian } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function GuardiansClient({ initialGuardians }: { initialGuardians: Guardian[] }) {
  const [guardians, setGuardians] = useState<Guardian[]>(initialGuardians);
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGuardianName.trim() && newGuardianPhone.trim()) {
      const newGuardian: Guardian = {
        id: new Date().getTime().toString(),
        name: newGuardianName.trim(),
        phone: newGuardianPhone.trim(),
      };
      setGuardians([...guardians, newGuardian]);
      setNewGuardianName('');
      setNewGuardianPhone('');
      toast({
        title: 'Guardian Added',
        description: `${newGuardian.name} has been added to your network.`,
      });
      setIsDialogOpen(false);
    }
  };

  const handleDeleteGuardian = (id: string) => {
    const guardianToDelete = guardians.find(g => g.id === id);
    setGuardians(guardians.filter((guardian) => guardian.id !== id));
    if (guardianToDelete) {
        toast({
            title: 'Guardian Removed',
            description: `${guardianToDelete.name} has been removed from your network.`,
            variant: 'destructive',
        });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Guardians</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" /> Add Guardian
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddGuardian}>
                <DialogHeader>
                  <DialogTitle>Add New Guardian</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newGuardianName}
                      onChange={(e) => setNewGuardianName(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., Jane Doe"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={newGuardianPhone}
                      onChange={(e) => setNewGuardianPhone(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., (555) 123-4567"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Add Guardian</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {guardians.length > 0 ? (
              guardians.map((guardian) => (
                <div
                  key={guardian.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-all hover:bg-muted/50"
                >
                  <div>
                    <p className="font-semibold">{guardian.name}</p>
                    <p className="text-sm text-muted-foreground">{guardian.phone}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGuardian(guardian.id)}
                    aria-label={`Remove ${guardian.name}`}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                You haven't added any guardians yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
