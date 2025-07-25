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
    <div className="task-manager">
      {/* Theme and Help Toggles */}
      <button 
        className="theme-toggle" 
        onClick={() => setIsDarkTheme(!isDarkTheme)}
      >
        {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      
      <button 
        className="help-toggle" 
        onClick={() => setIsHelpModalOpen(true)}
      >
        <HelpCircle size={20} />
      </button>

      {/* Header */}
      <header className="header">
        <div className="header__content">
          <h1 className="header__title">Task Manager</h1>
          <p className="header__subtitle">Manage your learning tasks with style</p>
          <div className="header__stats">
            <div className="header__stat">
              <div className="header__stat-value">{stats.total}</div>
              <div className="header__stat-label">Total Tasks</div>
            </div>
            <div className="header__stat">
              <div className="header__stat-value">{stats.completed}</div>
              <div className="header__stat-label">Completed</div>
            </div>
            <div className="header__stat">
              <div className="header__stat-value">{stats.inProgress}</div>
              <div className="header__stat-label">In Progress</div>
            </div>
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="container">
        <div className="board">
          {['todo', 'progress', 'done'].map(column => (
            <div 
              key={column}
              className="column" 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column)}
            >
              <div className="column__header">
                <h2 className="column__title">
                  {column === 'todo' && '📝 To Do'}
                  {column === 'progress' && '🔄 In Progress'}
                  {column === 'done' && '✅ Done'}
                </h2>
                <span className="column__count">{getTasksByColumn(column).length}</span>
              </div>
              <div className="task-list">
                {getTasksByColumn(column).map(task => (
                  <div
                    key={task.id}
                    className={`task ${draggedTask === task.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    style={{ borderLeft: `4px solid ${task.color}` }}
                  >
                    <div className="task__header">
                      <h3 className="task__title">{task.title}</h3>
                      <div className="task__actions">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => openEditModal(task)}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="task__content">
                      <p>{task.description}</p>
                      {task.image && (
                        <img src={task.image} alt="Task" className="task__image" />
                      )}
                    </div>
                    <div className="task__footer">
                      <span className="task__date">
                        📅 {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                  </div>
                ))}
                <div 
                  className="add-task"
                  onClick={() => openModal(column)}
                >
                  <Plus size={20} />
                  Add Task
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="modal show">
          <div className="modal__content">
            <button 
              className="modal__close"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={20} />
            </button>
            <h2>{isEditMode ? 'Edit Task' : 'New Task'}</h2>
            <form ref={formRef} className="task-form" onSubmit={handleSubmit}>
              <input type="hidden" name="column" value={currentTask?.column || 'todo'} />
              
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  defaultValue={currentTask?.title || ''}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea 
                  id="description" 
                  name="description" 
                  rows={3}
                  defaultValue={currentTask?.description || ''}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deadline">Deadline</label>
                <input 
                  type="datetime-local" 
                  id="deadline" 
                  name="deadline"
                  defaultValue={currentTask?.deadline || ''}
                />
              </div>
              
              <div className="form-group">
                <label>Task Color</label>
                <div className="color-picker">
                  <input 
                    type="color" 
                    id="color" 
                    name="color"
                    defaultValue={currentTask?.color || '#3a86ff'}
                  />
                  <span>Choose a color for your task</span>
                </div>
              </div>
              
              <button type="submit" className="btn">
                {isEditMode ? 'Update Task' : 'Add Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal show">
          <div className="modal__content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this task?</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button 
                className="btn" 
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ background: 'var(--accent)' }}
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
        <div className="modal show">
          <div className="modal__content help-modal__content">
            <button 
              className="modal__close"
              onClick={() => setIsHelpModalOpen(false)}
            >
              <X size={20} />
            </button>
            <div className="help-header">
              <div className="help-icon">📘</div>
              <h2>User Guide</h2>
            </div>
            <p className="help-intro">
              Welcome to Task Manager! This guide will help you get the most out of this application.
            </p>
            <div className="help-content">
              <section className="help-section">
                <div className="help-section-header">
                  <div className="help-section-icon">🎯</div>
                  <h3>Getting Started</h3>
                </div>
                <div className="help-section-content">
                  <p>Task Manager helps you organize your learning with a simple kanban board:</p>
                  <ul>
                    <li><strong>To Do</strong> - Tasks you haven't started yet</li>
                    <li><strong>In Progress</strong> - Tasks you're currently working on</li>
                    <li><strong>Done</strong> - Tasks you've completed</li>
                  </ul>
                </div>
              </section>
              <section className="help-section">
                <div className="help-section-header">
                  <div className="help-section-icon">➕</div>
                  <h3>Creating Tasks</h3>
                </div>
                <div className="help-section-content">
                  <p>To create a new task:</p>
                  <ol>
                    <li>Click the <strong>"Add Task"</strong> button in any column</li>
                    <li>Fill in the task details (title is required)</li>
                    <li>Customize your task with a deadline and color</li>
                    <li>Click <strong>"Add Task"</strong> to save</li>
                  </ol>
                </div>
              </section>
              <section className="help-section">
                <div className="help-section-header">
                  <div className="help-section-icon">🔄</div>
                  <h3>Managing Tasks</h3>
                </div>
                <div className="help-section-content">
                  <p>You can easily manage your tasks with these actions:</p>
                  <ul>
                    <li><strong>Move</strong> - Drag and drop tasks between columns to update their status</li>
                    <li><strong>Edit</strong> - Click the ✏️ icon to modify a task's details</li>
                    <li><strong>Delete</strong> - Click the 🗑️ icon to remove a task (confirmation required)</li>
                  </ul>
                </div>
              </section>
            </div>
            <div className="help-footer">
              <button 
                className="btn help-close-btn"
                onClick={() => setIsHelpModalOpen(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Message */}
      {showConfirmation && (
        <div className="modal show">
          <div className="modal__content">
            <div className="confirmation-check">✅</div>
            <h3>Success!</h3>
            <p>{confirmationMessage}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .task-manager {
          font-family: 'Montserrat', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        :root {
          --primary: #3a86ff;
          --secondary: #8338ec;
          --accent: #ff006e;
          --bg: #f8fafc;
          --card: #ffffff;
          --text: #1e293b;
          --border: #e2e8f0;
          --column-bg: #f1f5f9;
          --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          --radius: 8px;
          --header-pattern: repeating-linear-gradient(45deg,
            rgba(255, 255, 255, 0.05) 0px,
            rgba(255, 255, 255, 0.05) 2px,
            transparent 2px,
            transparent 6px);
        }

        [data-theme="dark"] {
          --bg: #0f172a;
          --card: #1e293b;
          --text: #f1f5f9;
          --border: #334155;
          --column-bg: #1e293b;
          --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
          --primary: #60a5fa;
          --secondary: #818cf8;
          --accent: #f472b6;
          --text-light: #94a3b8;
          --header-pattern: repeating-linear-gradient(45deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 2px,
            transparent 2px,
            transparent 6px);
        }

        .header {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          background-size: 400% 400%;
          color: white;
          padding: 2.5rem 1.5rem;
          text-align: center;
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
          animation: gradientAnimation 15s ease infinite;
        }

        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--header-pattern);
        }

        .header__content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
        }

        .header__title {
          font-size: 3rem;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          letter-spacing: 1px;
          animation: slideDown 0.5s ease-out;
        }

        .header__subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
          font-weight: 400;
          animation: slideUp 0.5s ease-out 0.2s backwards;
        }

        .header__stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 1.5rem;
          animation: fadeIn 0.5s ease-out 0.4s backwards;
        }

        .header__stat {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .header__stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .header__stat-label {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .container {
          max-width: 1600px;
          margin: 2rem auto;
          padding: 0 2rem;
          flex: 1;
        }

        .board {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
          justify-content: center;
        }

        .column {
          background: var(--column-bg);
          border-radius: var(--radius);
          padding: 1.5rem;
          min-height: 400px;
          transition: background-color 0.2s;
        }

        .column.drag-over {
          background-color: rgba(58, 134, 255, 0.1);
        }

        .column__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .column__title {
          font-size: 1.2rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 200px;
          padding: 0.5rem;
          transition: padding 0.2s;
        }

        .task-list.drag-over {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: var(--radius);
        }

        .task {
          background: var(--card);
          border-radius: var(--radius);
          padding: 1rem;
          box-shadow: var(--shadow);
          transition: transform 0.2s, opacity 0.2s;
          cursor: move;
          -webkit-user-select: none;
          user-select: none;
          position: relative;
        }

        .task.dragging {
          opacity: 0.5;
          cursor: grabbing;
        }

        .task:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow), 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .task__header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .task__title {
          font-weight: 600;
        }

        .task__content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .task__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          font-size: 0.9rem;
        }

        .task__date {
          color: #666;
        }

        .add-task {
          background: rgba(255, 255, 255, 0.8);
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .add-task:hover {
          background: white;
          border-color: var(--primary);
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal.show {
          display: flex;
        }

        .modal__content {
          background: white;
          padding: 2rem;
          border-radius: var(--radius);
          width: 90%;
          max-width: 500px;
          position: relative;
        }

        .modal__close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .task-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: var(--text);
        }

        .form-group input,
        .form-group textarea {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-family: inherit;
        }

        .color-picker {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        input[type="color"] {
          -webkit-appearance: none;
          appearance: none;
          width: 50px;
          height: 50px;
          padding: 0;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          background: none;
          transition: transform 0.2s;
        }

        input[type="color"]:hover {
          transform: scale(1.1);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn:hover {
          background: var(--secondary);
        }

        .theme-toggle,
        .help-toggle {
          position: fixed;
          top: 1rem;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          transition: all 0.3s ease;
        }

        .theme-toggle {
          right: 1rem;
        }

        .help-toggle {
          right: 4rem;
        }

        .theme-toggle:hover,
        .help-toggle:hover {
          transform: scale(1.1);
        }

        .task__actions {
          position: absolute;
          top: 0.5rem;
          right: 1.5rem;
          display: none;
          gap: 0.5rem;
        }

        .task:hover .task__actions {
          display: flex;
        }

        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .confirmation-check {
          font-size: 4rem;
          animation: checkBounce 0.5s ease;
        }

        @keyframes checkBounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .help-modal__content {
          max-width: 650px;
          max-height: 85vh;
          overflow-y: auto;
          padding: 0;
        }

        .help-header {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-radius: var(--radius) var(--radius) 0 0;
        }

        .help-icon {
          font-size: 2.5rem;
        }

        .help-header h2 {
          margin: 0;
          font-size: 1.8rem;
        }

        .help-intro {
          padding: 1.5rem 1.5rem 0.5rem;
          color: var(--text);
          font-size: 1.1rem;
          border-bottom: 1px solid var(--border);
          margin: 0;
        }

        .help-content {
          padding: 1.5rem;
        }

        .help-section {
          margin-bottom: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .help-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.03);
          border-bottom: 1px solid var(--border);
        }

        .help-section-icon {
          font-size: 1.5rem;
        }

        .help-section h3 {
          margin: 0;
          color: var(--primary);
          font-size: 1.3rem;
        }

        .help-section-content {
          padding: 1.5rem;
        }

        .help-section-content p {
          margin-top: 0;
          margin-bottom: 1rem;
        }

        .help-section-content ul,
        .help-section-content ol {
          padding-left: 1.5rem;
          margin-bottom: 0;
        }

        .help-section-content li {
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }

        .help-section-content li:last-child {
          margin-bottom: 0;
        }

        .help-section-content strong {
          color: var(--primary);
        }

        .help-footer {
          padding: 1rem 1.5rem 1.5rem;
          text-align: center;
          border-top: 1px solid var(--border);
        }

        .help-close-btn {
          min-width: 120px;
        }

        /* Dark theme overrides */
        [data-theme="dark"] .header {
          background: linear-gradient(135deg, #1e40af, #4c1d95);
        }

        [data-theme="dark"] .add-task {
          background: rgba(255, 255, 255, 0.02);
          border-color: var(--border);
          color: var(--text-light);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        [data-theme="dark"] .add-task:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--primary);
          color: var(--text);
          transform: translateY(-2px);
        }

        [data-theme="dark"] .task {
          background: rgba(30, 41, 59, 0.8);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2),
              0 2px 4px -1px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--border);
        }

        [data-theme="dark"] .task:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3),
              0 4px 6px -2px rgba(0, 0, 0, 0.2);
          background: rgba(30, 41, 59, 0.9);
        }

        [data-theme="dark"] .modal__content {
          background: var(--card);
          color: var(--text);
          border: 1px solid var(--border);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        [data-theme="dark"] .form-group input,
        [data-theme="dark"] .form-group textarea {
          background: rgba(15, 23, 42, 0.6);
          color: var(--text);
          border-color: var(--border);
        }

        [data-theme="dark"] .form-group input:focus,
        [data-theme="dark"] .form-group textarea:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
        }

        [data-theme="dark"] .task__date {
          color: var(--text-light);
        }

        [data-theme="dark"] .column.drag-over {
          background-color: rgba(96, 165, 250, 0.1);
        }

        [data-theme="dark"] .task-list.drag-over {
          background: rgba(255, 255, 255, 0.03);
        }

        [data-theme="dark"] .theme-toggle,
        [data-theme="dark"] .help-toggle {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }

        [data-theme="dark"] .theme-toggle:hover,
        [data-theme="dark"] .help-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .header__stat {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .btn {
          background: var(--primary);
          color: var(--text);
        }

        [data-theme="dark"] .btn:hover {
          background: var(--secondary);
          transform: translateY(-1px);
        }

        [data-theme="dark"] .modal__close {
          color: var(--text-light);
        }

        [data-theme="dark"] .modal__close:hover {
          color: var(--text);
        }

        [data-theme="dark"] .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .help-section {
          background: rgba(0, 0, 0, 0.1);
        }

        [data-theme="dark"] .help-section-header {
          background: rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .header {
            padding: 2rem 1rem;
          }

          .header__title {
            font-size: 2.5rem;
          }

          .header__stats {
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }

          .header__stat {
            width: 100%;
            max-width: 300px;
          }

          .board {
            grid-template-columns: 1fr;
          }

          .help-toggle {
            right: 3rem;
          }
        }

        @media (min-width: 1200px) {
          .board {
            grid-template-columns: repeat(3, minmax(400px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default TaskManager; 