import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceMemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  avatarUrl: string;
}
