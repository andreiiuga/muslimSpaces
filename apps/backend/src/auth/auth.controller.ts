import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import { loginSchema, signupSchema, updatePreferredLocaleSchema } from "@muslimspaces/shared";
import type { LoginPayload, SignupPayload, UpdatePreferredLocalePayload } from "@muslimspaces/shared";
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

  @Patch("me/locale")
  @UseGuards(JwtAuthGuard)
  updateLocale(
    @Body(new ZodValidationPipe(updatePreferredLocaleSchema)) body: UpdatePreferredLocalePayload,
    @CurrentUser() user: RequestUser,
  ) {
    return this.authService.updatePreferredLocale(user.userId, body.preferredLocale);
  }
}
