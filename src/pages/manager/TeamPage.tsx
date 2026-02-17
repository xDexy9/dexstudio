import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Wrench,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Activity,
  Filter,
  Crown
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllUsers, getMechanicStats, getJobs, addUser, updateUser, deleteUser, generateId } from '@/services/firestoreService';
import { User, UserRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatarUtils';

// Role badge styles
const roleStyles: Record<UserRole, { label: string; className: string; icon: React.ElementType }> = {
  admin: { label: 'Admin', className: 'bg-red-50 text-red-700 border-red-200', icon: Shield },
  manager: { label: 'Manager', className: 'bg-violet-50 text-violet-700 border-violet-200', icon: Shield },
  office_staff: { label: 'Office Staff', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Briefcase },
  mechanic: { label: 'Mechanic', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Wrench },
};

function RoleBadge({ role }: { role: UserRole }) {
  const style = roleStyles[role];
  const Icon = style.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
      style.className
    )}>
      <Icon className="h-3 w-3" />
      {style.label}
    </span>
  );
}

// Team member card for mobile/grid view
function TeamMemberCard({ 
  user, 
  stats,
  onEdit,
  onDelete 
}: { 
  user: User; 
  stats?: { completedJobs: number; activeJobs: number; avgTime: number };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const efficiency = stats ? Math.min(100, 60 + Math.random() * 40) : 0;
  
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {getUserAvatarUrl(user.email) && (
                <AvatarImage src={getUserAvatarUrl(user.email)} alt={user.fullName} />
              )}
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.fullName}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined {format(new Date(user.createdAt), 'MM/yyyy')}</span>
          </div>
        </div>

        {stats && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-600">{stats.completedJobs}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{stats.activeJobs}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">{stats.avgTime}m</p>
                <p className="text-xs text-muted-foreground">Avg Time</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Efficiency</span>
                <span className={cn(
                  "font-medium",
                  efficiency >= 80 ? 'text-emerald-600' : efficiency >= 60 ? 'text-amber-600' : 'text-red-600'
                )}>{Math.round(efficiency)}%</span>
              </div>
              <Progress 
                value={efficiency} 
                className={cn(
                  "h-2",
                  efficiency >= 80 ? '[&>div]:bg-emerald-500' : 
                  efficiency >= 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                )} 
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeamPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [mechanicStats, setMechanicStats] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'mechanic' as UserRole,
    preferredLanguage: 'en' as 'en' | 'fr' | 'ro' | 'pt',
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [usersData, mechanicStatsData, jobsData] = await Promise.all([
          getAllUsers(),
          getMechanicStats(),
          getJobs()
        ]);
        setUsers(usersData);
        setMechanicStats(mechanicStatsData);
        setJobs(jobsData);
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        (user.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Team stats
  const teamStats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      managers: users.filter(u => u.role === 'manager').length,
      office: users.filter(u => u.role === 'office_staff').length,
      mechanics: users.filter(u => u.role === 'mechanic').length,
    };
  }, [users]);

  const handleAddUser = () => {
    const newUser: User = {
      id: generateId(),
      email: formData.email,
      fullName: formData.fullName,
      role: formData.role,
      preferredLanguage: formData.preferredLanguage,
      createdAt: new Date().toISOString(),
    };
    addUser(newUser);
    setAddDialogOpen(false);
    setFormData({ fullName: '', email: '', role: 'mechanic', preferredLanguage: 'en' });
    setRefreshKey(prev => prev + 1);
    toast({
      title: 'Team member added',
      description: `${newUser.fullName} has been added to the team.`,
    });
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser.id, {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        preferredLanguage: formData.preferredLanguage,
      });
      setEditDialogOpen(false);
      setSelectedUser(null);
      setRefreshKey(prev => prev + 1);
      toast({
        title: 'Team member updated',
        description: `${formData.fullName}'s profile has been updated.`,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update team member.',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser.id);
      setDeleteDialogOpen(false);
      const deletedName = selectedUser.fullName;
      setSelectedUser(null);
      setRefreshKey(prev => prev + 1);
      toast({
        title: 'Team member removed',
        description: `${deletedName} has been removed from the team.`,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove team member.',
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
    });
    setEditDialogOpen(true);
  };

  const getMechanicStatsForUser = (userId: string) => {
    return mechanicStats.find(s => s.id === userId);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">Manage your workshop team members and their roles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-9" onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{teamStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-2xl font-bold">{teamStats.managers}</p>
                <p className="text-xs text-muted-foreground">Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{teamStats.office}</p>
                <p className="text-xs text-muted-foreground">Office Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{teamStats.mechanics}</p>
                <p className="text-xs text-muted-foreground">Mechanics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search team members..."
            className="pl-10 h-10 bg-muted/30 border-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44 h-10 bg-muted/30 border-0">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="office_staff">Office Staff</SelectItem>
            <SelectItem value="mechanic">Mechanic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      )}

      {/* Team Grid */}
      {!isLoading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map(user => (
          <TeamMemberCard
            key={user.id}
            user={user}
            stats={getMechanicStatsForUser(user.id)}
            onEdit={() => openEditDialog(user)}
            onDelete={() => {
              setSelectedUser(user);
              setDeleteDialogOpen(true);
            }}
          />
        ))}
          {filteredUsers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No team members found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your workshop team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                  <SelectItem value="office_staff">Office Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred Language</Label>
              <Select 
                value={formData.preferredLanguage} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, preferredLanguage: v as typeof formData.preferredLanguage }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ro">Română</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={!formData.fullName || !formData.email}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                  <SelectItem value="office_staff">Office Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred Language</Label>
              <Select 
                value={formData.preferredLanguage} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, preferredLanguage: v as typeof formData.preferredLanguage }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ro">Română</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedUser?.fullName} from the team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
