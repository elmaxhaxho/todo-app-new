import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Project,
  ProjectDocument,
} from '../projects/projects.schema';

import {
  Task,
  TaskDocument,
} from '../tasks/tasks.schema';

import {
  Client,
  ClientDocument,
} from '../clients/clients.schema';

import {
  User,
  UserDocument,
} from '../users/users.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,

    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getDashboard(user: any) {
    const workspaceId = user.workspaceId;


    if (user.role === 'admin') {
      const [
        totalProjects,
        totalTasks,
        totalClients,
        totalUsers,
        archivedProjects,
        archivedTasks,
      ] = await Promise.all([
        this.projectModel.countDocuments({
          workspaceId,
          deleted: { $ne: true },
        }),

        this.taskModel.countDocuments({
          workspaceId,
          deleted: { $ne: true },
        }),

        this.clientModel.countDocuments({
          workspaceId,
          deleted: { $ne: true },
        }),

        this.userModel.countDocuments({
          workspaceId,
        }),

        this.projectModel.countDocuments({
          workspaceId,
          archived: true,
          deleted: { $ne: true },
        }),

        this.taskModel.countDocuments({
          workspaceId,
          archived: true,
          deleted: { $ne: true },
        }),
      ]);

      return {
        totalProjects,
        totalTasks,
        totalClients,
        totalUsers,
        archivedProjects,
        archivedTasks,
      };
    }

    const projects = await this.projectModel
      .find({
        workspaceId,
        members: user._id,
        deleted: { $ne: true },
      })
      .select('_id archived')
      .lean();

    console.log('Employee ID:', user._id);
    console.log('Employee ID type:', typeof user._id);
    console.log('Workspace ID:', workspaceId);
    console.log('Employee projects:', projects);

    const allTasks = await this.taskModel
      .find({
        workspaceId,
        deleted: { $ne: true },
      })
      .select(
        '_id title status archived assignedTo projectId',
      )
      .lean();

    console.log('All workspace tasks:', allTasks.length);

    console.log(
      'All workspace task assignments:',
      allTasks.map((task: any) => ({
        id: task._id,
        title: task.title,
        status: task.status,
        archived: task.archived,
        assignedTo: task.assignedTo,
        assignedToType: typeof task.assignedTo,
      })),
    );


    const employeeId = String(user._id);

    const tasks = allTasks.filter((task: any) => {
      if (!task.assignedTo) {
        return false;
      }

      const assignedId =
        typeof task.assignedTo === 'object'
          ? task.assignedTo._id
          : task.assignedTo;

      return String(assignedId) === employeeId;
    });

    console.log(
      'Employee ID used for task comparison:',
      employeeId,
    );

    console.log(
      'Employee tasks:',
      tasks.map((task: any) => ({
        id: task._id,
        title: task.title,
        status: task.status,
        archived: task.archived,
        assignedTo: task.assignedTo,
      })),
    );

    console.log(
      'Employee task count:',
      tasks.length,
    );

    const myProjects = projects.filter(
      (project: any) => !project.archived,
    ).length;


    const myTasks = tasks.filter(
      (task: any) => !task.archived,
    ).length;


    const myPendingTasks = tasks.filter(
      (task: any) =>
        !task.archived &&
        (
          task.status === 'todo' ||
          task.status === 'in-progress'
        ),
    ).length;

    const myCompletedTasks = tasks.filter(
      (task: any) =>
        !task.archived &&
        task.status === 'done',
    ).length;

    console.log('My Projects:', myProjects);
    console.log('My Tasks:', myTasks);
    console.log(
      'My Pending Tasks:',
      myPendingTasks,
    );
    console.log(
      'My Completed Tasks:',
      myCompletedTasks,
    );

    return {
      myProjects,
      myTasks,
      myPendingTasks,
      myCompletedTasks,
    };
  }
}