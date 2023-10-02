const router = require('express').Router();
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

const {
  uploadVideo,
  getVideo,
  getVideos,
} = require('../controllers/vidoeController');

router.post('/upload', upload.single('video'), uploadVideo);
router.get('/:id', upload.single('video'), getVideo);
router.get('/', upload.single('video'), getVideos);

module.exports = router;
