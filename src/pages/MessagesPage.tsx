import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2, CheckSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getJobs, getVehicleById, getUserById, deleteAllReadMessagesFromJob, subscribeToAllMessages } from '@/services/firestoreService';
import { Message, Job } from '@/lib/types';
import { toast } from 'sonner';
import { LicensePlate } from '@/components/ui/license-plate';
import { CarBrandLogo } from '@/components/ui/car-brand-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatarUtils';

export default function MessagesPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [jobsWithMessages, setJobsWithMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Cache for jobs, vehicles, and users to avoid repeated fetches
  const jobsCache = useRef<Map<string, Job>>(new Map());
  const vehiclesCache = useRef<Map<string, any>>(new Map());
  const usersCache = useRef<Map<string, any>>(new Map());

  // Process messages and group by job
  const processMessages = async (allMessages: Message[]) => {
    if (!user) return;

    try {
      // Group messages by jobId
      const messagesByJob = new Map<string, Message[]>();
      allMessages.forEach(msg => {
        const existing = messagesByJob.get(msg.jobId) || [];
        existing.push(msg);
        messagesByJob.set(msg.jobId, existing);
      });

      // Get all jobs (use cache if available, otherwise fetch)
      if (jobsCache.current.size === 0) {
        const jobs = await getJobs();
        jobs.forEach(job => jobsCache.current.set(job.id, job));
      }

      // Filter jobs based on user role
      const relevantJobIds = Array.from(messagesByJob.keys()).filter(jobId => {
        const job = jobsCache.current.get(jobId);
        if (!job) return false;

        // Managers and office staff see ALL messages
        if (user.role === 'manager' || user.role === 'office_staff' || user.role === 'admin') {
          return true;
        }
        // Mechanics only see messages for jobs assigned to them
        if (user.role === 'mechanic') {
          return job.assignedMechanicId === user.id;
        }
        return false;
      });

      // Build the jobs with messages array
      const jobsData = await Promise.all(
        relevantJobIds.map(async (jobId) => {
          const job = jobsCache.current.get(jobId)!;
          const messages = messagesByJob.get(jobId) || [];

          // Sort messages by date
          messages.sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const lastMessage = messages[messages.length - 1];

          // Get vehicle (use cache)
          let vehicle = vehiclesCache.current.get(job.vehicleId);
          if (!vehicle) {
            vehicle = await getVehicleById(job.vehicleId);
            if (vehicle) vehiclesCache.current.set(job.vehicleId, vehicle);
          }

          // Get sender (use cache)
          let sender = null;
          if (lastMessage) {
            sender = usersCache.current.get(lastMessage.senderId);
            if (!sender) {
              sender = await getUserById(lastMessage.senderId);
              if (sender) usersCache.current.set(lastMessage.senderId, sender);
            }
          }

          return { job, messages, lastMessage, vehicle, sender };
        })
      );

      // Sort by most recent message
      const sorted = jobsData.sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setJobsWithMessages(sorted);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing messages:', error);
      setIsLoading(false);
    }
  };

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    // Clear caches when user changes
    jobsCache.current.clear();
    vehiclesCache.current.clear();
    usersCache.current.clear();

    const unsubscribe = subscribeToAllMessages((messages) => {
      processMessages(messages);
    });

    return () => unsubscribe();
  }, [user]);

  // Toggle selection for a job
  const toggleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  // Check if user is mechanic only (for filtering selectable jobs)
  const isMechanicOnly = user?.role === 'mechanic';

  // Select all jobs (only selectable ones)
  const selectAllJobs = () => {
    const selectableJobIds = jobsWithMessages
      .filter(item => {
        // Mechanics can only select open jobs
        if (isMechanicOnly) {
          return item.job.status !== 'completed';
        }
        return true;
      })
      .map(item => item.job.id);
    setSelectedJobs(new Set(selectableJobIds));
  };

  // Deselect all jobs
  const deselectAllJobs = () => {
    setSelectedJobs(new Set());
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedJobs(new Set());
  };

  // Delete read messages from selected jobs
  const handleDeleteSelectedMessages = async () => {
    if (!user || selectedJobs.size === 0) return;

    setIsDeleting(true);
    try {
      let totalDeleted = 0;

      // Convert Set to Array for iteration
      const jobIdsToDelete = Array.from(selectedJobs);

      for (const jobId of jobIdsToDelete) {
        const deletedCount = await deleteAllReadMessagesFromJob(jobId, user.id);
        totalDeleted += deletedCount;
      }

      exitSelectionMode();

      if (totalDeleted > 0) {
        toast.success(`Deleted ${totalDeleted} message${totalDeleted !== 1 ? 's' : ''}`);
        // Real-time subscription will automatically update the list
      } else {
        toast.info('No read messages to delete in selected conversations');
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
      toast.error('Failed to delete messages');
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if user can delete messages (mechanics, managers, and office staff)
  const canDeleteMessages = user?.role === 'mechanic' || user?.role === 'manager' || user?.role === 'office_staff' || user?.role === 'admin';

  // Mechanics see vehicle info, others see customer info
  const isMechanic = user?.role === 'mechanic';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="safe-top">
      {/* Header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('nav.chats')}</h1>
            <p className="text-muted-foreground">{t('chats.title')}</p>
          </div>
          {canDeleteMessages && jobsWithMessages.length > 0 && !isSelectionMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectionMode(true)}
              className="gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              {t('chats.select')}
            </Button>
          )}
        </div>

        {/* Selection Mode Header */}
        {isSelectionMode && (
          <div className="mt-4 flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSelectionMode}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {selectedJobs.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedJobs.size === jobsWithMessages.length ? deselectAllJobs : selectAllJobs}
                className="text-xs"
              >
                {selectedJobs.size === jobsWithMessages.length ? 'Deselect all' : 'Select all'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelectedMessages}
                disabled={selectedJobs.size === 0 || isDeleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Message threads */}
      <div className="px-4 space-y-3">
        {jobsWithMessages.length > 0 ? (
          jobsWithMessages.map(({ job, messages, lastMessage, vehicle, sender }) => {
            const isSelected = selectedJobs.has(job.id);
            // Count unread messages for this job
            const unreadCount = messages.filter(
              (m: Message) => m.senderId !== user?.id && (!m.readBy || !m.readBy.includes(user?.id || ''))
            ).length;
            // Mechanics can only select open jobs, managers/office can select any
            const isOpenJob = job.status !== 'completed';
            const canSelectThisJob = isMechanicOnly ? isOpenJob : true;
            const canSelect = isSelectionMode && canSelectThisJob;
            // Get initials for avatar
            const initials = job.customerName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={job.id}
                className={`relative flex gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'bg-card border border-border'
                } ${isSelectionMode && !canSelectThisJob ? 'opacity-50' : ''}`}
                onClick={() => {
                  if (isSelectionMode) {
                    if (canSelectThisJob) {
                      toggleJobSelection(job.id);
                    }
                  } else {
                    navigate(`/jobs/${job.id}/messages`);
                  }
                }}
              >
                {/* Avatar / Checkbox */}
                {canSelect ? (
                  <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleJobSelection(job.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5"
                    />
                  </div>
                ) : vehicle ? (
                  <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center">
                    <CarBrandLogo brand={vehicle.brand} size="lg" className="text-primary" />
                  </div>
                ) : (
                  <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isSelectionMode && !canSelectThisJob
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {initials}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {!isMechanic && (
                        <h4 className="font-semibold text-foreground truncate">
                          {job.customerName}
                        </h4>
                      )}
                      {vehicle && (
                        <LicensePlate plateNumber={vehicle.licensePlate} size="sm" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {lastMessage && new Date(lastMessage.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  {vehicle ? (
                    <div className="flex items-center gap-1.5 mb-1">
                      <CarBrandLogo brand={vehicle.brand} size="sm" className="text-primary/70" />
                      <p className="text-xs text-primary/80 font-medium truncate">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 mb-1">No vehicle assigned</p>
                  )}
                  {lastMessage && sender && sender.fullName ? (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-5 w-5 flex-shrink-0">
                        {sender.email && getUserAvatarUrl(sender.email) && (
                          <AvatarImage src={getUserAvatarUrl(sender.email)} alt={sender.fullName} />
                        )}
                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                          {sender.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <p className={`text-sm truncate flex-1 ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        <span className={unreadCount > 0 ? 'text-muted-foreground' : ''}>{sender.fullName}:</span>{' '}
                        {(lastMessage.translations?.[language] || lastMessage.originalText) || (lastMessage.videoUrl ? '🎥 Video' : lastMessage.audioUrl ? '🎤 Audio' : lastMessage.imageUrl ? '📷 Image' : '')}
                      </p>
                    </div>
                  ) : lastMessage ? (
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {(lastMessage.translations?.[language] || lastMessage.originalText) || (lastMessage.videoUrl ? '🎥 Video' : lastMessage.audioUrl ? '🎤 Audio' : lastMessage.imageUrl ? '📷 Image' : '')}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  )}
                </div>

                {/* Status indicators */}
                {isSelectionMode && !canSelectThisJob && (
                  <span className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                )}

                {/* Unread indicator dot */}
                {!isSelectionMode && unreadCount > 0 && (
                  <div className="absolute bottom-4 right-4 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-lg mb-2">{t('messages.noMessages')}</h3>
            <p className="text-muted-foreground text-sm">
              Messages will appear here when you start a conversation on a job
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
