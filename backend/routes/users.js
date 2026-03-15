// routes/users.js
const express = require('express');
const router = express.Router();
const { getAllUsers, getUser, updateUser, deleteUser, getStaffList } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/staff', protect, authorize('admin'), getStaffList);
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
