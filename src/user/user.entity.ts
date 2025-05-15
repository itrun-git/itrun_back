import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserPurpose {
  PERSONAL = 'personal',
  TEAM = 'team',
  EVENTS = 'events',
  OTHER = 'other',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ name: 'password_hash', nullable: false })
  passwordHash: string;

  @Column({ name: 'full_name', nullable: false })
  fullName: string;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl?: string;

  @Column({
    type: 'enum',
    enum: UserPurpose,
    nullable: false,
  })
  purpose: UserPurpose;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'verification_token', type: 'varchar', nullable: true })
  verificationToken?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
