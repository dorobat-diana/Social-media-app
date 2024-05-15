import express from 'express';
import { getAuthenticatedUserId ,getUsers, createUser ,getUser, deleteUser,updateUser,SyncData,getAllUsersForChart,verifyUser} from '../controllers/users_ctrl.js';


const router = express.Router();

router.get('/', getUsers);
router.post('/create', createUser);
router.get('/view/:id',getUser);
router.delete('/delete/:id', deleteUser);
router.put('/update/:id',updateUser);
router.post('/sync', SyncData);
router.get('/chart', getAllUsersForChart);
router.get('/verify/:email/:password', verifyUser);
router.get('/auth', getAuthenticatedUserId );

  

export default router;
