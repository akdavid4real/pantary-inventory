import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class SignUpDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  displayName!: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class RefreshSessionDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6, maxLength: 6, example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'token must be a 6-digit code' })
  token!: string;
}

export class ResendConfirmationDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}
