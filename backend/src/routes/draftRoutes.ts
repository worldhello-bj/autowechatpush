import { Router } from 'express';
import { authGuard } from '../middleware/auth.js';
import { 
  save, 
  list, 
  get, 
  remove
} from '../controllers/draftController.js';

const router = Router();

// All draft routes require authentication
router.use(authGuard);

// Draft CRUD
router.post('/', save);
router.get('/', list);
router.get('/:id', get);
router.delete('/:id', remove);

export default router;
