const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRouter = require('./routes/auth.router');
const { errHandler, NotFoundError } = require('./middlewares/errorhandler');
const connectDB = require('./configs/db');
const uploadRouter = require('./routes/upload.router');
const categoryRouter = require('./routes/category.router');
const productRouter = require('./routes/product.router');
const cartRouter = require('./routes/cart.router');
const userRouter = require('./routes/user.router');
require('dotenv').config();
const shoperz = express();
const corsOptions = {
  origin: process.env.origin || '*',
  credentials: true,
};

connectDB();

// MIDDLEWARES
shoperz.use(helmet());
shoperz.use(express.urlencoded({ extended: true }));
shoperz.use(express.json());
shoperz.use(cors(corsOptions));
// ROUTES
shoperz.use('/auth', authRouter);
shoperz.use('/upload', uploadRouter);
shoperz.use('/categories', categoryRouter);
shoperz.use('/products', productRouter);
shoperz.use('/cart', cartRouter);
shoperz.use('/users', userRouter);

// ERROR HANDLING
shoperz.use('*', (req, res, next) => next(new NotFoundError('this path not found')));
shoperz.use(errHandler);

// START SERVER ON PORT
const PORT = process.env.PORT || 4000;

shoperz.listen(PORT, () => {
  console.log('API RUNNING');
});
