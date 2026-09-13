import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import { changePasswordSchema, loginSchema, signupSchema, updateProfileSchema } from "@muslimspaces/shared";
import type {
  ChangePasswordPayload,
  LoginPayload,
  SignupPayload,
  UpdateProfilePayload,
} from "@muslimspaces/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser, RequestUser } from "./decorators/current-user.decorator";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(@Body(new ZodValidationPipe(signupSchema)) body: SignupPayload) {
    return this.authService.signup(body);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginPayload) {
    return this.authService.login(body);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.userId);
  }

  @Patch("me/profile")
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfilePayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.authService.updateProfile(user.userId, body);
  }

  @Post("change-password")
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordPayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.authService.changePassword(user.userId, body);
  }
}
