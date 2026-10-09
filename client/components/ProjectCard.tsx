'use client';

import TaskBoard from './TaskBoard';

export default function ProjectCard({
  project,
  isAdmin,
  filterTerm,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
  onOpenTaskModal,
  onArchiveTask,
  onDeleteTask,
  onTaskStatusChange,
}: any) {
  const getMemberInitials = (m: any) => {
    if (!m) return '??';
    const name = m.name || m.email || '';
    if (name.length >= 2) {
      return name.slice(0, 2).toUpperCase();
    }
    if (name.length === 1) {
      return name.toUpperCase();
    }
    return '??';
  };

  return (
    <div className="project-board">
      <div className="project-header">
        <div className="project-title-section">
          <div>
            <h2>{project.title}</h2>
            {project.description && (
              <p style={{ fontSize: '13px', color: '#858595', marginBottom: '8px' }}>
                {project.description}
              </p>
            )}
            <div className="project-members" style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px' }}>
              {console.log('Rendering members:', project.members)}
              {(project.members || []).map((m: any, index: number) => (
                <div key={m._id || index} className="member-avatar" title={m.name || m.email || 'Unknown'}>
                  {getMemberInitials(m)}
                </div>
              ))}
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="project-actions">
            <button className="archive-project" onClick={() => onEditProject(project)}>
              Edit
            </button>
            <button className="archive-project" onClick={() => onArchiveProject(project._id)}>
              Archive
            </button>
            <button className="delete-project" onClick={() => onDeleteProject(project._id)}>
              Delete
            </button>
          </div>
        )}
      </div>
      <TaskBoard
        project={project}
        isAdmin={isAdmin}
        filterTerm={filterTerm}
        onOpenTaskModal={onOpenTaskModal}
        onArchiveTask={onArchiveTask}
        onDeleteTask={onDeleteTask}
        onTaskStatusChange={onTaskStatusChange}
      />
    </div>
  );
}
