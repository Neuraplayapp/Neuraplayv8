import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Plus, Edit3, Trash2, Moon, Sun, HelpCircle, X } from 'lucide-react';

interface Task {
  id: string;
  column: 'todo' | 'progress' | 'done';
  title: string;
  description: string;
  deadline: string;
  color: string;
  image: string | null;
}

interface TaskManagerProps {
  onClose?: () => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ onClose }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const formRef = useRef<HTMLFormElement>(null);

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Default tasks
      const defaultTasks: Task[] = [
        {
          id: "default1",
          column: "todo",
          title: "Complete your first learning game",
          description: "Start your learning journey by completing your first educational game!",
          deadline: new Date().toISOString(),
          color: "#3a86ff",
          image: null
        },
        {
          id: "default2",
          column: "todo",
          title: "Explore the playground",
          description: "Discover all the amazing games and activities available in the playground!",
          deadline: new Date().toISOString(),
          color: "#8338ec",
          image: null
        }
      ];
      setTasks(defaultTasks);
      localStorage.setItem('tasks', JSON.stringify(defaultTasks));
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    
    // Apply theme classes to the task manager container
    const container = document.querySelector('.task-manager-playground');
    if (container) {
      if (isDarkTheme) {
        container.classList.add('dark-theme');
        container.classList.remove('light-theme');
      } else {
        container.classList.add('light-theme');
        container.classList.remove('dark-theme');
      }
    }
  }, [isDarkTheme]);

  const getTasksByColumn = (column: string) => {
    return tasks.filter(task => task.column === column);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (draggedTask) {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === draggedTask 
            ? { ...task, column: targetColumn as 'todo' | 'progress' | 'done' }
            : task
        )
      );
      setDraggedTask(null);
      showConfirmationMessage('Task moved successfully! 🎉');
    }
  };

  const openModal = (columnType?: string) => {
    setIsEditMode(false);
    setCurrentTask(null);
    if (formRef.current) {
      formRef.current.reset();
    }
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setIsEditMode(true);
    setCurrentTask(task);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const taskData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      deadline: formData.get('deadline') as string,
      color: formData.get('color') as string,
      column: formData.get('column') as 'todo' | 'progress' | 'done'
    };

    if (isEditMode && currentTask) {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === currentTask.id 
            ? { ...task, ...taskData }
            : task
        )
      );
      showConfirmationMessage('Task updated successfully! 🎉');
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskData,
        image: null
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      showConfirmationMessage('Task created successfully! 🎉');
    }

    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentTask(null);
  };

  const deleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete));
      setTaskToDelete(null);
      setIsDeleteModalOpen(false);
      showConfirmationMessage('Task deleted successfully! 🗑️');
    }
  };

  const showConfirmationMessage = (message: string) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = getTasksByColumn('done').length;
    const inProgress = getTasksByColumn('progress').length;
    return { total, completed, inProgress };
  };

  const stats = getStats();

  return (
    <div className="task-manager-playground">
      {/* Theme and Help Toggles */}
      <div className="flex justify-end gap-2 mb-4">
        <button 
          className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
          onClick={() => setIsDarkTheme(!isDarkTheme)}
        >
          {isDarkTheme ? <Sun size={20} className="text-white" /> : <Moon size={20} className="text-white" />}
        </button>
        
        <button 
          className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
          onClick={() => setIsHelpModalOpen(true)}
        >
          <HelpCircle size={20} className="text-white" />
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Task Manager</h2>
        <p className="text-slate-300 text-sm">Manage your learning tasks with style</p>
        <div className="flex justify-center gap-4 mt-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-slate-400">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-slate-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
            <div className="text-sm text-slate-400">In Progress</div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {['todo', 'progress', 'done'].map(column => (
          <div 
            key={column}
            className="bg-black/20 border border-white/10 backdrop-blur-md rounded-xl p-3"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">
                {column === 'todo' && '📝 To Do'}
                {column === 'progress' && '🔄 In Progress'}
                {column === 'done' && '✅ Done'}
              </h3>
              <span className="bg-white/20 text-white px-2 py-1 rounded-full text-sm font-bold">
                {getTasksByColumn(column).length}
              </span>
            </div>
            <div className="space-y-2">
              {getTasksByColumn(column).map(task => (
                <div
                  key={task.id}
                  className={`bg-white/10 border border-white/20 rounded-lg p-2 cursor-pointer hover:bg-white/20 transition-all ${draggedTask === task.id ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  style={{ borderLeft: `4px solid ${task.color}` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white text-sm">{task.title}</h4>
                    <div className="flex gap-1">
                      <button 
                        className="p-1 rounded hover:bg-white/20 transition-all"
                        onClick={() => openEditModal(task)}
                      >
                        <Edit3 size={14} className="text-slate-300" />
                      </button>
                      <button 
                        className="p-1 rounded hover:bg-white/20 transition-all"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300 text-xs mb-2">{task.description}</p>
                  {task.image && (
                    <img src={task.image} alt="Task" className="w-full h-20 object-cover rounded mb-2" />
                  )}
                  <div className="text-xs text-slate-400">
                    📅 {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date'}
                  </div>
                </div>
              ))}
              <button 
                className="w-full p-2 border-2 border-dashed border-white/30 rounded-lg text-white/70 hover:border-white/50 hover:text-white transition-all flex items-center justify-center gap-2"
                onClick={() => openModal(column)}
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{isEditMode ? 'Edit Task' : 'New Task'}</h2>
              <button 
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
              <input type="hidden" name="column" value={currentTask?.column || 'todo'} />
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-white mb-2">Title</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  defaultValue={currentTask?.title || ''}
                  required 
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white/40"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  rows={3}
                  defaultValue={currentTask?.description || ''}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-white/40"
                />
              </div>
              
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-white mb-2">Deadline</label>
                <input 
                  type="datetime-local" 
                  id="deadline" 
                  name="deadline"
                  defaultValue={currentTask?.deadline || ''}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Task Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    id="color" 
                    name="color"
                    defaultValue={currentTask?.color || '#3a86ff'}
                    className="w-12 h-12 rounded-lg border border-white/20"
                  />
                  <span className="text-sm text-slate-300">Choose a color for your task</span>
                </div>
              </div>
              
              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
                {isEditMode ? 'Update Task' : 'Add Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Deletion</h3>
            <p className="text-slate-300 mb-6">Are you sure you want to delete this task?</p>
            <div className="flex gap-3">
              <button 
                className="flex-1 bg-slate-600 text-white font-bold py-3 rounded-lg hover:bg-slate-700 transition-all"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Task Manager Help</h3>
              <button 
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
                onClick={() => setIsHelpModalOpen(false)}
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <div className="space-y-4 text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">🎯 Getting Started</h4>
                <p>Welcome to your personal task manager! Here's how to make the most of it:</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">📝 Creating Tasks</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Click "Add Task" in any column to create a new task</li>
                  <li>Fill in the title, description, and deadline</li>
                  <li>Choose a color to organize your tasks visually</li>
                  <li>Tasks start in the "To Do" column by default</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">🔄 Managing Progress</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Drag and drop tasks between columns to update their status</li>
                  <li>Move tasks to "In Progress" when you start working on them</li>
                  <li>Move tasks to "Done" when you complete them</li>
                  <li>Edit or delete tasks using the buttons on each task card</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">🎨 Customization</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Toggle between light and dark themes using the moon/sun button</li>
                  <li>Each task can have its own color for easy identification</li>
                  <li>All your tasks are automatically saved to your browser</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">💡 Tips</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Use different colors for different types of tasks</li>
                  <li>Set realistic deadlines to stay on track</li>
                  <li>Regularly review and update your task status</li>
                  <li>Your progress is tracked automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Message */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md mx-4 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
            <p className="text-slate-300">{confirmationMessage}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .task-manager-playground {
          width: 100%;
          height: 100%;
          min-height: 600px;
          display: flex;
          flex-direction: column;
        }
        
        .task-manager-playground .grid {
          flex: 1;
          min-height: 400px;
        }
        
        .task-manager-playground .grid > div {
          display: flex;
          flex-direction: column;
        }
        
        .task-manager-playground .space-y-2 {
          flex: 1;
          min-height: 300px;
        }
      `}</style>
    </div>
  );
};

export default TaskManager; 