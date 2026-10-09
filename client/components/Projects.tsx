'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProjectCard from './ProjectCard';

export default function Projects({ isAdmin, searchTerm }: any) {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTaskTarget, setActiveTaskTarget] = useState<any>({
    projectId: null,
    status: null,
  });
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskProjectMembers, setTaskProjectMembers] = useState<any[]>([]);

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Failed to load projects');
      }

      const data = await res.json();
      console.log('Fetched projects:', data);
      console.log('Project tasks:', data.map((p: any) => ({ id: p._id, title: p.title, taskCount: p.tasks?.length, tasks: p.tasks })));
      setProjects(data);
    } catch (err: any) {
      console.error('Fetch projects error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const loadEmployees = async () => {
    if (!isAdmin) return;

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const users = await res.json();

        setEmployees(users.filter((u) => u.role === 'employee'));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleOpenNewProject = async () => {
    setEditingProject(null);
    setProjectTitle('');
    setProjectDesc('');
    setSelectedMembers([]);

    await loadEmployees();

    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = async (project: any) => {
    await loadEmployees();

    setEditingProject(project);
    setProjectTitle(project.title || '');
    setProjectDesc(project.description || '');

    setSelectedMembers(
      (project.members || []).map((m) => typeof m === 'object' ? m._id : m)
    );

    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projectTitle.trim()) {
      return alert('Please enter a project title.');
    }

    try {
      const token = localStorage.getItem('token');

      const method = editingProject ? 'PUT' : 'POST';

      const url = editingProject
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/${editingProject._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: projectTitle.trim(),
          description: projectDesc.trim(),
          members: selectedMembers,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Failed to save project');
      }

      setIsProjectModalOpen(false);

      await fetchProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleArchiveProject = async (id: any) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/${id}/archive`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Failed to archive project');
      }

      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProject = async (id: any) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/projects/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Failed to delete project');
      }

      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenTaskModal = (projectId: any, status: any) => {
    const proj = projects.find((p) => p._id === projectId);

    // Members are already populated from backend with name, email, role
    console.log('Opening task modal for project:', proj?.title, 'members:', proj?.members);
    setTaskProjectMembers(proj?.members || []);

    setActiveTaskTarget({
      projectId,
      status,
    });

    setTaskTitle('');
    setTaskDesc('');
    setTaskAssignee('');

    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) {
      return alert('Please enter a task title.');
    }

    try {
      const token = localStorage.getItem('token');
      const userSession = JSON.parse(localStorage.getItem('user_session') || '{}');
      const currentUserId = userSession._id;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: taskTitle.trim(),
            description: taskDesc.trim(),
            status: activeTaskTarget.status,
            projectId: activeTaskTarget.projectId,
            assignedTo: taskAssignee || currentUserId || null,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Failed to create task');
      }

      console.log('Task created successfully:', data);

      await fetchProjects();

      setIsTaskModalOpen(false);
    } catch (err: any) {
      console.error('Task creation error:', err);
      alert(err.message);
    }
  };

  const handleArchiveTask = async (taskId: any) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}/archive`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Failed to archive task');
      }

      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (taskId: any) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Failed to delete task');
      }

      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTaskStatusChange = async (taskId: any, newStatus: any) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }
        throw new Error(data.message || 'Failed to update task status');
      }

      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const taskMatchesSearch = (task: any, term: any) => {
    if (!term) return true;

    return `${task.title || ''} ${task.description || ''} ${
      task.label || ''
    }`
      .toLowerCase()
      .includes(term);
  };

  const projectMatchesSearch = (project: any, term: any) => {
    if (!term) return true;

    return (
      `${project.title || ''} ${project.description || ''}`
        .toLowerCase()
        .includes(term) ||
      (project.tasks || []).some((task) =>
        taskMatchesSearch(task, term)
      )
    );
  };

  const term = searchTerm.trim().toLowerCase();

  const filteredProjects = projects.filter((p) =>
    projectMatchesSearch(p, term)
  );


  const toggleMember = (employeeId: any) => {
    setSelectedMembers((current) => {
      if (current.includes(employeeId)) {
        return current.filter((id) => id !== employeeId);
      }

      return [...current, employeeId];
    });
  };

  return (
    <section className="page-section">
      <div className="content-header">
        <div>
          <h1>Projects</h1>
          <p>Manage your projects, tasks, and team members.</p>
        </div>

        {isAdmin && (
          <button
            className="new-project-btn"
            onClick={handleOpenNewProject}
          >
            + New Project
          </button>
        )}
      </div>

      <div className="projects">
        {loading ? null : error ? (
          <div
            style={{
              padding: '30px',
              color: '#d85c5c',
            }}
          >
            {error}
          </div>
        ) : !filteredProjects.length ? (
          <div
            style={{
              textAlign: 'left',
              padding: '20px 0',
              color: '#858595',
              width: '100%',
            }}
          >
            <p
              style={{
                fontSize: '16px',
                marginBottom: '8px',
              }}
            >
              {term
                ? 'No matching projects or tasks.'
                : 'No projects yet.'}
            </p>

            <p style={{ fontSize: '14px' }}>
              {term
                ? 'Try another search.'
                : isAdmin
                ? 'Click + New Project to create your first project board.'
                : 'You are not assigned to any active projects yet.'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              isAdmin={isAdmin}
              filterTerm={term}
              onEditProject={handleOpenEditProject}
              onArchiveProject={handleArchiveProject}
              onDeleteProject={handleDeleteProject}
              onOpenTaskModal={handleOpenTaskModal}
              onArchiveTask={handleArchiveTask}
              onDeleteTask={handleDeleteTask}
              onTaskStatusChange={handleTaskStatusChange}
            />
          ))
        )}
      </div>

      {}
      {isProjectModalOpen && (
        <div
          className="modal"
          onClick={() => setIsProjectModalOpen(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {editingProject
                ? 'Edit Project'
                : 'Create New Project'}
            </h3>

            <div className="input-group">
              <label>Project Title</label>

              <input
                type="text"
                placeholder="Project Title..."
                value={projectTitle}
                onChange={(e) =>
                  setProjectTitle(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label>Description</label>

              <textarea
                placeholder="Enter project description..."
                value={projectDesc}
                onChange={(e) =>
                  setProjectDesc(e.target.value)
                }
              />
            </div>

            {isAdmin && (
              <div className="input-group">
                <label>Employees</label>

                <div className="employee-selector">
                  {employees.length ? (
                    employees.map((emp) => {
                      const isSelected =
                        selectedMembers.includes(emp._id);

                      return (
                        <button
                          type="button"
                          key={emp._id}
                          className={`employee-option ${
                            isSelected ? 'selected' : ''
                          }`}
                          onClick={() =>
                            toggleMember(emp._id)
                          }
                        >
                          <span className="employee-check">
                            {isSelected ? '✓' : ''}
                          </span>

                          <span>
                            {emp.name} ({emp.email})
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="no-employees">
                      No employees available
                    </div>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '12px',
                    color: '#858595',
                    marginTop: '6px',
                  }}
                >
                  {selectedMembers.length === 0
                    ? 'No employees selected'
                    : `${selectedMembers.length} employee${
                        selectedMembers.length === 1 ? '' : 's'
                      } selected`}
                </p>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() =>
                  setIsProjectModalOpen(false)
                }
              >
                Cancel
              </button>

              <button
                className="btn-primary"
                onClick={handleSaveProject}
              >
                {editingProject
                  ? 'Save Changes'
                  : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {isTaskModalOpen && (
        <div
          className="modal"
          onClick={() => setIsTaskModalOpen(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add New Task</h3>

            <div className="input-group">
              <label>Title</label>

              <input
                type="text"
                placeholder="Enter task title"
                value={taskTitle}
                onChange={(e) =>
                  setTaskTitle(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label>Description</label>

              <textarea
                placeholder="Enter task description"
                value={taskDesc}
                onChange={(e) =>
                  setTaskDesc(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label>Assign to</label>

              <select
                value={taskAssignee}
                onChange={(e) =>
                  setTaskAssignee(e.target.value)
                }
              >
                <option value="">Unassigned</option>

                {taskProjectMembers.map((m: any, index: number) => (
                  <option key={m._id || index} value={m._id}>
                    {m.name || m.email || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() =>
                  setIsTaskModalOpen(false)
                }
              >
                Cancel
              </button>

              <button
                className="btn-primary"
                onClick={handleSaveTask}
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
