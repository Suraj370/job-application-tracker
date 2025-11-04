// Load .env variables BEFORE any other imports
import * as dotenv from 'dotenv';
dotenv.config();

import {app} from './src/app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});