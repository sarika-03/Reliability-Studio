import React, { useState, useEffect } from 'react';
import { backendAPI } from '../api/backend';

interface TaskListProps {
  incidentId?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee?: string;
  created_at: string;
}

export const TaskList: React.FC<TaskListProps> = ({ incidentId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Load tasks from API
    // For now, use empty list
    setTasks([]);
  }, [incidentId]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !incidentId) return;

    try {
      // Would call API to create task
      // const task = await backendAPI.incidents.addTask(incidentId, { title: newTaskTitle });
      // setTasks([...tasks, task]);
      setNewTaskTitle('');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Tasks</h3>
      
      {tasks.length === 0 ? (
        <p style={styles.empty}>No tasks created yet</p>
      ) : (
        <div style={styles.taskList}>
          {tasks.map((task) => (
            <div key={task.id} style={styles.task}>
              <div style={styles.taskTitle}>{task.title}</div>
              <div style={styles.taskStatus}>{task.status}</div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div style={styles.form}>
          <input
            type="text"
            placeholder="Task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleAddTask} style={styles.button}>
            Add
          </button>
          <button onClick={() => setShowForm(false)} style={styles.buttonSecondary}>
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={styles.buttonSecondary}>
          + Add Task
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  heading: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
  taskList: {
    marginBottom: '12px',
  } as React.CSSProperties,
  task: {
    padding: '8px',
    marginBottom: '8px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #ddd',
  } as React.CSSProperties,
  taskTitle: {
    fontWeight: 500,
    fontSize: '13px',
    marginBottom: '4px',
  } as React.CSSProperties,
  taskStatus: {
    fontSize: '12px',
    color: '#999',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
  } as React.CSSProperties,
  button: {
    padding: '6px 12px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  } as React.CSSProperties,
  buttonSecondary: {
    padding: '6px 12px',
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  } as React.CSSProperties,
  empty: {
    color: '#999',
    fontStyle: 'italic',
    fontSize: '13px',
    marginBottom: '12px',
  } as React.CSSProperties,
};
