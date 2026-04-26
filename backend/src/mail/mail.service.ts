import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { email_job_status, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EnqueueEmailDto } from './dto/enqueue-email.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async enqueue(dto: EnqueueEmailDto) {
    const messageId = dto.messageId ?? randomUUID();

    const payload = {
      to: dto.recipientEmail,
      from: dto.from ?? this.config.get<string>('MAIL_FROM', 'noreply@jobfair.ba'),
      subject: dto.subject,
      html: dto.html ?? null,
      text: dto.text ?? null,
      metadata: dto.metadata ?? null,
    } as Prisma.InputJsonValue;

    const job = await this.prisma.email_jobs.create({
      data: {
        queue_name: dto.queueName,
        message_id: messageId,
        recipient_email: dto.recipientEmail,
        payload,
      },
    });

    await this.prisma.email_send_log.create({
      data: {
        recipient_email: dto.recipientEmail,
        template_name: dto.queueName,
        status: 'pending',
        message_id: messageId,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    return {
      id: job.id,
      messageId: job.message_id,
      status: job.status,
    };
  }

  async processQueue(batchSize = 10) {
    const now = new Date();

    const jobs = await this.prisma.email_jobs.findMany({
      where: {
        OR: [
          { status: email_job_status.pending },
          {
            status: email_job_status.retry_scheduled,
            next_retry_at: { lte: now },
          },
        ],
      },
      orderBy: { created_at: 'asc' },
      take: batchSize,
    });

    let sent = 0;
    let failed = 0;
    let dlq = 0;

    for (const job of jobs) {
      await this.prisma.email_jobs.update({
        where: { id: job.id },
        data: { status: email_job_status.processing },
      });

      try {
        await this.sendViaMailgun(job.payload as Record<string, unknown>);

        await this.prisma.email_jobs.update({
          where: { id: job.id },
          data: {
            status: email_job_status.sent,
            attempt_count: { increment: 1 },
            last_error: null,
          },
        });

        await this.prisma.email_send_log.create({
          data: {
            recipient_email: job.recipient_email,
            template_name: job.queue_name,
            status: 'sent',
            message_id: job.message_id,
          },
        });

        sent += 1;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const nextAttemptCount = job.attempt_count + 1;

        if (nextAttemptCount >= job.max_attempts) {
          await this.prisma.$transaction(async (tx) => {
            await tx.email_jobs.update({
              where: { id: job.id },
              data: {
                status: email_job_status.dlq,
                attempt_count: nextAttemptCount,
                last_error: errorMessage,
              },
            });

            await tx.email_jobs_dlq.create({
              data: {
                queue_name: job.queue_name,
                message_id: job.message_id,
                recipient_email: job.recipient_email,
                payload: (job.payload ?? {}) as Prisma.InputJsonValue,
                reason: errorMessage.slice(0, 500),
              },
            });

            await tx.email_send_log.create({
              data: {
                recipient_email: job.recipient_email,
                template_name: job.queue_name,
                status: 'dlq',
                message_id: job.message_id,
                error_message: errorMessage.slice(0, 1000),
              },
            });
          });

          dlq += 1;
          continue;
        }

        const retryDelayMs = this.getRetryDelayMs(nextAttemptCount);

        await this.prisma.email_jobs.update({
          where: { id: job.id },
          data: {
            status: email_job_status.retry_scheduled,
            attempt_count: nextAttemptCount,
            next_retry_at: new Date(Date.now() + retryDelayMs),
            last_error: errorMessage,
          },
        });

        await this.prisma.email_send_log.create({
          data: {
            recipient_email: job.recipient_email,
            template_name: job.queue_name,
            status: 'failed',
            message_id: job.message_id,
            error_message: errorMessage.slice(0, 1000),
          },
        });

        failed += 1;
      }
    }

    return {
      processed: jobs.length,
      sent,
      failed,
      dlq,
    };
  }

  private async sendViaMailgun(payload: Record<string, unknown>) {
    const apiKey = this.config.get<string>('MAILGUN_API_KEY');
    const domain = this.config.get<string>('MAILGUN_DOMAIN');
    const region = this.config.get<string>('MAILGUN_REGION', 'EU').toUpperCase();

    if (!apiKey || !domain) {
      throw new InternalServerErrorException('Mailgun configuration missing');
    }

    const baseUrl =
      region === 'EU'
        ? `https://api.eu.mailgun.net/v3/${domain}/messages`
        : `https://api.mailgun.net/v3/${domain}/messages`;

    const form = new URLSearchParams();
    form.set('from', String(payload.from ?? this.config.get<string>('MAIL_FROM', 'noreply@jobfair.ba')));
    form.set('to', String(payload.to));
    form.set('subject', String(payload.subject ?? 'JobFAIR'));

    if (payload.html) {
      form.set('html', String(payload.html));
    }

    if (payload.text) {
      form.set('text', String(payload.text));
    }

    const authHeader = `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`;

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Mailgun send failed (${response.status}): ${body}`);
      throw new BadGatewayException(`Mailgun send failed: ${response.status}`);
    }

    return response.json();
  }

  private getRetryDelayMs(attempt: number) {
    const base = 30_000;
    return base * Math.pow(2, Math.max(0, attempt - 1));
  }
}
