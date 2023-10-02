const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`app running on port ${port}`);
});
