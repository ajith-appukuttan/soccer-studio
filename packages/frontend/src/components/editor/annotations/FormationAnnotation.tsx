import { Group } from 'react-konva';
import { useEditorStore } from '@/stores/editorStore';
import { PlayerAnnotation } from './PlayerAnnotation';
import { LineAnnotation } from './LineAnnotation';
import type { FormationAnnotationSchema, PlayerAnnotationSchema, LineAnnotationSchema } from '@shared/types';
import { z } from 'zod';

interface FormationAnnotationProps {
  annotation: z.infer<typeof FormationAnnotationSchema>;
}

export function FormationAnnotation({ annotation }: FormationAnnotationProps) {
  const { selectedAnnotations, selectAnnotation } = useEditorStore();
  
  const isSelected = selectedAnnotations.includes(annotation.id);
  
  const handleClick = (e: any) => {
    e.cancelBubble = true;
    selectAnnotation(annotation.id, e.evt.ctrlKey || e.evt.metaKey);
  };

  // Create player annotations from formation data
  const playerAnnotations: z.infer<typeof PlayerAnnotationSchema>[] = annotation.players.map((player, index) => ({
    id: `${annotation.id}-player-${index}`,
    type: 'player' as const,
    timestamp: annotation.timestamp,
    authorId: annotation.authorId,
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt,
    position: player.position,
    playerNumber: player.number,
    team: player.team,
    style: {
      color: player.team === 'home' ? annotation.style.homeColor : annotation.style.awayColor,
      size: 20,
    },
  }));

  // Create formation lines if enabled
  const formationLines: z.infer<typeof LineAnnotationSchema>[] = [];
  
  if (annotation.style.showLines) {
    // Group players by team
    const homePlayers = annotation.players.filter(p => p.team === 'home');
    const awayPlayers = annotation.players.filter(p => p.team === 'away');
    
    // Create lines connecting players in formation
    const createFormationLines = (players: typeof homePlayers, lineColor: any) => {
      const lines: z.infer<typeof LineAnnotationSchema>[] = [];
      
      // Sort players by position (rough formation lines)
      const sortedPlayers = [...players].sort((a, b) => a.position.y - b.position.y);
      
      // Create horizontal lines for each formation row
      const rows = new Map<number, typeof players>();
      sortedPlayers.forEach(player => {
        const row = Math.round(player.position.y / 50) * 50; // Group by approximate rows
        if (!rows.has(row)) rows.set(row, []);
        rows.get(row)!.push(player);
      });
      
      rows.forEach((rowPlayers, rowY) => {
        if (rowPlayers.length > 1) {
          const sortedRowPlayers = rowPlayers.sort((a, b) => a.position.x - b.position.x);
          for (let i = 0; i < sortedRowPlayers.length - 1; i++) {
            lines.push({
              id: `${annotation.id}-line-${lines.length}`,
              type: 'line' as const,
              timestamp: annotation.timestamp,
              authorId: annotation.authorId,
              createdAt: annotation.createdAt,
              updatedAt: annotation.updatedAt,
              points: [sortedRowPlayers[i].position, sortedRowPlayers[i + 1].position],
              style: {
                strokeColor: lineColor,
                strokeWidth: 1,
                lineDash: [5, 5],
              },
            });
          }
        }
      });
      
      return lines;
    };
    
    formationLines.push(...createFormationLines(homePlayers, annotation.style.lineColor));
    formationLines.push(...createFormationLines(awayPlayers, annotation.style.lineColor));
  }

  return (
    <Group
      draggable={isSelected}
      onClick={handleClick}
    >
      {/* Render formation lines */}
      {formationLines.map((line, index) => (
        <LineAnnotation key={`line-${index}`} annotation={line} />
      ))}
      
      {/* Render players */}
      {playerAnnotations.map((player, index) => (
        <PlayerAnnotation key={`player-${index}`} annotation={player} />
      ))}
    </Group>
  );
}