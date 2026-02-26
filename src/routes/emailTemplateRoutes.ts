import { Router } from 'express';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  seedDefaultTemplates
} from '../controllers/emailTemplateController';

const router = Router();

router.post('/templates', createTemplate);
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);
router.post('/templates/seed', seedDefaultTemplates);

export default router;
