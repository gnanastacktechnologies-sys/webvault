import express from 'express';
import {
  getWebsites,
  getWebsite,
  createWebsite,
  updateWebsite,
  deleteWebsite,
  toggleFavorite,
} from '../controllers/websiteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth protection middleware to all website routes
router.use(protect);

router.route('/')
  .get(getWebsites)
  .post(createWebsite);

router.route('/:id')
  .get(getWebsite)
  .put(updateWebsite)
  .delete(deleteWebsite);

router.patch('/:id/favorite', toggleFavorite);

export default router;
