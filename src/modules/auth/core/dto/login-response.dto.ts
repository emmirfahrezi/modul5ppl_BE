import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../../users/core/dto/user-response.dto';

export class LoginResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  user: UserResponseDto;
}
