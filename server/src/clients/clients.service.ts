import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Client,
  ClientDocument,
} from './clients.schema';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name)
    private readonly clientModel:
      Model<ClientDocument>,
  ) {}

  async findAll(workspaceId: any) {
    return this.clientModel
      .find({
        workspaceId,
        deleted: { $ne: true },
      })
      .sort({ createdAt: -1 });
  }

  async create(
    body: any,
    workspaceId: any,
  ) {
    const name =
      String(body.name || '').trim();

    if (!name) {
      throw new BadRequestException(
        'Client name is required.',
      );
    }

    return this.clientModel.create({
      name,

      company:
        String(body.company || '').trim(),

      email:
        String(body.email || '').trim(),

      phone:
        String(body.phone || '').trim(),

      address:
        String(body.address || '').trim(),

      notes:
        String(body.notes || '').trim(),

      workspaceId,

      deleted: false,
    });
  }

  async update(
    id: string,
    body: any,
    workspaceId: any,
  ) {
    const updateData = {
      name:
        String(body.name || '').trim(),

      company:
        String(body.company || '').trim(),

      email:
        String(body.email || '').trim(),

      phone:
        String(body.phone || '').trim(),

      address:
        String(body.address || '').trim(),

      notes:
        String(body.notes || '').trim(),
    };

    if (!updateData.name) {
      throw new BadRequestException(
        'Client name is required.',
      );
    }

    const client =
      await this.clientModel.findOneAndUpdate(
        {
          _id: id,
          workspaceId,
          deleted: { $ne: true },
        },
        updateData,
        {
          new: true,
        },
      );

    if (!client) {
      throw new NotFoundException(
        'Client not found.',
      );
    }

    return client;
  }

  async delete(
    id: string,
    workspaceId: any,
  ) {
    const client =
      await this.clientModel.findOneAndUpdate(
        {
          _id: id,
          workspaceId,
          deleted: { $ne: true },
        },
        {
          deleted: true,
        },
        {
          new: true,
        },
      );

    if (!client) {
      throw new NotFoundException(
        'Client not found.',
      );
    }

    return {
      message: 'Client deleted successfully.',
    };
  }
}