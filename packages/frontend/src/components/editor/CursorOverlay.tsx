import { useEffect, useState } from 'react';
import { Box, Text } from '@mantine/core';
import { useCollaborationStore } from '@/stores/collaborationStore';

interface CursorOverlayProps {
  containerRef?: React.RefObject<HTMLElement>;
  onCursorMove?: (position: { x: number; y: number }) => void;
}

interface RemoteCursor {
  id: string;
  userId: string;
  user: { firstName: string; lastName: string; color: string };
  position: { x: number; y: number };
  lastMoved: number;
}

export function CursorOverlay({ containerRef, onCursorMove }: CursorOverlayProps) {
  const { cursors, sendCursorPosition } = useCollaborationStore();
  const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);

  // Convert Map to array for rendering
  const remoteCursors: RemoteCursor[] = Array.from(cursors.entries()).map(([id, cursor]) => ({
    id,
    ...cursor,
  }));

  // Handle mouse movement within the container
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    let throttleTimer: NodeJS.Timeout | null = null;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      setLocalPosition(position);
      onCursorMove?.(position);

      // Throttle cursor position updates to avoid spam
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }

      throttleTimer = setTimeout(() => {
        // Only send if cursor is within bounds
        if (
          position.x >= 0 &&
          position.y >= 0 &&
          position.x <= rect.width &&
          position.y <= rect.height
        ) {
          sendCursorPosition(position);
        }
      }, 50); // 20 FPS
    };

    const handleMouseLeave = () => {
      setLocalPosition(null);
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [containerRef, onCursorMove, sendCursorPosition]);

  return (
    <Box
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {/* Remote cursors */}
      {remoteCursors.map((cursor) => (
        <RemoteCursorComponent
          key={cursor.id}
          cursor={cursor}
        />
      ))}
    </Box>
  );
}

interface RemoteCursorComponentProps {
  cursor: RemoteCursor;
}

function RemoteCursorComponent({ cursor }: RemoteCursorComponentProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Hide cursor after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      const timeSinceLastMove = Date.now() - cursor.lastMoved;
      if (timeSinceLastMove > 3000) {
        setIsVisible(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [cursor.lastMoved]);

  // Reset visibility when cursor moves
  useEffect(() => {
    setIsVisible(true);
  }, [cursor.position.x, cursor.position.y]);

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      style={{
        position: 'absolute',
        left: cursor.position.x,
        top: cursor.position.y,
        transform: 'translate(-2px, -2px)',
        pointerEvents: 'none',
        zIndex: 1001,
        transition: 'all 0.1s ease-out',
      }}
    >
      {/* Cursor pointer */}
      <Box
        style={{
          position: 'relative',
          width: 0,
          height: 0,
        }}
      >
        {/* Cursor arrow */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))',
          }}
        >
          <path
            d="M5.5 3L19 12L12 14L9 19.5L5.5 3Z"
            fill={cursor.user.color}
            stroke="white"
            strokeWidth="1"
          />
        </svg>

        {/* User name label */}
        <Box
          style={{
            position: 'absolute',
            top: 20,
            left: 8,
            backgroundColor: cursor.user.color,
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {cursor.user.firstName} {cursor.user.lastName}
        </Box>
      </Box>
    </Box>
  );
}

// Alternative simplified cursor component for performance-critical scenarios
export function SimpleCursorOverlay({ containerRef }: CursorOverlayProps) {
  const { cursors } = useCollaborationStore();

  return (
    <Box
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {Array.from(cursors.values()).map((cursor, index) => (
        <Box
          key={index}
          style={{
            position: 'absolute',
            left: cursor.position.x - 6,
            top: cursor.position.y - 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: cursor.user.color,
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            transition: 'all 0.1s ease-out',
          }}
        />
      ))}
    </Box>
  );
}