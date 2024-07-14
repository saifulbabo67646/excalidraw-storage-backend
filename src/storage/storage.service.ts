import { Injectable, Logger } from '@nestjs/common';
import * as Keyv from 'keyv';
import S3Adapter from './S3Adapter';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  storagesMap = new Map<string, Keyv>();
  private s3BackendEnabled = false;

  constructor() {
    const uri: string = process.env[`STORAGE_URI`];
    const ttl: number = parseInt(process.env[`STORAGE_TTL`], 10);
    if (!uri) {
      this.logger.warn(
        `STORAGE_URI is undefined, will use non persistant in memory storage`,
      );
    }

    if (process.env.ENABLE_S3_BACKEND === 'true') {
      this.s3BackendEnabled = true;
    }

    Object.keys(StorageNamespace).forEach((namespace) => {
      let keyv; 
      if (this.s3BackendEnabled) {
        this.logger.log(`Using s3 provider ${namespace}`);
        const s3Options = {
          region: 'ap-northeast-1',
          accessKeyId: process.env.EXCALIDRAW_S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.EXCALIDRAW_S3_SECRET_ACCESS_KEY,
          bucket: process.env.EXCALIDRAW_S3_BUCKET_NAME,
          s3ForcePathStyle: false,
          endpoint: 'https://s3.amazonaws.com',
        };
        keyv = new Keyv({
          store: new S3Adapter({
            ...s3Options,
            bucket: s3Options.bucket
          }),        
          uri,
          namespace,
        });
      } else {
        this.logger.log(`Using default provider ${namespace}`);
        keyv = new Keyv(uri, {
          namespace,
          ttl,
        });
      }
      keyv.on('error', (err) =>
        this.logger.error(`Connection Error for namespace ${namespace}`, err),
      );
      this.storagesMap.set(namespace, keyv);
    });
  }
  get(key: string, namespace: StorageNamespace): Promise<Buffer> {
    return this.storagesMap.get(namespace).get(key);
  }
  async has(key: string, namespace: StorageNamespace): Promise<boolean> {
    return !!(await this.storagesMap.get(namespace).get(key));
  }
  set(
    key: string,
    value: Buffer | string,
    namespace: StorageNamespace,
  ): Promise<true> {
    return this.storagesMap.get(namespace).set(key, value);
  }
}

export enum StorageNamespace {
  SCENES = 'SCENES',
  ROOMS = 'ROOMS',
  FILES = 'FILES',
  SETTINGS = 'SETTINGS',
}
