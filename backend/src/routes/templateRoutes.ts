import { Router } from 'express';
import { authGuard } from '../middleware/auth.js';
import { 
  create, 
  list, 
  get, 
  remove, 
  update,
  apply
} from '../controllers/templateController.js';

const router = Router();

// All template routes require authentication
router.use(authGuard);

// Template Operations
router.post('/apply', apply);

// Template CRUD
router.post('/', create);
router.get('/', list);
router.get('/:id', get);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
