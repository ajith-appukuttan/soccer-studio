import {
  Stack,
  Paper,
  Text,
  Button,
  Group,
  Textarea,
  ScrollArea,
  Avatar,
  ActionIcon,
  Divider,
  Badge,
} from '@mantine/core';
import { IconPlus, IconArrowRight as IconCornerDownRight, IconTrash, IconCircle as IconPin } from '@tabler/icons-react';
import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTime, generateUUID } from '@shared/utils';
import type { Comment } from '@shared/types';
import classes from './CommentsPanel.module.css';

export function CommentsPanel() {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  
  const {
    comments,
    currentTime,
    addComment,
    deleteComment,
    selectComment,
    selectedComment,
  } = useEditorStore();
  
  const { user } = useAuthStore();

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: generateUUID(),
      videoId: 'current-video', // TODO: Get from video store
      timestamp: currentTime,
      content: newComment.trim(),
      authorId: user.id,
      parentId: replyTo,
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addComment(comment);
    setNewComment('');
    setReplyTo(null);
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
  };

  const handleReply = (commentId: string) => {
    setReplyTo(commentId);
  };

  const handleJumpToTime = (timestamp: number) => {
    // TODO: Implement jump to time
    selectComment(null);
  };

  // Group comments by timestamp and thread
  const groupedComments = comments.reduce((acc, comment) => {
    if (!comment.parentId) {
      const timestamp = Math.floor(comment.timestamp);
      if (!acc[timestamp]) {
        acc[timestamp] = { parent: comment, replies: [] };
      } else {
        acc[timestamp] = { parent: comment, replies: acc[timestamp].replies };
      }
    } else {
      // Find parent and add as reply
      const parentTimestamp = Object.keys(acc).find(ts => 
        acc[parseInt(ts)].parent.id === comment.parentId
      );
      if (parentTimestamp) {
        acc[parseInt(parentTimestamp)].replies.push(comment);
      }
    }
    return acc;
  }, {} as Record<number, { parent: Comment; replies: Comment[] }>);

  const renderComment = (comment: Comment, isReply = false) => {
    return (
      <div
        key={comment.id}
        className={`${classes.comment} ${isReply ? classes.reply : ''} ${
          selectedComment === comment.id ? classes.selected : ''
        }`}
        onClick={() => selectComment(comment.id)}
      >
        <Group gap="xs" mb="xs">
          <Avatar size="sm" radius="xl">
            {comment.authorId.charAt(0).toUpperCase()}
          </Avatar>
          
          <div style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Text size="xs" fw={500}>
                {comment.authorId} {/* TODO: Get actual user name */}
              </Text>
              <Text size="xs" c="dimmed">
                {formatTime(comment.timestamp)}
              </Text>
              {comment.resolved && (
                <Badge size="xs" color="green" variant="filled">
                  Resolved
                </Badge>
              )}
            </Group>
          </div>
          
          <Group gap="xs">
            {!isReply && (
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReply(comment.id);
                }}
              >
                <IconCornerDownRight size={12} />
              </ActionIcon>
            )}
            
            <ActionIcon
              size="xs"
              variant="subtle"
              onClick={(e) => {
                e.stopPropagation();
                handleJumpToTime(comment.timestamp);
              }}
            >
              <IconPin size={12} />
            </ActionIcon>
            
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteComment(comment.id);
              }}
            >
              <IconTrash size={12} />
            </ActionIcon>
          </Group>
        </Group>
        
        <Text size="sm">{comment.content}</Text>
        
        <Text size="xs" c="dimmed" mt="xs">
          {new Date(comment.createdAt).toLocaleString()}
        </Text>
      </div>
    );
  };

  return (
    <Paper className={classes.container} p="sm" withBorder>
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={600}>
          Comments
        </Text>
        <Badge variant="light" size="sm">
          {comments.length}
        </Badge>
      </Group>

      {/* New Comment Form */}
      <div className={classes.newCommentForm}>
        {replyTo && (
          <Group gap="xs" mb="xs">
            <Text size="xs" c="dimmed">
              Replying to comment
            </Text>
            <Button
              size="xs"
              variant="subtle"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </Button>
          </Group>
        )}
        
        <Textarea
          placeholder={replyTo ? 'Write a reply...' : 'Add a comment at current time...'}
          value={newComment}
          onChange={(event) => setNewComment(event.currentTarget.value)}
          size="sm"
          minRows={2}
          maxRows={4}
          mb="xs"
        />
        
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            at {formatTime(currentTime)}
          </Text>
          <Button
            size="xs"
            disabled={!newComment.trim()}
            onClick={handleAddComment}
            leftSection={<IconPlus size={12} />}
          >
            {replyTo ? 'Reply' : 'Comment'}
          </Button>
        </Group>
      </div>

      <Divider my="sm" />

      {/* Comments List */}
      <ScrollArea className={classes.scrollArea}>
        {Object.keys(groupedComments).length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" mt="md">
            No comments yet. Add one at the current time!
          </Text>
        ) : (
          <Stack gap="sm">
            {Object.keys(groupedComments)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map((timestamp) => {
                const { parent, replies } = groupedComments[parseInt(timestamp)];
                return (
                  <div key={timestamp}>
                    {renderComment(parent)}
                    {replies.length > 0 && (
                      <div className={classes.repliesContainer}>
                        {replies.map((reply) => renderComment(reply, true))}
                      </div>
                    )}
                  </div>
                );
              })}
          </Stack>
        )}
      </ScrollArea>
    </Paper>
  );
}