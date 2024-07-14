import Keyv from 'keyv';
import { S3 } from 'aws-sdk';

const SEPARATOR_SIGN:string = ":";
const REPLACE_SEPARATOR_SIGN:string = "/";

class S3Adapter implements Keyv.Store<string | Buffer> {
  private s3: S3;
  private bucket: string;

  constructor(options: S3.ClientConfiguration & { bucket: string }) {
    this.s3 = new S3(options);
    this.bucket = options.bucket;
  }

  async get(key: string): Promise<string | undefined> {
    key = key.replace(SEPARATOR_SIGN,REPLACE_SEPARATOR_SIGN).toLowerCase();
    const getObjectParams: S3.GetObjectRequest = {
      Bucket: this.bucket,
      Key: key,
    };

    const data = await this.s3.getObject(getObjectParams).promise();
    return data.Body?.toString('utf-8');
  }

  async set(key: string, value: string): Promise<void> {
    key = key.replace(SEPARATOR_SIGN,REPLACE_SEPARATOR_SIGN).toLowerCase();
    const putObjectParams: S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: value,
    };

    await this.s3.putObject(putObjectParams).promise();
  }

  async delete(key: string): Promise<boolean> {
    key = key.replace(SEPARATOR_SIGN,REPLACE_SEPARATOR_SIGN).toLowerCase();
    try {
      const deleteObjectParams: S3.DeleteObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.deleteObject(deleteObjectParams).promise();
      return true;
    } catch (error) {
      return false;
    }
  }

  async clear(): Promise<void> {
    // Implement clearing logic, e.g., delete all objects in the bucket
    // Note: Be careful with this operation as it will delete all data in the bucket.
    // You might want to add a confirmation step or use a different approach.
  }
    
}

export default S3Adapter;