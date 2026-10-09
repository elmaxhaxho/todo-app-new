import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import {
  Model,
  Types,
} from 'mongoose';

import {
  Task,
  TaskDocument,
} from '../tasks/tasks.schema';

import {
  Project,
  ProjectDocument,
} from '../projects/projects.schema';

import {
  User,
  UserDocument,
} from '../users/users.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private readonly taskModel:
      Model<TaskDocument>,

    @InjectModel(Project.name)
    private readonly projectModel:
      Model<ProjectDocument>,

    @InjectModel(User.name)
    private readonly userModel:
      Model<UserDocument>,
  ) {}

  async getTaskWithProject(
    taskId: string,
    workspaceId: any,
  ) {
    if (
      !Types.ObjectId.isValid(taskId)
    ) {
      return null;
    }

    return this.taskModel
      .findOne({
        _id: taskId,
        workspaceId,
        deleted: { $ne: true },
      })
      .populate({
        path: 'projectId',
        select:
          'owner members title archived deleted workspaceId',
      });
  }

  employeeCanAccessTask(
    task: any,
    userId: any,
  ) {
    if (!task?.projectId) {
      return false;
    }

    return task.projectId.members.some(
      (id: any) =>
        id.toString() ===
        userId.toString(),
    );
  }

  async getArchived(user: any) {
    let tasks: any[];

    if (user.role === 'admin') {
      tasks =
        await this.taskModel
          .find({
            workspaceId:
              user.workspaceId,

            archived: true,

            deleted: {
              $ne: true,
            },
          })

          .populate(
            'assignedTo',
            'name email role',
          )

          .populate(
            'projectId',
            'title archived deleted',
          )

          .sort({
            updatedAt: -1,
          });
    } else {
      const projects =
        await this.projectModel
          .find({
            workspaceId:
              user.workspaceId,

            members: user._id,

            deleted: {
              $ne: true,
            },
          })
          .select('_id');

      const projectIds =
        projects.map(
          (project: any) =>
            project._id.toString(),
        );

      tasks =
        await this.taskModel
          .find({
            workspaceId:
              user.workspaceId,

            archived: true,

            deleted: {
              $ne: true,
            },

            projectId: {
              $in: projectIds,
            },
          })

          .populate(
            'assignedTo',
            'name email role',
          )

          .populate(
            'projectId',
            'title archived deleted',
          )

          .sort({
            updatedAt: -1,
          });
    }

    return tasks.map((task: any) => {
      const serialized = JSON.parse(JSON.stringify(task));
      return {
        ...serialized,
        id: serialized._id,
        _id: serialized._id,
      };
    });
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

    const projectId =
      body.projectId;

    const status =
      body.status || 'todo';

    const label =
      String(
        body.label || 'General',
      ).trim();

    const assignedTo =
      body.assignedTo || null;

    if (!title || !projectId) {
      throw new BadRequestException(
        'Task title and project are required.',
      );
    }

    if (
      ![
        'todo',
        'in-progress',
        'done',
      ].includes(status)
    ) {
      throw new BadRequestException(
        'Invalid task status.',
      );
    }

    const project =
      await this.projectModel.findOne({
        _id: projectId,

        workspaceId:
          user.workspaceId,

        deleted: {
          $ne: true,
        },
      });

    if (!project) {
      throw new NotFoundException(
        'Project not found.',
      );
    }

    if (project.archived) {
      throw new BadRequestException(
        'You cannot add tasks to an archived project.',
      );
    }

    if (assignedTo) {
      const isMember =
        project.members.some(
          (id: any) =>
            id.toString() ===
            assignedTo.toString(),
        );

      const employee =
        await this.userModel.findOne({
          _id: assignedTo,

          workspaceId:
            user.workspaceId,

          role: 'employee',
        });

      if (!isMember || !employee) {
        throw new BadRequestException(
          'The assignee must be an employee on this project.',
        );
      }
    }

    const task =
      await this.taskModel.create({
        projectId,

        workspaceId:
          user.workspaceId,

        title,

        description,

        status,

        label,

        assignedTo,
      });

    const updatedProject = await this.projectModel.findOneAndUpdate(
      {
        _id: projectId,

        workspaceId:
          user.workspaceId,
      },

      {
        $addToSet: {
          tasks: task._id,
        },
      },
      { new: true }
    );

    console.log('Task created:', task._id);
    console.log('Project updated with task:', updatedProject?._id);

    const populatedTask = await this.taskModel
      .findById(task._id)
      .populate(
        'assignedTo',
        'name email role',
      );

    const serialized = JSON.parse(JSON.stringify(populatedTask));

    return {
      ...serialized,
      id: serialized._id,
      _id: serialized._id,
    };
  }

  async update(
    taskId: string,
    body: any,
    user: any,
  ) {
    const task =
      await this.getTaskWithProject(
        taskId,
        user.workspaceId,
      );

    if (
      !task ||
      !task.projectId
    ) {
      throw new NotFoundException(
        'Task not found.',
      );
    }

    const onlyStatusChange =
      Object.keys(body).every(
        (key) => key === 'status',
      );

    if (user.role !== 'admin') {
      if (
        !onlyStatusChange ||
        !this.employeeCanAccessTask(
          task,
          user._id,
        )
      ) {
        throw new ForbiddenException(
          'You can only update the status of tasks in your assigned projects.',
        );
      }
    }

    if (
      body.status !== undefined
    ) {
      if (
        ![
          'todo',
          'in-progress',
          'done',
        ].includes(body.status)
      ) {
        throw new BadRequestException(
          'Invalid task status.',
        );
      }

      task.status =
        body.status;
    }

    if (user.role === 'admin') {
      if (
        body.title !== undefined
      ) {
        task.title =
          String(
            body.title,
          ).trim();
      }

      if (
        body.description !==
        undefined
      ) {
        task.description =
          String(
            body.description,
          ).trim();
      }

      if (
        body.label !== undefined
      ) {
        task.label =
          String(
            body.label,
          ).trim();
      }

      if (
        body.assignedTo !==
        undefined
      ) {
        const assignedTo =
          body.assignedTo ||
          null;

        if (assignedTo) {
          const isMember =
            (
              task.projectId as any
            ).members.some(
              (id: any) =>
                id.toString() ===
                assignedTo.toString(),
            );

          const employee =
            await this.userModel.findOne({
              _id: assignedTo,

              workspaceId:
                user.workspaceId,

              role: 'employee',
            });

          if (
            !isMember ||
            !employee
          ) {
            throw new BadRequestException(
              'The assignee must be an employee on this project.',
            );
          }
        }

        task.assignedTo =
          assignedTo;
      }
    }

    await task.save();

    const populatedTask = await this.taskModel
      .findById(task._id)
      .populate(
        'assignedTo',
        'name email role',
      );

    const serialized = JSON.parse(JSON.stringify(populatedTask));

    return {
      ...serialized,
      id: serialized._id,
      _id: serialized._id,
    };
  }

  async archive(
    taskId: string,
    user: any,
  ) {
    const task =
      await this.taskModel.findOne({
        _id: taskId,

        workspaceId:
          user.workspaceId,

        deleted: {
          $ne: true,
        },
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found.',
      );
    }

    task.archived = true;

    await task.save();

    return {
      message:
        'Task archived successfully.',
    };
  }

  async restore(
    taskId: string,
    user: any,
  ) {
    const task =
      await this.taskModel.findOne({
        _id: taskId,

        workspaceId:
          user.workspaceId,

        deleted: {
          $ne: true,
        },
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found.',
      );
    }

    task.archived = false;

    await task.save();

    return {
      message:
        'Task restored successfully.',
    };
  }

  async delete(
    taskId: string,
    user: any,
  ) {
    const task =
      await this.taskModel.findOne({
        _id: taskId,

        workspaceId:
          user.workspaceId,

        deleted: {
          $ne: true,
        },
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found.',
      );
    }

    task.deleted = true;
    task.archived = false;

    await task.save();

    return {
      message:
        'Task deleted successfully.',
    };
  }
}