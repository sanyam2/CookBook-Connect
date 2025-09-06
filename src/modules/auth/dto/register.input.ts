import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  username: string;

  // @Field()
  // @IsString()
  // @IsNotEmpty()
  // firstName: string;

  // @Field()
  // @IsString()
  // @IsNotEmpty()
  // lastName: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}
