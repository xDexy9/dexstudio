import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  Users,
  Wrench,
  Plus,
  Edit,
  Trash2,
  Check,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { GarageLocation } from '@/types';

const mockLocations: GarageLocation[] = [
  {
    id: 'loc-1',
    name: 'Joe Service - Main',
    address: '123 Auto Lane',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    phone: '(555) 987-6543',
    email: 'main@joeservice.com',
    isMain: true,
    mechanics: 4,
    bays: 6,
  },
  {
    id: 'loc-2',
    name: 'Joe Service - Downtown',
    address: '456 Center Street',
    city: 'Springfield',
    state: 'IL',
    zip: '62702',
    phone: '(555) 123-4567',
    email: 'downtown@joeservice.com',
    isMain: false,
    mechanics: 2,
    bays: 4,
  },
  {
    id: 'loc-3',
    name: 'Joe Service - West Side',
    address: '789 Industrial Blvd',
    city: 'Springfield',
    state: 'IL',
    zip: '62703',
    phone: '(555) 456-7890',
    email: 'west@joeservice.com',
    isMain: false,
    mechanics: 3,
    bays: 5,
  },
];

export const LocationManager = () => {
  const [locations, setLocations] = useState<GarageLocation[]>(mockLocations);
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0].id);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<GarageLocation | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const currentLocation = locations.find((l) => l.id === selectedLocation);

  const handleEdit = (location: GarageLocation) => {
    setEditingLocation({ ...location });
    setIsEditOpen(true);
  };

  const handleAddNew = () => {
    setEditingLocation({
      id: `loc-${Date.now()}`,
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      email: '',
      isMain: false,
      mechanics: 0,
      bays: 0,
    });
    setIsEditOpen(true);
  };

  const handleSave = () => {
    if (!editingLocation) return;

    const exists = locations.find((l) => l.id === editingLocation.id);
    if (exists) {
      setLocations((prev) =>
        prev.map((l) => (l.id === editingLocation.id ? editingLocation : l))
      );
    } else {
      setLocations((prev) => [...prev, editingLocation]);
    }
    setIsEditOpen(false);
    setEditingLocation(null);
  };

  const handleDelete = () => {
    if (!currentLocation || currentLocation.isMain) return;
    setLocations((prev) => prev.filter((l) => l.id !== currentLocation.id));
    setSelectedLocation(locations[0].id);
    setIsDeleteConfirmOpen(false);
  };

  const setAsMain = (id: string) => {
    setLocations((prev) =>
      prev.map((l) => ({
        ...l,
        isMain: l.id === id,
      }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            Location Management
          </h2>
          <p className="text-muted-foreground">
            Manage multiple garage locations from one panel
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-1" />
          Add Location
        </Button>
      </div>

      {/* Location Selector */}
      <div className="flex items-center gap-4">
        <Label>Current Location:</Label>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                <div className="flex items-center gap-2">
                  {loc.name}
                  {loc.isMain && (
                    <Badge variant="secondary" className="text-xs">
                      Main
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location, i) => (
          <motion.div
            key={location.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={cn(
                'cursor-pointer transition-all',
                selectedLocation === location.id
                  ? 'ring-2 ring-primary'
                  : 'hover:border-primary/50'
              )}
              onClick={() => setSelectedLocation(location.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    {location.isMain && (
                      <Badge className="mt-1 bg-primary/10 text-primary">
                        <Check className="h-3 w-3 mr-1" />
                        Main Location
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(location);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!location.isMain && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLocation(location.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>
                    {location.address}, {location.city}, {location.state} {location.zip}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{location.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{location.email}</span>
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{location.mechanics} Mechanics</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span>{location.bays} Bays</span>
                  </div>
                </div>
                {!location.isMain && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsMain(location.id);
                    }}
                  >
                    Set as Main Location
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation?.name ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
          </DialogHeader>
          {editingLocation && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Location Name</Label>
                <Input
                  value={editingLocation.name}
                  onChange={(e) =>
                    setEditingLocation({ ...editingLocation, name: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Joe Service - Location Name"
                />
              </div>
              <div>
                <Label>Street Address</Label>
                <Input
                  value={editingLocation.address}
                  onChange={(e) =>
                    setEditingLocation({ ...editingLocation, address: e.target.value })
                  }
                  className="mt-1"
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={editingLocation.city}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, city: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={editingLocation.state}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, state: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input
                    value={editingLocation.zip}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, zip: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editingLocation.phone}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, phone: e.target.value })
                    }
                    className="mt-1"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editingLocation.email}
                    onChange={(e) =>
                      setEditingLocation({ ...editingLocation, email: e.target.value })
                    }
                    className="mt-1"
                    placeholder="location@joeservice.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Number of Mechanics</Label>
                  <Input
                    type="number"
                    value={editingLocation.mechanics}
                    onChange={(e) =>
                      setEditingLocation({
                        ...editingLocation,
                        mechanics: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Number of Bays</Label>
                  <Input
                    type="number"
                    value={editingLocation.bays}
                    onChange={(e) =>
                      setEditingLocation({
                        ...editingLocation,
                        bays: Number(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{currentLocation?.name}"? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
