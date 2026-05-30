import QRCode from 'qrcode';
import { IQrCodeProvider, GenerateQrCodeInput } from '../../../application/ports';

export class QrCodeProvider implements IQrCodeProvider {
  async generateAsDataUrl(input: GenerateQrCodeInput): Promise<string> {
    return QRCode.toDataURL(input.content, {
      width: input.size ?? 300,
      margin: 2,
      errorCorrectionLevel: 'H',  // High — résistant aux dommages partiels
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }

  async generateAsBuffer(input: GenerateQrCodeInput): Promise<Buffer> {
    return QRCode.toBuffer(input.content, {
      width: input.size ?? 300,
      margin: 2,
      errorCorrectionLevel: 'H',
      type: 'png',
    });
  }
}
