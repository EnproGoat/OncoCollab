import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  try {
    const keyPath = join(process.cwd(), '..', 'certs', 'key.pem');
    const certPath = join(process.cwd(), '..', 'certs', 'cert.pem');
    console.log('Current working directory:', process.cwd());
    console.log('Attempting to load key from:', keyPath);
    console.log('Attempting to load cert from:', certPath);

    if (!require('fs').existsSync(keyPath)) {
      console.error(`Key file not found at: ${keyPath}`);
    }
    if (!require('fs').existsSync(certPath)) {
      console.error(`Cert file not found at: ${certPath}`);
    }

    const httpsOptions = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    };

    const app = await NestFactory.create(AppModule, {
      httpsOptions,
    });
    app.enableCors({
      origin: '*',
    });
    await app.listen(3000, '0.0.0.0');
    console.log('Application is listening on port 3000');
  } catch (error) {
    console.error('Error starting server:', error);
  }
}
bootstrap();
