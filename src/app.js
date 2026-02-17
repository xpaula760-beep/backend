import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { CLIENT_URL } from './config/env.js';

const app = express();
app.use(helmet());
app.use(
	cors({
		origin: CLIENT_URL || 'http://localhost:3000',
		credentials: true
	})
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.use(errorHandler);

export default app;
