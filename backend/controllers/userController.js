const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { Department } = require('../models/index');

// ===== USER CONTROLLER =====

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, page = 1, limit = 20, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).populate('department', 'name').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  res.json({ success: true, data: users, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('department', 'name code');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, data: user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, department, isActive, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, department, isActive, phone },
    { new: true, runValidators: true }
  );
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, data: user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isActive = false;
  await user.save();
  res.json({ success: true, message: 'User deactivated' });
});

exports.getStaffList = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: { $in: ['staff', 'admin'] }, isActive: true })
    .populate('department', 'name')
    .select('name email role department');
  res.json({ success: true, data: staff });
});

// ===== DEPARTMENT CONTROLLER =====

exports.getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true }).populate('head', 'name email');
  res.json({ success: true, data: departments });
});

exports.createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json({ success: true, data: department });
});

exports.updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!department) { res.status(404); throw new Error('Department not found'); }
  res.json({ success: true, data: department });
});

exports.deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!department) { res.status(404); throw new Error('Department not found'); }
  res.json({ success: true, message: 'Department deactivated' });
});
