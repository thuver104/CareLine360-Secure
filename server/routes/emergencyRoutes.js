const express = require('express');
const router = express.Router();
const {
    createEmergency,
    getAllEmergencies,
    getEmergencyById,
    updateStatus,
    getNearestHospital,
} = require('../controllers/emergencyController');
const { validateEmergency, validateStatusUpdate, getMongoIdValidate } = require('../validators/emergencyValidator');
const validateRequest = require('../middleware/validateRequest');

router.post('/', validateEmergency, createEmergency);
router.get('/', getAllEmergencies);
router.get('/:id', getMongoIdValidate, validateRequest, getEmergencyById);
router.patch('/:id/status', getMongoIdValidate, validateStatusUpdate, updateStatus);
router.get('/:id/nearest-hospital', getMongoIdValidate, getNearestHospital);

module.exports = router;
