// Сервис отправки email-уведомлений
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export class EmailService {
  constructor(private transporter: Transporter) {}
  /**
   * Отправить письмо.
   * @param to - адрес получателя
   * @param subject - тема письма
   * @param html - HTML-содержимое письма
   */
  async send(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: '"KeyMarket" <noreply@keymarket.local>',
      to,
      subject,
      html,
    });

    console.log('Email sent:', info.messageId);
    // Ссылка на просмотр письма в Ethereal (только для тестового транспорта)
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL:', previewUrl);
    }
    return info;
  }
}