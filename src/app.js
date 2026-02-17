import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { corsConfig } from './config/cors.js';

const app = express();
app.use(helmet());
// CORS configured centrally in src/config/cors.js
app.use(corsConfig);

// Request logger: print every incoming request to the console
app.use((req, res, next) => {
	const origin = req.headers.origin || 'N/A';
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Origin: ${origin}`);
	next();
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.use(errorHandler);

export default app;
