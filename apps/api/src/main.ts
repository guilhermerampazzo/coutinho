import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  // Necessário para o `state` anti-CSRF do Sign in with Apple (cookie httpOnly de curta duração).
  app.use(cookieParser());
  app.enableCors({ origin: process.env.CORS_ORIGINS?.split(",") ?? true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.API_PORT ?? 3000;
  await app.listen(port, "0.0.0.0");
}
bootstrap();
