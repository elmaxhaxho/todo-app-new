import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Project,
  ProjectDocument,
} from './projects.schema';

import {
  Task,
  TaskDocument,
} from '../tasks/tasks.schema';

import {
  User,
  UserDocument,
} from '../users/users.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel:
      Model<ProjectDocument>,

    @InjectModel(Task.name)
    private readonly taskModel:
      Model<TaskDocument>,

    @InjectModel(User.name)
    private readonly userModel:
      Model<UserDocument>,
  ) {}

  async buildProjects(
    filter: any,
    workspaceId: any,
    includeArchived = false,
  ) {
    console.log('buildProjects filter:', filter, 'workspaceId:', workspaceId);
    const projects =
      await this.projectModel
        .find({
          ...filter,
          workspaceId,
        })
        .sort({ createdAt: -1 });

    const allMemberIds = projects.flatMap((p: any) => p.members || []);
    const usersMap = new Map();
    
    if (allMemberIds.length > 0) {
      const users = await this.userModel.find({ _id: { $in: allMemberIds } }).select('name email role').lean();
      users.forEach((u: any) => usersMap.set(u._id.toString(), u));
    }

    const serializedProjects = projects.map((p: any) => {
      const serialized = JSON.parse(JSON.stringify(p));

      serialized.members = (serialized.members || []).map((id: string) => usersMap.get(id) || id);
      return serialized;
    });
    
    console.log('Projects after manual populate:', serializedProjects.map((p: any) => ({ id: p._id, members: p.members })));

    const projectIds =
      serializedProjects.map(
        (project: any) =>
          project._id.toString(),
      );

    const taskFilter: any = {
      projectId: {
        $in: projectIds,
      },

      workspaceId,

      deleted: {
        $ne: true,
      },
    };

    if (!includeArchived) {
      taskFilter.archived = false;
    }

    const tasks =
      projectIds.length
        ? await this.taskModel
            .find(taskFilter)
            .populate('assignedTo', 'name email role')
            .sort({ createdAt: -1 })
        : [];

    const serializedTasks = tasks.map((t: any) => JSON.parse(JSON.stringify(t)));

    console.log('Found tasks for projects:', tasks.length);

    const tasksByProject =
      new Map<string, any[]>();

    for (const task of serializedTasks as any[]) {
      const key =
        task.projectId.toString();

      if (
        !tasksByProject.has(key)
      ) {
        tasksByProject.set(key, []);
      }

      tasksByProject
        .get(key)!
        .push({
          ...task,
          id: task._id,
          _id: task._id,
        });
    }

    return serializedProjects.map(
      (project: any) => {
        console.log('Project members:', project.members);
        return {
          ...project,
          id: project._id,
          _id: project._id,
          tasks:
            tasksByProject.get(
              project._id.toString(),
            ) || [],
        };
      },
    );
  }

  async getProjects(user: any) {
    const filter: any = {
      deleted: { $ne: true },
      archived: false,
    };

    if (user.role !== 'admin') {
      filter.members = user._id;
    }

    return this.buildProjects(
      filter,
      user.workspaceId,
    );
  }

  async getArchive(user: any) {
    const filter: any = {
      deleted: { $ne: true },
      archived: true,
    };

    if (user.role !== 'admin') {
      filter.members = user._id;
    }

    return this.buildProjects(
      filter,
      user.workspaceId,
      true,
    );
  }

  async create(
    body: any,
    user: any,
  ) {
    const title =
      String(body.title || '').trim();

    const description =
      String(
        body.description ??
          body.desc ??
          '',
      ).trim();

    const memberIds =
      Array.isArray(body.members)
        ? body.members
        : [];

    if (!title) {
      throw new BadRequestException(
        'Project title is required.',
      );
    }

    const employees =
      await this.userModel.find({
        _id: {
          $in: memberIds,
        },

        workspaceId:
          user.workspaceId,

        role: 'employee',
      }).select('_id');

    const project =
      await this.projectModel.create({
        title,
        description,

        owner: user._id,

        workspaceId:
          user.workspaceId,

        members:
          employees.map(
            (employee: any) =>
              employee._id,
          ),

        tasks: [],
      });

    const populatedProject =
      await this.projectModel
        .findById(project._id)
        .populate(
          'members',
          'name email role',
        );

    const serialized = JSON.parse(JSON.stringify(populatedProject));

    return {
      ...serialized,
      id: serialized._id,
      _id: serialized._id,
      tasks: [],
    };
  }

  async update(
    projectId: string,
    body: any,
    user: any,
  ) {
    const title =
      String(body.title || '').trim();

    const description =
      String(
        body.description ?? '',
      ).trim();

    const memberIds =
      Array.isArray(body.members)
        ? body.members
        : [];

    if (!title) {
      throw new BadRequestException(
        'Project title is required.',
      );
    }

    const employees =
      await this.userModel.find({
        _id: {
          $in: memberIds,
        },

        workspaceId:
          user.workspaceId,

        role: 'employee',
      }).select('_id');

    const project =
      await this.projectModel.findOne({
        _id: projectId,
        workspaceId:
          user.workspaceId,
        deleted: { $ne: true },
      });

    if (!project) {
      throw new NotFoundException(
        'Project not found.',
      );
    }

    project.title = title;
    project.description =
      description;

    project.members =
      employees.map(
        (employee: any) =>
          employee._id,
      );

    await project.save();

    const updated =
      await this.projectModel
        .findById(project._id)
        .populate(
          'members',
          'name email role',
        );

    const serialized = JSON.parse(JSON.stringify(updated));

    return {
      ...serialized,
      _id: serialized._id,
      tasks: [],
    };
  }

  async archive(
    projectId: string,
    user: any,
  ) {
    const project =
      await this.projectModel.findOne({
        _id: projectId,
        workspaceId:
          user.workspaceId,
        deleted: { $ne: true },
      });

    if (!project) {
      throw new NotFoundException(
        'Project not found.',
      );
    }

    project.archived = true;

    await project.save();

    return {
      message:
        'Project archived successfully.',
    };
  }

  async restore(
    projectId: string,
    user: any,
  ) {
    const project =
      await this.projectModel.findOne({
        _id: projectId,
        workspaceId:
          user.workspaceId,
        deleted: { $ne: true },
      });

    if (!project) {
      throw new NotFoundException(
        'Project not found.',
      );
    }

    project.archived = false;

    await project.save();

    return {
      message:
        'Project restored successfully.',
    };
  }

  async delete(
    projectId: string,
    user: any,
  ) {
    const project =
      await this.projectModel.findOne({
        _id: projectId,
        workspaceId:
          user.workspaceId,
      });

    if (
      !project ||
      project.deleted
    ) {
      throw new NotFoundException(
        'Project not found.',
      );
    }

    await this.taskModel.updateMany(
      {
        projectId:
          project._id,

        workspaceId:
          user.workspaceId,
      },

      {
        $set: {
          deleted: true,
          archived: false,
        },
      },
    );

    project.deleted = true;
    project.archived = false;

    await project.save();

    return {
      message:
        'Project deleted successfully.',
    };
  }
}