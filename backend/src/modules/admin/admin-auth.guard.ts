import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly googleClient = new OAuth2Client();

  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')?.trim();
    if (!clientId) {
      throw new ServiceUnavailableException('Google admin authentication is not configured');
    }

    const authorization = String(
      context.switchToHttp().getRequest().headers.authorization ?? '',
    );
    const idToken = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : '';

    if (!idToken) throw new UnauthorizedException('Google sign-in is required');

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      const email = payload?.email?.toLowerCase();
      const allowedEmails = this.configService
        .get<string>('ADMIN_EMAILS', '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

      if (!payload?.email_verified || !email) {
        throw new UnauthorizedException('Google account email is not verified');
      }
      if (!allowedEmails.includes(email)) {
        throw new ForbiddenException('This Google account is not an LNDHub admin');
      }

      const request = context.switchToHttp().getRequest();
      request.admin = { sub: payload.sub, email, name: payload.name };
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Google credential is invalid or expired');
    }
  }
}
