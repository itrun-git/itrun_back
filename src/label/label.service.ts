import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
  ) {}

  async create(dto: CreateLabelDto): Promise<Label> {
    const label = this.labelRepository.create(dto);
    return this.labelRepository.save(label);
  }

  async findAll(): Promise<Label[]> {
    return this.labelRepository.find();
  }

  async findOne(id: string): Promise<Label> {
    const label = await this.labelRepository.findOneBy({ id });
    if (!label) throw new NotFoundException('Label not found');
    return label;
  }

  async update(id: string, dto: UpdateLabelDto): Promise<Label> {
    const label = await this.findOne(id);
    Object.assign(label, dto);
    return this.labelRepository.save(label);
  }

  async remove(id: string): Promise<void> {
    const label = await this.findOne(id);
    await this.labelRepository.remove(label);
  }
}
