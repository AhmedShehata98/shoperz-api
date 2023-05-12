const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const { sendEmail } = require('../configs/nodemailer');
const envVars = require('../configs/env');
const logger = require('../middlewares/logger');
const path = require('path');
const Wishlist = require('./Wishlist');

class UserClass {
  async createWishlist() {
    try {
      let wishlist = new Wishlist({ userId: this._id, products: [] });
      let userWishlist = await wishlist.save();
      return userWishlist;
    } catch (error) {
      throw new Error('error in creating user wishlist', error);
    }
  }
  async changePassword(currentPassword, newPassword) {
    try {
      const isMatch = await this.comparePasswordAsync(currentPassword);

      if (!isMatch) {
        throw new Error('Incorrect current password');
      }

      const salt = await bcrypt.genSalt(envVars.slatRounds);
      const hash = await bcrypt.hash(newPassword, salt);

      this.password = hash;
      await this.save();

      return 'Password changed successfully';
    } catch (error) {
      throw error;
    }
  }

  comparePassword(password, callback) {
    let user = this;
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return callback(err);
      }
      callback(null, isMatch);
    });
  }

  sendVerifyEmail(cb) {
    const verifyUrl =
      process.env.NODE_ENV == 'development'
        ? `${envVars.apiUrl}:${process.env.PORT}/auth/verify-email?token=${this.verifyCode}`
        : `${envVars.apiUrl}/auth/verify-email?token=${this.verifyCode}`;
    ejs.renderFile(
      path.resolve(path.join(process.cwd(), './views/verifyEmail.ejs')),
      { verifyUrl },
      (err, html) => {
        if (err) logger.error(err);
        let mailOptions = {
          from: 'shoperz team',
          to: this.email,
          subject: 'Shoperz verify your email',
          html: html,
        };
        sendEmail(mailOptions, cb);
      }
    );
  }

  createToken() {
    return jwt.sign({ userId: this._id }, envVars.jwtSecret);
  }
}

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verifyCode: {
      type: String,
      required: true,
      unique: true,
      default: require('crypto').randomBytes(4).toString('hex'),
    },
    role: {
      type: String,
      required: true,
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', function (next) {
  const user = this;

  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(envVars.slatRounds, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

userSchema.loadClass(UserClass);

const User = mongoose.model('User', userSchema);

module.exports = User;
