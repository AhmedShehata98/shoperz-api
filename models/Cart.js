const mongoose = require('mongoose');
const { NotFoundError } = require('../middlewares/errorhandler');

class CartClass {
  async addItem(productId, quantity) {
    try {
      const existingItemIndex = this.items.findIndex(
        (item) => item.productId.toString() === productId.toString()
      );
      if (existingItemIndex !== -1) {
        throw new Error('Product already exists in the cart');
      }
      this.items.push({ productId, quantity });
      this.save();
      return this;
    } catch (error) {
      throw error;
    }
  }

  async removeItem(productId) {
    await this.updateOne({ $pull: { items: { productId } } });
  }

  async updateItemQuantity(productId, quantity) {
    try {
      const itemIndex = this.items.findIndex((item) => item.productId.toString() === productId.toString());

      if (itemIndex !== -1) {
        this.items[itemIndex].quantity = quantity;
      } else throw new NotFoundError('cart item not found');

      await this.save();

      return this;
    } catch (error) {
      // Handle the error appropriately
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  async getCartTotal() {
    await this.populate('items.productId');
    let total = 0;
    for (const item of this.items) {
      total += item.productId.price * item.quantity;
    }
    return total;
  }

  async getCartDiscountedTotal() {
    await this.populate('items.productId');
    let discountedTotal = 0;
    for (const item of this.items) {
      let discountedPrice = item.productId.price * ((100 - item.productId.discount) / 100);
      discountedTotal += discountedPrice * item.quantity;
    }
    return +discountedTotal.toFixed(2);
  }
  // statics
  //create user cart

  static async createUserCart(userId) {
    let cart = new this({ userId });
    let userCart = await cart.save();
    return userCart;
  }
}

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

cartSchema.loadClass(CartClass);

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
