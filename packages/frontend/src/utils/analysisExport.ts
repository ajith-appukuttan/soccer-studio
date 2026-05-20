import { SoccerAnalysis, AnalysisSummary } from '@/services/analysisService';

/**
 * Export analysis results to CSV format
 */
export function exportAnalysisToCSV(
  analyses: SoccerAnalysis[],
  summary: AnalysisSummary | null,
  videoTitle: string = 'Soccer Analysis'
): void {
  if (!analyses.length) {
    throw new Error('No analysis data to export');
  }

  // Create CSV headers
  const headers = [
    'Timestamp (s)',
    'Phase',
    'Possession',
    'Players Total',
    'Home Players',
    'Away Players',
    'Home Formation',
    'Away Formation',
    'Formation Confidence',
    'Key Events',
    'Tactical Notes',
    'Analysis Confidence'
  ];

  // Convert analysis data to CSV rows
  const rows = analyses.map(analysis => {
    const homeFormation = analysis.formations.find(f => f.team === 'home');
    const awayFormation = analysis.formations.find(f => f.team === 'away');
    
    return [
      analysis.timestamp.toString(),
      analysis.insights.phase || '',
      analysis.insights.possession || '',
      analysis.players.length.toString(),
      analysis.players.filter(p => p.team === 'home').length.toString(),
      analysis.players.filter(p => p.team === 'away').length.toString(),
      homeFormation?.formation || '',
      awayFormation?.formation || '',
      Math.round((homeFormation?.confidence || 0) * 100).toString() + '%',
      analysis.insights.keyEvents.join('; '),
      analysis.insights.tacticalNotes.join('; '),
      Math.round(analysis.confidence * 100).toString() + '%'
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Add summary section if available
  let fullContent = csvContent;
  if (summary) {
    fullContent += '\n\n--- SUMMARY ---\n';
    fullContent += `Home Possession,%${summary.possessionStats.home}\n`;
    fullContent += `Away Possession,%${summary.possessionStats.away}\n`;
    
    if (Object.keys(summary.dominantFormations).length > 0) {
      fullContent += '\n--- DOMINANT FORMATIONS ---\n';
      Object.entries(summary.dominantFormations).forEach(([team, formation]) => {
        fullContent += `${team.charAt(0).toUpperCase() + team.slice(1)},"${formation}"\n`;
      });
    }

    if (summary.keyMoments.length > 0) {
      fullContent += '\n--- KEY MOMENTS ---\n';
      summary.keyMoments.forEach(moment => {
        fullContent += `${moment.timestamp}s,"${moment.event}",${Math.round(moment.importance * 100)}%\n`;
      });
    }

    if (summary.tacticalTrends.length > 0) {
      fullContent += '\n--- TACTICAL TRENDS ---\n';
      summary.tacticalTrends.forEach(trend => {
        fullContent += `"${trend}"\n`;
      });
    }
  }

  // Download CSV file
  downloadFile(fullContent, `${videoTitle}_analysis_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

/**
 * Export analysis results to JSON format
 */
export function exportAnalysisToJSON(
  analyses: SoccerAnalysis[],
  summary: AnalysisSummary | null,
  videoTitle: string = 'Soccer Analysis'
): void {
  if (!analyses.length) {
    throw new Error('No analysis data to export');
  }

  const exportData = {
    metadata: {
      videoTitle,
      exportDate: new Date().toISOString(),
      totalAnalyses: analyses.length,
      timeRange: {
        start: Math.min(...analyses.map(a => a.timestamp)),
        end: Math.max(...analyses.map(a => a.timestamp)),
      }
    },
    summary: summary || null,
    analyses: analyses.map(analysis => ({
      timestamp: analysis.timestamp,
      confidence: analysis.confidence,
      players: analysis.players.map(player => ({
        team: player.team,
        jersey: player.jersey,
        position: player.position,
        confidence: player.confidence
      })),
      formations: analysis.formations.map(formation => ({
        team: formation.team,
        formation: formation.formation,
        confidence: formation.confidence,
        playerCount: formation.players.length
      })),
      insights: {
        phase: analysis.insights.phase,
        possession: analysis.insights.possession,
        keyEvents: analysis.insights.keyEvents,
        tacticalNotes: analysis.insights.tacticalNotes
      }
    }))
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, `${videoTitle}_analysis_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

/**
 * Export tactical report as formatted text
 */
export function exportTacticalReport(
  analyses: SoccerAnalysis[],
  summary: AnalysisSummary | null,
  videoTitle: string = 'Soccer Analysis'
): void {
  if (!analyses.length) {
    throw new Error('No analysis data to export');
  }

  let report = `SOCCER TACTICAL ANALYSIS REPORT\n`;
  report += `=====================================\n\n`;
  report += `Video: ${videoTitle}\n`;
  report += `Analysis Date: ${new Date().toLocaleDateString()}\n`;
  report += `Total Frames Analyzed: ${analyses.length}\n`;
  report += `Time Range: ${Math.min(...analyses.map(a => a.timestamp))}s - ${Math.max(...analyses.map(a => a.timestamp))}s\n\n`;

  // Executive Summary
  if (summary) {
    report += `EXECUTIVE SUMMARY\n`;
    report += `=================\n\n`;
    
    report += `Possession Statistics:\n`;
    report += `- Home Team: ${summary.possessionStats.home}%\n`;
    report += `- Away Team: ${summary.possessionStats.away}%\n\n`;

    if (Object.keys(summary.dominantFormations).length > 0) {
      report += `Dominant Formations:\n`;
      Object.entries(summary.dominantFormations).forEach(([team, formation]) => {
        report += `- ${team.charAt(0).toUpperCase() + team.slice(1)}: ${formation}\n`;
      });
      report += `\n`;
    }

    if (summary.tacticalTrends.length > 0) {
      report += `Key Tactical Insights:\n`;
      summary.tacticalTrends.forEach((trend, index) => {
        report += `${index + 1}. ${trend}\n`;
      });
      report += `\n`;
    }

    if (summary.keyMoments.length > 0) {
      report += `Critical Moments:\n`;
      summary.keyMoments.slice(0, 10).forEach((moment, index) => {
        report += `${index + 1}. ${Math.round(moment.timestamp)}s - ${moment.event}\n`;
      });
      report += `\n`;
    }
  }

  // Detailed Analysis
  report += `DETAILED FRAME ANALYSIS\n`;
  report += `=======================\n\n`;

  // Group analyses by phase for better readability
  const phaseGroups = analyses.reduce((groups, analysis) => {
    const phase = analysis.insights.phase;
    if (!groups[phase]) groups[phase] = [];
    groups[phase].push(analysis);
    return groups;
  }, {} as Record<string, SoccerAnalysis[]>);

  Object.entries(phaseGroups).forEach(([phase, phaseAnalyses]) => {
    report += `${phase.toUpperCase()} PHASE (${phaseAnalyses.length} frames)\n`;
    report += `-`.repeat(40) + `\n\n`;

    // Show key formations for this phase
    const formations = phaseAnalyses.flatMap(a => a.formations);
    const formationCounts = formations.reduce((counts, f) => {
      const key = `${f.team}-${f.formation}`;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    if (Object.keys(formationCounts).length > 0) {
      report += `Common Formations:\n`;
      Object.entries(formationCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([formation, count]) => {
          const [team, form] = formation.split('-');
          report += `- ${team}: ${form} (${count} times)\n`;
        });
      report += `\n`;
    }

    // Show key events for this phase
    const keyEvents = phaseAnalyses.flatMap(a => a.insights.keyEvents);
    if (keyEvents.length > 0) {
      const uniqueEvents = Array.from(new Set(keyEvents)).slice(0, 5);
      report += `Notable Events:\n`;
      uniqueEvents.forEach(event => {
        report += `- ${event}\n`;
      });
      report += `\n`;
    }

    report += `\n`;
  });

  // Player Distribution Analysis
  const allPlayers = analyses.flatMap(a => a.players);
  const avgPlayersPerFrame = allPlayers.length / analyses.length;
  const avgHomePlayersPerFrame = allPlayers.filter(p => p.team === 'home').length / analyses.length;
  const avgAwayPlayersPerFrame = allPlayers.filter(p => p.team === 'away').length / analyses.length;

  report += `PLAYER ANALYSIS\n`;
  report += `===============\n\n`;
  report += `Average Players per Frame: ${avgPlayersPerFrame.toFixed(1)}\n`;
  report += `Average Home Players: ${avgHomePlayersPerFrame.toFixed(1)}\n`;
  report += `Average Away Players: ${avgAwayPlayersPerFrame.toFixed(1)}\n\n`;

  // Confidence metrics
  const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
  report += `ANALYSIS QUALITY\n`;
  report += `================\n\n`;
  report += `Average Analysis Confidence: ${Math.round(avgConfidence * 100)}%\n`;
  report += `High Confidence Frames (>70%): ${analyses.filter(a => a.confidence > 0.7).length}\n`;
  report += `Low Confidence Frames (<50%): ${analyses.filter(a => a.confidence < 0.5).length}\n\n`;

  report += `\nReport generated by Soccer Training AI Analysis System\n`;
  report += `${new Date().toISOString()}\n`;

  downloadFile(report, `${videoTitle}_tactical_report_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}