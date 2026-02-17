import React, { useState, useEffect } from 'react';
import { Check, CheckCheck, ChevronDown } from 'lucide-react';
import { getUserById } from '@/services/firestoreService';
import { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ReadReceiptIndicatorProps {
  senderId: string;
  readBy?: string[];
  createdAt: string;
  className?: string;
}

interface ReaderInfo {
  userId: string;
  user: User;
}

export function ReadReceiptIndicator({
  senderId,
  readBy = [],
  createdAt,
  className,
}: ReadReceiptIndicatorProps) {
  const [readers, setReaders] = useState<ReaderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReaders = async () => {
      if (!readBy || readBy.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const readerPromises = readBy
          .filter((id) => id !== senderId) // Exclude sender from reader list
          .map(async (userId) => {
            const user = await getUserById(userId);
            return user ? { userId, user } : null;
          });

        const readerResults = await Promise.all(readerPromises);
        const validReaders = readerResults.filter(
          (r): r is ReaderInfo => r !== null
        );
        setReaders(validReaders);
      } catch (error) {
        console.error('Error loading readers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReaders();
  }, [readBy, senderId]);

  const senderHasSeenIt = readBy.includes(senderId);
  const isRead = readers.length > 0 && senderHasSeenIt; // Only show read receipts if sender has also seen the message

  // Group readers by role
  const readersByRole = readers.reduce(
    (acc, reader) => {
      const role = reader.user.role;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(reader.user);
      return acc;
    },
    {} as Record<string, User[]>
  );

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    office_staff: 'Office',
    mechanic: 'Mechanic',
  };

  if (isLoading) {
    return <div className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <Check className="h-3 w-3" />
    </div>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1 text-xs transition-colors hover:text-foreground',
            isRead ? 'text-primary' : 'text-muted-foreground',
            className
          )}
        >
          {isRead ? (
            <CheckCheck className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          {isRead && readers.length > 0 && (
            <>
              <span className="text-[10px]">
                {readers.length}
              </span>
              <ChevronDown className="h-2.5 w-2.5" />
            </>
          )}
        </button>
      </PopoverTrigger>

      {isRead && readers.length > 0 && (
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Read by:</h4>
            <div className="space-y-2">
              {Object.entries(readersByRole).map(([role, users]) => (
                <div key={role} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {roleLabels[role] || role}
                  </p>
                  <ul className="space-y-0.5 pl-2">
                    {users.map((user) => (
                      <li key={user.id} className="text-xs">
                        {user.fullName}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
