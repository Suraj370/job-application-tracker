import { Router } from 'express';
import { registerUser, loginUser, getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { LoginSchema, RegisterSchema } from '../validations/auth.validation';

const router = Router();

router.post('/register', validate(RegisterSchema), registerUser);
router.post('/login', validate(LoginSchema),loginUser);

router.get('/me', authMiddleware, getMe);

export default router;