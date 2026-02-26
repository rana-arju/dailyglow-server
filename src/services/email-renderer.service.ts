import { EmailBlock, EmailTemplate, EmailRenderContext } from '../types/email.types';
import juice from 'juice';

export class EmailRendererService {
  private readonly MAX_WIDTH = 600;
  private readonly SAFE_FONTS = 'Arial, Helvetica, sans-serif';

  /**
   * Render email template to production-ready HTML
   */
  public renderTemplate(template: EmailTemplate, context: EmailRenderContext): string {
    const { blocks, settings } = template;
    const bgColor = settings?.backgroundColor || '#f4f4f4';
    const contentWidth = settings?.contentWidth || this.MAX_WIDTH;
    const fontFamily = settings?.fontFamily || this.SAFE_FONTS;

    const preheader = this.renderPreheader(context.campaign.previewText);
    const bodyContent = blocks.map((block) => this.renderBlock(block, context)).join('');
    const footer = this.renderFooter(context);
    const trackingPixel = this.renderTrackingPixel(context.trackingPixelUrl);

    const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting">
  <title>${this.escapeHtml(context.campaign.subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse; border-spacing: 0; margin: 0;}
    div, td {padding: 0;}
    div {margin: 0 !important;}
  </style>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        min-width: 100% !important;
      }
      .mobile-padding {
        padding-left: 10px !important;
        padding-right: 10px !important;
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
      .mobile-hide {
        display: none !important;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: ${fontFamily};">
  ${preheader}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: ${bgColor};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${contentWidth}" class="email-container" style="max-width: ${contentWidth}px; background-color: #ffffff;">
          ${bodyContent}
        </table>
        ${footer}
      </td>
    </tr>
  </table>
  ${trackingPixel}
</body>
</html>`;

    return juice(html, {
      preserveMediaQueries: true,
      preserveFontFaces: true,
      removeStyleTags: false,
    });
  }

  private renderPreheader(text?: string): string {
    if (!text) return '';
    return `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${this.escapeHtml(text)}</div>`;
  }

  private renderBlock(block: EmailBlock, context: EmailRenderContext): string {
    switch (block.type) {
      case 'text':
        return this.renderTextBlock(block, context);
      case 'image':
        return this.renderImageBlock(block, context);
      case 'button':
        return this.renderButtonBlock(block, context);
      case 'divider':
        return this.renderDividerBlock(block);
      case 'spacer':
        return this.renderSpacerBlock(block);
      case 'columns':
        return this.renderColumnsBlock(block, context);
      default:
        return '';
    }
  }

  private renderTextBlock(block: EmailBlock, context: EmailRenderContext): string {
    const content = this.replaceVariables(block.content || '', context);
    const padding = block.padding || '20px';
    const textAlign = block.textAlign || 'left';
    const fontSize = block.fontSize || 16;
    const color = block.textColor || '#333333';
    const fontWeight = block.fontWeight || 'normal';

    return `
    <tr>
      <td style="padding: ${padding}; text-align: ${textAlign}; font-size: ${fontSize}px; color: ${color}; font-weight: ${fontWeight}; line-height: 1.6;">
        ${content}
      </td>
    </tr>`;
  }

  private renderImageBlock(block: EmailBlock, context: EmailRenderContext): string {
    if (!block.src) return '';

    const padding = block.padding || '20px';
    const textAlign = block.textAlign || 'center';
    const alt = this.escapeHtml(block.alt || '');
    const width = block.width || '100%';

    let imageHtml = `<img src="${block.src}" alt="${alt}" style="display: block; max-width: 100%; height: auto; border: 0;" width="${width}" />`;

    if (block.link) {
      const trackedUrl = this.createTrackedUrl(block.link, context);
      imageHtml = `<a href="${trackedUrl}" style="text-decoration: none;">${imageHtml}</a>`;
    }

    return `
    <tr>
      <td style="padding: ${padding}; text-align: ${textAlign};">
        ${imageHtml}
      </td>
    </tr>`;
  }

  private renderButtonBlock(block: EmailBlock, context: EmailRenderContext): string {
    const buttonText = this.escapeHtml(block.buttonText || 'Click Here');
    const buttonUrl = this.createTrackedUrl(block.buttonUrl || '#', context);
    const padding = block.padding || '20px';
    const textAlign = block.textAlign || 'center';
    const bgColor = block.backgroundColor || '#007bff';
    const textColor = block.textColor || '#ffffff';
    const borderRadius = block.borderRadius || 4;

    return `
    <tr>
      <td style="padding: ${padding}; text-align: ${textAlign};">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${buttonUrl}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="${borderRadius}%" stroke="f" fillcolor="${bgColor}">
          <w:anchorlock/>
          <center style="color:${textColor};font-family:${this.SAFE_FONTS};font-size:16px;font-weight:bold;">${buttonText}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${buttonUrl}" style="display: inline-block; padding: 12px 30px; background-color: ${bgColor}; color: ${textColor}; text-decoration: none; border-radius: ${borderRadius}px; font-weight: bold; font-size: 16px; font-family: ${this.SAFE_FONTS};">${buttonText}</a>
        <!--<![endif]-->
      </td>
    </tr>`;
  }

  private renderDividerBlock(block: EmailBlock): string {
    const padding = block.padding || '20px';
    const color = block.backgroundColor || '#dddddd';
    const height = block.height || 1;

    return `
    <tr>
      <td style="padding: ${padding};">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="border-top: ${height}px solid ${color};"></td>
          </tr>
        </table>
      </td>
    </tr>`;
  }

  private renderSpacerBlock(block: EmailBlock): string {
    const height = block.height || 20;
    return `
    <tr>
      <td style="height: ${height}px; line-height: ${height}px; font-size: 1px;">&nbsp;</td>
    </tr>`;
  }

  private renderColumnsBlock(block: EmailBlock, context: EmailRenderContext): string {
    if (!block.columns || block.columns.length === 0) return '';

    const padding = block.padding || '20px';
    const columnCount = block.columns.length;
    const columnWidth = Math.floor(100 / columnCount);

    const columnsHtml = block.columns
      .map((columnBlocks) => {
        const columnContent = columnBlocks.map((b) => this.renderBlock(b, context)).join('');
        return `
        <td width="${columnWidth}%" valign="top" class="mobile-stack" style="padding: 10px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${columnContent}
          </table>
        </td>`;
      })
      .join('');

    return `
    <tr>
      <td style="padding: ${padding};">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            ${columnsHtml}
          </tr>
        </table>
      </td>
    </tr>`;
  }

  private renderFooter(context: EmailRenderContext): string {
    return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="${this.MAX_WIDTH}" class="email-container" style="max-width: ${this.MAX_WIDTH}px; margin-top: 20px;">
      <tr>
        <td style="padding: 20px; text-align: center; font-size: 12px; color: #666666; line-height: 1.5;">
          <p style="margin: 0 0 10px 0;">You received this email because you subscribed to our mailing list.</p>
          <p style="margin: 0 0 10px 0;">
            <a href="${context.unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
          </p>
          <p style="margin: 0;">© ${new Date().getFullYear()} ${this.escapeHtml(context.campaign.fromName)}. All rights reserved.</p>
        </td>
      </tr>
    </table>`;
  }

  private renderTrackingPixel(url: string): string {
    return `<img src="${url}" width="1" height="1" border="0" alt="" style="display:block;" />`;
  }

  private replaceVariables(content: string, context: EmailRenderContext): string {
    return content
      .replace(/\{\{firstName\}\}/g, this.escapeHtml(context.contact.firstName || ''))
      .replace(/\{\{lastName\}\}/g, this.escapeHtml(context.contact.lastName || ''))
      .replace(/\{\{email\}\}/g, this.escapeHtml(context.contact.email));
  }

  private createTrackedUrl(originalUrl: string, context: EmailRenderContext): string {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const params = new URLSearchParams({
      t: context.trackingToken,
      c: context.campaignId,
      u: originalUrl,
    });
    return `${baseUrl}/api/track/click?${params.toString()}`;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
