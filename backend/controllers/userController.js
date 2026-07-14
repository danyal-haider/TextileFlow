const User = require('../models/User');
const Order = require('../models/Order');
const Bid = require('../models/Bid');
const Machine = require('../models/Machine');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Production = require('../models/Production');
const QcReport = require('../models/QcReport');
const fs = require('fs');
const path = require('path');
const generateToken = (id) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyName: user.companyName,
            profilePic: user.profilePic || '',
            phone: user.phone || '',
            country: user.country || '',
            city: user.city || '',
            address: user.address || '',
            about: user.about || ''
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        console.log("updateUserProfile called");
        console.log("User retrieved from token:", req.user ? req.user._id : "No user");

        const user = await User.findById(req.user._id);
        console.log("User found in DB:", user ? "Yes" : "No");

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            if (req.body.companyName !== undefined) user.companyName = req.body.companyName;
            if (req.body.profilePic !== undefined) user.profilePic = req.body.profilePic;
            if (req.body.phone !== undefined) user.phone = req.body.phone;
            if (req.body.country !== undefined) user.country = req.body.country;
            if (req.body.city !== undefined) user.city = req.body.city;
            if (req.body.address !== undefined) user.address = req.body.address;
            if (req.body.about !== undefined) user.about = req.body.about;

            if (req.body.password) {
                console.log("Updating password...");
                user.password = req.body.password;
            }

            console.log("Attempting to save user...");
            const updatedUser = await user.save();
            console.log("User saved successfully");

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                companyName: updatedUser.companyName,
                profilePic: updatedUser.profilePic || '',
                phone: updatedUser.phone || '',
                country: updatedUser.country || '',
                city: updatedUser.city || '',
                address: updatedUser.address || '',
                about: updatedUser.about || '',
                token: generateToken(updatedUser._id),
            });
        } else {
            console.log("User not found via findById");
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Update Profile CRITICAL Error:", error);
        res.status(500).json({ message: error.message || 'Server Error updating profile' });
    }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide current and new passwords' });
    }
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error changing password' });
    }
};

// @desc    Verify current password
// @route   POST /api/users/verify-password
// @access  Private
const verifyPassword = async (req, res) => {
    const { currentPassword } = req.body;
    if (!currentPassword) {
        return res.status(400).json({ message: 'Please provide current password' });
    }
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password', success: false });
        }
        res.status(200).json({ success: true, message: 'Password verified' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error verifying password' });
    }
};

const getUsers = async (req, res) => {
    const users = await User.find({});
    res.json(users);
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (user) {
            // Helper to delete local uploaded files
            const deleteFileFromUrl = (fileUrl) => {
                if (!fileUrl) return;
                try {
                    const parts = fileUrl.split('/uploads/');
                    if (parts.length > 1) {
                        const filename = parts[parts.length - 1];
                        const localPath = path.join(__dirname, '..', 'uploads', filename);
                        if (fs.existsSync(localPath)) {
                            fs.unlinkSync(localPath);
                            console.log(`Deleted file: ${localPath}`);
                        }
                    }
                } catch (err) {
                    console.error(`Failed to delete local file for URL ${fileUrl}:`, err);
                }
            };

            // 1. Delete user profile picture file
            if (user.profilePic) {
                deleteFileFromUrl(user.profilePic);
            }

            // 2. Find all orders associated with this user
            const userOrders = await Order.find({ user: userId });
            const manufacturerOrders = await Order.find({ manufacturer: userId });
            const orderIds = [...userOrders.map(o => o._id), ...manufacturerOrders.map(o => o._id)];

            // 3. Find and clean up QC Reports and files
            const qcReports = await QcReport.find({
                $or: [
                    { order: { $in: orderIds } },
                    { manufacturer: userId }
                ]
            });
            qcReports.forEach(report => {
                if (report.productImages && report.productImages.length > 0) {
                    report.productImages.forEach(img => deleteFileFromUrl(img));
                }
                if (report.defectImages && report.defectImages.length > 0) {
                    report.defectImages.forEach(img => deleteFileFromUrl(img));
                }
            });
            await QcReport.deleteMany({ _id: { $in: qcReports.map(r => r._id) } });

            // 4. Find and clean up Chat Messages and attachments
            const messages = await Message.find({
                $or: [
                    { order: { $in: orderIds } },
                    { sender: userId }
                ]
            });
            messages.forEach(msg => {
                if (msg.attachment && msg.attachment.url) {
                    deleteFileFromUrl(msg.attachment.url);
                }
            });
            await Message.deleteMany({ _id: { $in: messages.map(m => m._id) } });

            // 5. Delete Bids placed by user or on their orders
            await Bid.deleteMany({
                $or: [
                    { manufacturer: userId },
                    { order: { $in: orderIds } }
                ]
            });

            // 6. Delete Production logs
            await Production.deleteMany({ order: { $in: orderIds } });

            // 7. Delete Notifications
            await Notification.deleteMany({
                $or: [
                    { user: userId },
                    { order: { $in: orderIds } }
                ]
            });

            // 8. Delete Machines
            await Machine.deleteMany({ user: userId });

            // 9. Delete Orders
            await Order.deleteMany({ _id: { $in: orderIds } });

            // 10. Delete the User
            await User.findByIdAndDelete(userId);

            res.json({ message: 'User and all associated database records and files cleaned up successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUsers,
    deleteUser,
    changePassword,
    verifyPassword
};
