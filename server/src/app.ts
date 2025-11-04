import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import apiRoutes from './routes'; // Your main API router

// Create the Express app instance
export const app: Express = express();


app.use(cors());


app.use(express.json());



app.use('/api', apiRoutes);


app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is running!' });
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); 
  res.status(500).json({ message: 'Something went wrong!' });
});