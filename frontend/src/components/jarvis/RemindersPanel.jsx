import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Bell, BellRing, Clock, Calendar, RefreshCw, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';

export const RemindersPanel = ({ onReminderDue, voiceEnabled = true }) => {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    reminder_time: '',
    repeat: 'none'
  });

  useEffect(() => {
    loadReminders();
    
    // Check for due reminders every 30 seconds
    const interval = setInterval(checkDueReminders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadReminders = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReminders();
      setReminders(data);
    } catch (err) {
      toast.error('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const checkDueReminders = useCallback(async () => {
    try {
      const dueReminders = await api.getDueReminders();
      if (dueReminders.length > 0) {
        dueReminders.forEach(reminder => {
          toast.info(`Reminder: ${reminder.title}`, {
            description: reminder.description,
            duration: 10000,
            icon: <BellRing className="text-alert-amber" />,
          });
          
          // Trigger voice alert if enabled
          if (voiceEnabled && onReminderDue) {
            onReminderDue(reminder);
          }
        });
        loadReminders();
      }
    } catch (err) {
      console.error('Failed to check due reminders:', err);
    }
  }, [voiceEnabled, onReminderDue]);

  const handleAddReminder = async () => {
    if (!newReminder.title.trim()) {
      toast.error('Reminder title is required');
      return;
    }
    if (!newReminder.reminder_time) {
      toast.error('Reminder time is required');
      return;
    }

    try {
      // Convert to ISO format
      const reminderTime = new Date(newReminder.reminder_time).toISOString();
      await api.createReminder({
        ...newReminder,
        reminder_time: reminderTime
      });
      toast.success('Reminder created');
      setNewReminder({ title: '', description: '', reminder_time: '', repeat: 'none' });
      setShowAddReminder(false);
      loadReminders();
    } catch (err) {
      toast.error('Failed to create reminder');
    }
  };

  const deleteReminder = async (id) => {
    try {
      await api.deleteReminder(id);
      toast.success('Reminder deleted');
      loadReminders();
    } catch (err) {
      toast.error('Failed to delete reminder');
    }
  };

  const toggleReminder = async (reminder) => {
    try {
      await api.updateReminder(reminder.id, { is_active: !reminder.is_active });
      loadReminders();
    } catch (err) {
      toast.error('Failed to update reminder');
    }
  };

  const formatReminderTime = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) return 'Overdue';
    if (diff < 60000) return 'Less than a minute';
    if (diff < 3600000) return `${Math.round(diff / 60000)} minutes`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)} hours`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRepeatLabel = (repeat) => {
    switch (repeat) {
      case 'daily': return 'DAILY';
      case 'weekly': return 'WEEKLY';
      case 'monthly': return 'MONTHLY';
      default: return 'ONCE';
    }
  };

  return (
    <div className="flex-1 flex flex-col" data-testid="reminders-panel">
      {/* Header */}
      <header className="p-6 border-b border-neon-blue/10 glass-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-rajdhani text-xl font-bold tracking-wide text-foreground">
              REMINDERS
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              {reminders.filter(r => r.is_active && !r.triggered).length} active reminders
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={checkDueReminders}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-neon-blue"
              data-testid="check-reminders-btn"
            >
              <RefreshCw size={16} />
            </Button>
            <Button
              onClick={() => setShowAddReminder(true)}
              className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 font-orbitron text-xs tracking-widest"
              data-testid="add-reminder-btn"
            >
              <Plus size={16} className="mr-2" />
              NEW REMINDER
            </Button>
          </div>
        </div>
      </header>

      {/* Add Reminder Form */}
      {showAddReminder && (
        <div className="p-6 border-b border-neon-blue/10 bg-obsidian/50">
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block">REMINDER TITLE</label>
              <Input
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                placeholder="What should I remind you about?"
                className="bg-black/50 border-neon-blue/30 font-barlow"
                data-testid="reminder-title-input"
              />
            </div>
            
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block">DESCRIPTION (OPTIONAL)</label>
              <Input
                value={newReminder.description}
                onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                placeholder="Additional details..."
                className="bg-black/50 border-neon-blue/30 font-barlow"
                data-testid="reminder-description-input"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-mono text-muted-foreground mb-2 block">REMIND AT</label>
                <Input
                  type="datetime-local"
                  value={newReminder.reminder_time}
                  onChange={(e) => setNewReminder({ ...newReminder, reminder_time: e.target.value })}
                  className="bg-black/50 border-neon-blue/30 font-mono"
                  data-testid="reminder-time-input"
                />
              </div>
              
              <div className="flex-1">
                <label className="text-xs font-mono text-muted-foreground mb-2 block">REPEAT</label>
                <Select value={newReminder.repeat} onValueChange={(v) => setNewReminder({ ...newReminder, repeat: v })}>
                  <SelectTrigger className="bg-black/50 border-neon-blue/30 font-mono" data-testid="reminder-repeat-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-obsidian border-neon-blue/30">
                    <SelectItem value="none">ONCE</SelectItem>
                    <SelectItem value="daily">DAILY</SelectItem>
                    <SelectItem value="weekly">WEEKLY</SelectItem>
                    <SelectItem value="monthly">MONTHLY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddReminder}
                className="bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 font-orbitron text-xs"
                data-testid="save-reminder-btn"
              >
                <Bell size={14} className="mr-2" />
                SET REMINDER
              </Button>
              <Button
                onClick={() => setShowAddReminder(false)}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground font-orbitron text-xs"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reminders List */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="flex justify-center gap-1">
                <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
                <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
                <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
              </div>
              <p className="text-muted-foreground font-mono text-sm mt-4">LOADING REMINDERS...</p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                <Bell size={32} className="text-neon-blue/50" />
              </div>
              <h3 className="font-orbitron text-lg text-muted-foreground mb-2">
                NO REMINDERS SET
              </h3>
              <p className="text-sm text-muted-foreground/70 font-barlow">
                Create a reminder to get voice alerts
              </p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 glass-panel hud-border group transition-all hover:border-neon-blue/30 ${
                  reminder.triggered || !reminder.is_active ? 'opacity-50' : ''
                }`}
                data-testid={`reminder-${reminder.id}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <button
                    onClick={() => toggleReminder(reminder)}
                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center transition-colors ${
                      reminder.is_active && !reminder.triggered
                        ? 'bg-alert-amber/20 text-alert-amber border border-alert-amber/30'
                        : 'bg-muted/20 text-muted-foreground border border-muted-foreground/30'
                    }`}
                    data-testid={`toggle-reminder-${reminder.id}`}
                  >
                    {reminder.is_active && !reminder.triggered ? <BellRing size={18} /> : <Bell size={18} />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={`font-rajdhani font-semibold ${
                        reminder.triggered ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}>
                        {reminder.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 border border-neon-blue/30 text-neon-blue">
                        {getRepeatLabel(reminder.repeat)}
                      </span>
                      {voiceEnabled && (
                        <Volume2 size={12} className="text-alert-green" title="Voice alert enabled" />
                      )}
                    </div>
                    
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground font-barlow mb-2">
                        {reminder.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className={`flex items-center gap-1 ${
                        new Date(reminder.reminder_time) < new Date() && !reminder.triggered
                          ? 'text-alert-red'
                          : ''
                      }`}>
                        <Clock size={12} />
                        {formatReminderTime(reminder.reminder_time)}
                      </span>
                      {reminder.triggered && (
                        <span className="text-alert-green font-mono">TRIGGERED</span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-alert-red transition-all p-2"
                    data-testid={`delete-reminder-${reminder.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RemindersPanel;
