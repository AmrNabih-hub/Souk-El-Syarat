import { Injectable, Logger } from '@nestjs/common';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

@Injectable()
export class CompressionService {
  private readonly logger = new Logger(CompressionService.name);

  async compress(data: any, level: number = 6): Promise<Buffer> {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = await gzip(jsonString, { level });
      
      this.logger.debug(`Data compressed: ${jsonString.length} -> ${compressed.length} bytes`);
      
      return compressed;
    } catch (error) {
      this.logger.error('Error compressing data:', error);
      throw error;
    }
  }

  async decompress(compressedData: Buffer): Promise<any> {
    try {
      const decompressed = await gunzip(compressedData);
      const jsonString = decompressed.toString();
      const data = JSON.parse(jsonString);
      
      this.logger.debug(`Data decompressed: ${compressedData.length} -> ${jsonString.length} bytes`);
      
      return data;
    } catch (error) {
      this.logger.error('Error decompressing data:', error);
      throw error;
    }
  }
}