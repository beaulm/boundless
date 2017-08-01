let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
	return res.status(200).send({code: 200, message: 'Yay!'});
});

module.exports = router;
