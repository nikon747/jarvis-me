import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';

export const TaskPanel = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  });
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const completed = filter === 'completed' ? true : filter === 'pending' ? false : undefined;
      const data = await api.getTasks(completed);
      setTasks(data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      await api.createTask(newTask);
      toast.success('Task created');
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
      setShowAddTask(false);
      loadTasks();
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const toggleTaskComplete = async (task) => {
    try {
      await api.updateTask(task.id, { completed: !task.completed });
      loadTasks();
      toast.success(task.completed ? 'Task marked as pending' : 'Task completed');
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.deleteTask(id);
      toast.success('Task deleted');
      loadTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-alert-red border-alert-red';
      case 'medium': return 'text-alert-amber border-alert-amber';
      case 'low': return 'text-alert-green border-alert-green';
      default: return 'text-muted-foreground border-muted-foreground';
    }
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    return {
      text: date.toLocaleDateString(),
      isOverdue
    };
  };

  return (
    <div className="flex-1 flex flex-col" data-testid="task-panel">
      {/* Header */}
      <header className="p-6 border-b border-neon-blue/10 glass-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-rajdhani text-xl font-bold tracking-wide text-foreground">
              TASK MANAGEMENT
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              {tasks.length} tasks • {tasks.filter(t => t.completed).length} completed
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32 bg-black/50 border-neon-blue/30 text-sm font-mono" data-testid="task-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-obsidian border-neon-blue/30">
                <SelectItem value="all">ALL</SelectItem>
                <SelectItem value="pending">PENDING</SelectItem>
                <SelectItem value="completed">COMPLETED</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => setShowAddTask(true)}
              className="bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 font-orbitron text-xs tracking-widest"
              data-testid="add-task-btn"
            >
              <Plus size={16} className="mr-2" />
              NEW TASK
            </Button>
          </div>
        </div>
      </header>

      {/* Add Task Form */}
      {showAddTask && (
        <div className="p-6 border-b border-neon-blue/10 bg-obsidian/50">
          <div className="max-w-2xl space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block">TASK TITLE</label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title..."
                className="bg-black/50 border-neon-blue/30 font-barlow"
                data-testid="task-title-input"
              />
            </div>
            
            <div>
              <label className="text-xs font-mono text-muted-foreground mb-2 block">DESCRIPTION</label>
              <Input
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Optional description..."
                className="bg-black/50 border-neon-blue/30 font-barlow"
                data-testid="task-description-input"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-mono text-muted-foreground mb-2 block">PRIORITY</label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger className="bg-black/50 border-neon-blue/30 font-mono" data-testid="task-priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-obsidian border-neon-blue/30">
                    <SelectItem value="low">LOW</SelectItem>
                    <SelectItem value="medium">MEDIUM</SelectItem>
                    <SelectItem value="high">HIGH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-xs font-mono text-muted-foreground mb-2 block">DUE DATE</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="bg-black/50 border-neon-blue/30 font-mono"
                  data-testid="task-due-date-input"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddTask}
                className="bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 font-orbitron text-xs"
                data-testid="save-task-btn"
              >
                CREATE TASK
              </Button>
              <Button
                onClick={() => setShowAddTask(false)}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground font-orbitron text-xs"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="flex justify-center gap-1">
                <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
                <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
                <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
              </div>
              <p className="text-muted-foreground font-mono text-sm mt-4">LOADING TASKS...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                <Check size={32} className="text-neon-blue/50" />
              </div>
              <h3 className="font-orbitron text-lg text-muted-foreground mb-2">
                {filter === 'completed' ? 'NO COMPLETED TASKS' : filter === 'pending' ? 'NO PENDING TASKS' : 'NO TASKS'}
              </h3>
              <p className="text-sm text-muted-foreground/70 font-barlow">
                {filter === 'all' ? 'Create a new task to get started' : 'No tasks match this filter'}
              </p>
            </div>
          ) : (
            tasks.map((task) => {
              const dueDate = formatDueDate(task.due_date);
              return (
                <div
                  key={task.id}
                  className={`p-4 glass-panel hud-border group transition-all hover:border-neon-blue/30 ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                  data-testid={`task-${task.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTaskComplete(task)}
                      className={`flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                        task.completed 
                          ? 'bg-alert-green/20 border-alert-green text-alert-green' 
                          : 'border-neon-blue/30 hover:border-neon-blue'
                      }`}
                      data-testid={`toggle-task-${task.id}`}
                    >
                      {task.completed && <Check size={14} />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className={`font-rajdhani font-semibold ${
                          task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}>
                          {task.title}
                        </h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 border ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground font-barlow mb-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {dueDate && (
                          <span className={`flex items-center gap-1 ${dueDate.isOverdue && !task.completed ? 'text-alert-red' : ''}`}>
                            {dueDate.isOverdue && !task.completed && <AlertCircle size={12} />}
                            <Calendar size={12} />
                            {dueDate.text}
                          </span>
                        )}
                        <span className="font-mono">
                          Created {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-alert-red transition-all p-2"
                      data-testid={`delete-task-${task.id}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TaskPanel;
