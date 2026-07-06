// Сервис отправки email-уведомлений
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { FastifyBaseLogger } from 'fastify';

export class EmailService {
  constructor(
    private transporter: Transporter,
    private logger: FastifyBaseLogger
  ) { }

  // Отправить письмо.
  async send(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: '"KeyMarket" <noreply@keymarket.local>',
      to,
      subject,
      html,
    });

    this.logger.info('Email sent: %s', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      this.logger.info('Preview URL: %s', previewUrl);
    }
    return info;
  }
}