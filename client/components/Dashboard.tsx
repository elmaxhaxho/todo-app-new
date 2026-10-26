'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type DashboardProps = {
  isAdmin: boolean;
  username?: string;
  onNavigate?: (section: string) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
}

export default function Dashboard({ isAdmin, username = 'there', onNavigate }: DashboardProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
    router.push('/login');
  }, [router]);

  const fetchDashboard = useCallback(async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [dashboardRes, projectsRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard`, { headers }),
        fetch(`${API_URL}/api/projects`, { headers }),
      ]);

      const dashboardData = await dashboardRes.json().catch(() => ({}));
      const projectData = await projectsRes.json().catch(() => []);

      if (dashboardRes.status === 401 || projectsRes.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!dashboardRes.ok) {
        throw new Error(dashboardData.message || 'Could not load dashboard data.');
      }

      setData(dashboardData);
      if (projectsRes.ok && Array.isArray(projectData)) setProjects(projectData);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong while loading your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') fetchDashboard();
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => document.removeEventListener('visibilitychange', refreshOnReturn);
  }, [fetchDashboard]);

  const allTasks = useMemo(
    () => projects.flatMap((project) =>
      (project.tasks || [])
        .filter((task: any) => !task.archived && !task.deleted)
        .map((task: any) => ({ ...task, projectTitle: project.title, projectId: project._id }))
    ),
    [projects]
  );

  const userSession = typeof window !== 'undefined'
    ? (() => {
        try { return JSON.parse(localStorage.getItem('user_session') || '{}'); }
        catch { return {}; }
      })()
    : {};

  const myTasks = useMemo(() => {
    if (isAdmin) return allTasks;
    const currentId = userSession?._id;
    const currentEmail = userSession?.email?.toLowerCase();
    return allTasks.filter((task: any) => {
      const assignee = task.assignedTo;
      const assignedId = typeof assignee === 'string' ? assignee : assignee?._id;
      const assignedEmail = assignee?.email?.toLowerCase();
      return (currentId && assignedId === currentId) ||
        (currentEmail && assignedEmail === currentEmail);
    });
  }, [allTasks, isAdmin, userSession?._id, userSession?.email]);

  const recentProjects = useMemo(
    () => [...projects]
      .filter((project) => !project.archived && !project.deleted)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 3),
    [projects]
  );

  const taskCounts = useMemo(() => ({
    total: myTasks.length,
    todo: myTasks.filter((task: any) => task.status === 'todo').length,
    progress: myTasks.filter((task: any) => task.status === 'in-progress').length,
    done: myTasks.filter((task: any) => task.status === 'done').length,
  }), [myTasks]);

  const navigate = (section: string) => onNavigate?.(section);

  const statCards = isAdmin
    ? [
        { label: 'Total Projects', value: data?.totalProjects ?? projects.filter((p) => !p.archived && !p.deleted).length, icon: '▦', section: 'projects', tone: 'purple' },
        { label: 'Total Tasks', value: data?.totalTasks ?? allTasks.length, icon: '✓', section: 'projects', tone: 'blue' },
        { label: 'Total Clients', value: data?.totalClients ?? 0, icon: '♧', section: 'clients', tone: 'green' },
        { label: 'Total Users', value: data?.totalUsers ?? 0, icon: '♙', section: 'users', tone: 'orange' },
        { label: 'Archived Projects', value: data?.archivedProjects ?? 0, icon: '▤', section: 'archive', tone: 'slate' },
        { label: 'Archived Tasks', value: data?.archivedTasks ?? 0, icon: '✓', section: 'archive', tone: 'pink' },
      ]
    : [
        { label: 'My Projects', value: data?.myProjects ?? projects.length, icon: '▦', section: 'projects', tone: 'purple' },
        { label: 'My Tasks', value: data?.myTasks ?? taskCounts.total, icon: '✓', section: 'projects', tone: 'blue' },
        { label: 'In Progress', value: data?.myPendingTasks ?? taskCounts.todo + taskCounts.progress, icon: '◷', section: 'projects', tone: 'orange' },
        { label: 'Completed', value: data?.myCompletedTasks ?? taskCounts.done, icon: '✓', section: 'projects', tone: 'green' },
      ];

  const updateTaskStatus = async (taskId: string, status: string) => {
    setUpdatingTask(taskId);
    setNotice('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error(result.message || 'Could not update task.');
      setNotice('Task status updated.');
      await fetchDashboard();
    } catch (err: any) {
      setNotice(err?.message || 'Could not update task.');
    } finally {
      setUpdatingTask(null);
    }
  };

  const visibleTasks = [...myTasks]
    .sort((a: any, b: any) => {
      const rank: Record<string, number> = { 'in-progress': 0, todo: 1, done: 2 };
      return (rank[a.status] ?? 3) - (rank[b.status] ?? 3);
    })
    .slice(0, 5);

  if (loading && !data) {
    return (
      <section className="page-section dashboard-page">
        <div className="content-header"><div><h1>Dashboard</h1><p>Your workspace is getting ready.</p></div></div>
        <div className="dashboard-cards dashboard-skeletons">
          {[1, 2, 3, 4].map((item) => <div className="dashboard-card dashboard-skeleton" key={item} />)}
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="page-section dashboard-page">
        <div className="content-header"><div><h1>Dashboard</h1><p>Overview of your work.</p></div></div>
        <div className="dashboard-message dashboard-message-error">
          <strong>We couldn't load your dashboard.</strong>
          <p>{error}</p>
          <button className="dashboard-primary-btn" onClick={fetchDashboard}>Try again</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <p className="dashboard-eyebrow">YOUR WORKSPACE</p>
          <h1>{getGreeting()}, {username.split(' ')[0]} <span aria-hidden="true">✦</span></h1>
          <p>Here’s what’s happening with your work today.</p>
        </div>
        {isAdmin && (
          <button className="dashboard-primary-btn" onClick={() => navigate('projects')}>
            <span aria-hidden="true">＋</span> New project
          </button>
        )}
      </div>

      {notice && <div className={`dashboard-notice ${notice.includes('Could not') ? 'is-error' : ''}`} role="status">{notice}</div>}

      <div className={`dashboard-cards ${isAdmin ? '' : 'dashboard-cards-employee'}`}>
        {statCards.map((card) => (
          <button
            type="button"
            className="dashboard-card dashboard-stat-card"
            key={card.label}
            onClick={() => navigate(card.section)}
            aria-label={`${card.label}: ${card.value}. Open ${card.section}`}
          >
            <span className={`dashboard-stat-icon ${card.tone}`} aria-hidden="true">{card.icon}</span>
            <span className="dashboard-stat-copy">
              <span className="dashboard-stat-label">{card.label}</span>
              <strong>{card.value}</strong>
              <span className="dashboard-stat-link">View details <span aria-hidden="true">↗</span></span>
            </span>
          </button>
        ))}
      </div>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel dashboard-tasks-panel">
          <div className="dashboard-panel-heading">
            <div><h2>{isAdmin ? 'Task overview' : 'My tasks'}</h2><p>{isAdmin ? 'A quick look at active work.' : 'Your next steps, all in one place.'}</p></div>
            <button className="dashboard-text-btn" onClick={() => navigate('projects')}>View projects <span aria-hidden="true">→</span></button>
          </div>

          <div className="dashboard-task-summary">
            <button type="button" onClick={() => navigate('projects')}><span className="task-summary-dot todo-dot" /><span>To do</span><strong>{taskCounts.todo}</strong></button>
            <button type="button" onClick={() => navigate('projects')}><span className="task-summary-dot progress-dot" /><span>In progress</span><strong>{taskCounts.progress}</strong></button>
            <button type="button" onClick={() => navigate('projects')}><span className="task-summary-dot done-dot" /><span>Done</span><strong>{taskCounts.done}</strong></button>
          </div>

          {visibleTasks.length ? (
            <div className="dashboard-task-list">
              {visibleTasks.map((task: any) => (
                <article className="dashboard-task-row" key={task._id}>
                  <span className={`dashboard-task-status status-${task.status || 'todo'}`} aria-hidden="true" />
                  <div className="dashboard-task-main">
                    <strong>{task.title || 'Untitled task'}</strong>
                    <span>{task.projectTitle || 'Project'}{task.assignedTo?.name && isAdmin ? ` · ${task.assignedTo.name}` : ''}</span>
                  </div>
                  <select
                    aria-label={`Change status for ${task.title}`}
                    value={task.status || 'todo'}
                    disabled={updatingTask === task._id}
                    onChange={(event) => updateTaskStatus(task._id, event.target.value)}
                  >
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <span aria-hidden="true">✓</span>
              <strong>{isAdmin ? 'No active tasks yet' : 'You’re all caught up'}</strong>
              <p>{isAdmin ? 'Create a project and add its first task to get started.' : 'Tasks assigned to you will appear here.'}</p>
              {isAdmin && <button className="dashboard-text-btn" onClick={() => navigate('projects')}>Go to projects →</button>}
            </div>
          )}
        </section>

        <section className="dashboard-panel dashboard-projects-panel">
          <div className="dashboard-panel-heading">
            <div><h2>Recent projects</h2><p>Jump back into your work.</p></div>
            <button className="dashboard-text-btn" onClick={() => navigate('projects')}>View all <span aria-hidden="true">→</span></button>
          </div>
          {recentProjects.length ? (
            <div className="dashboard-project-list">
              {recentProjects.map((project) => {
                const tasks = (project.tasks || []).filter((task: any) => !task.archived && !task.deleted);
                const done = tasks.filter((task: any) => task.status === 'done').length;
                const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
                return (
                  <button type="button" className="dashboard-project-row" key={project._id} onClick={() => navigate('projects')}>
                    <span className="dashboard-project-mark">{getInitials(project.title || 'P')}</span>
                    <span className="dashboard-project-details">
                      <strong>{project.title || 'Untitled project'}</strong>
                      <span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} · {progress}% complete</span>
                      <span className="dashboard-progress-track"><span style={{ width: `${progress}%` }} /></span>
                    </span>
                    <span className="dashboard-project-arrow" aria-hidden="true">↗</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-state compact">
              <span aria-hidden="true">▦</span>
              <strong>No projects yet</strong>
              <p>Your projects will appear here once created.</p>
              {isAdmin && <button className="dashboard-text-btn" onClick={() => navigate('projects')}>Create a project →</button>}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
