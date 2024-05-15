import express from 'express';
import { getPosts,createPost,deletePost,updatePost,getPost,syncPosts,getUserPosts} from '../controllers/posts_ctrl.js';

const router = express.Router();

router.get('/', getPosts);
router.post('/create', createPost);
router.delete('/delete/:id', deletePost);
router.put('/update/:id',updatePost);
router.get('/view/:id',getPost);
router.post('/sync', syncPosts);
router.get('/user',getUserPosts);

export default router;