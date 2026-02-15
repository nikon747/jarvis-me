import { RefreshCw, MessageSquare, CheckSquare, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StatsPanel = ({ stats, onRefresh }) => {
  const statCards = [
    {
      label: 'TOTAL CONVERSATIONS',
      value: stats?.total_conversations || 0,
      icon: MessageSquare,
      color: 'neon-blue',
    },
    {
      label: 'TOTAL TASKS',
      value: stats?.total_tasks || 0,
      icon: CheckSquare,
      color: 'alert-amber',
    },
    {
      label: 'COMPLETED TASKS',
      value: stats?.completed_tasks || 0,
      icon: Activity,
      color: 'alert-green',
    },
    {
      label: 'PENDING TASKS',
      value: stats?.pending_tasks || 0,
      icon: Zap,
      color: 'alert-red',
    },
  ];

  return (
    <div className="flex-1 flex flex-col" data-testid="stats-panel">
      {/* Header */}
      <header className="p-6 border-b border-neon-blue/10 glass-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-rajdhani text-xl font-bold tracking-wide text-foreground">
              SYSTEM DIAGNOSTICS
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              STATUS: {stats?.status || 'CHECKING...'}
            </p>
          </div>
          
          <Button
            onClick={onRefresh}
            className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 font-orbitron text-xs tracking-widest"
            data-testid="refresh-stats-btn"
          >
            <RefreshCw size={16} className="mr-2" />
            REFRESH
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="glass-panel hud-border p-6 group hover:border-neon-blue/30 transition-colors"
                  data-testid={`stat-card-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">
                        {stat.label}
                      </p>
                      <p className={`text-4xl font-orbitron font-bold text-${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 bg-${stat.color}/10 text-${stat.color}`}>
                      <Icon size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* System Info */}
          <div className="glass-panel hud-border p-6">
            <h3 className="font-orbitron text-sm tracking-widest text-neon-blue mb-4">
              SYSTEM INFORMATION
            </h3>
            
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center py-2 border-b border-neon-blue/10">
                <span className="text-muted-foreground">AI MODEL</span>
                <span className="text-alert-green">GPT-5.2 OPERATIONAL</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neon-blue/10">
                <span className="text-muted-foreground">VOICE ENGINE</span>
                <span className="text-alert-green">WHISPER + TTS ACTIVE</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neon-blue/10">
                <span className="text-muted-foreground">DATABASE</span>
                <span className="text-alert-green">MONGODB CONNECTED</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">SYSTEM STATUS</span>
                <span className="text-alert-green flex items-center gap-2">
                  <span className="w-2 h-2 bg-alert-green rounded-full animate-pulse" />
                  ALL SYSTEMS NOMINAL
                </span>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="mt-6 glass-panel hud-border p-6">
            <h3 className="font-orbitron text-sm tracking-widest text-neon-blue mb-4">
              ACTIVE CAPABILITIES
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'Voice Input',
                'Voice Output',
                'Task Management',
                'Code Assistance',
                'General Q&A',
                'Conversation History',
                'Multi-language',
                'Real-time Processing'
              ].map((capability, index) => (
                <div 
                  key={index}
                  className="p-3 bg-neon-blue/5 border border-neon-blue/20 text-center"
                >
                  <span className="text-xs font-mono text-neon-blue/80 tracking-wide">
                    {capability.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
