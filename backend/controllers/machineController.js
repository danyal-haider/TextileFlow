const Machine = require('../models/Machine');

// @desc    Get all machines for the logged-in manufacturer
// @route   GET /api/machines
// @access  Private (Manufacturer only)
const getMachines = async (req, res) => {
    try {
        if (req.user.role !== 'manufacturer') {
            return res.status(403).json({ message: 'Access denied: Manufacturers only' });
        }
        const machines = await Machine.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(machines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new machine
// @route   POST /api/machines
// @access  Private (Manufacturer only)
const createMachine = async (req, res) => {
    const { name, type, status } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: 'Please provide machine name and type' });
    }

    try {
        if (req.user.role !== 'manufacturer') {
            return res.status(403).json({ message: 'Access denied: Manufacturers only' });
        }

        const machine = await Machine.create({
            name,
            type,
            status: status || 'Available',
            user: req.user.id
        });

        res.status(201).json(machine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a machine
// @route   PUT /api/machines/:id
// @access  Private (Manufacturer only)
const updateMachine = async (req, res) => {
    const { name, type, status } = req.body;

    try {
        if (req.user.role !== 'manufacturer') {
            return res.status(403).json({ message: 'Access denied: Manufacturers only' });
        }

        const machine = await Machine.findById(req.params.id);

        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }

        // Check ownership
        if (machine.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to edit this machine' });
        }

        machine.name = name || machine.name;
        machine.type = type || machine.type;
        machine.status = status || machine.status;

        const updatedMachine = await machine.save();
        res.status(200).json(updatedMachine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a machine
// @route   DELETE /api/machines/:id
// @access  Private (Manufacturer only)
const deleteMachine = async (req, res) => {
    try {
        if (req.user.role !== 'manufacturer') {
            return res.status(403).json({ message: 'Access denied: Manufacturers only' });
        }

        const machine = await Machine.findById(req.params.id);

        if (!machine) {
            return res.status(404).json({ message: 'Machine not found' });
        }

        // Check ownership
        if (machine.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this machine' });
        }

        await Machine.findByIdAndDelete(req.params.id);
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMachines,
    createMachine,
    updateMachine,
    deleteMachine
};
