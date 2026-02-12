const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET CART
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product');

        if (!cart) {
            cart = { items: [], totalPrice: 0 };
        }

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ADD TO CART
router.post('/add', auth, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        // Calculate total
        await cart.populate('items.product');
        cart.totalPrice = cart.items.reduce(
            (sum, item) => sum + (item.product.price * item.quantity), 0
        );

        await cart.save();
        res.json({ message: 'Added to cart!', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE QUANTITY
router.put('/update', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.find(
            item => item.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({ message: 'Item not in cart' });
        }

        if (quantity <= 0) {
            cart.items = cart.items.filter(
                item => item.product.toString() !== productId
            );
        } else {
            item.quantity = quantity;
        }

        await cart.populate('items.product');
        cart.totalPrice = cart.items.reduce(
            (sum, item) => sum + (item.product.price * item.quantity), 0
        );

        await cart.save();
        res.json({ message: 'Cart updated!', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// REMOVE FROM CART
router.delete('/remove/:productId', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== req.params.productId
        );

        await cart.populate('items.product');
        cart.totalPrice = cart.items.reduce(
            (sum, item) => sum + (item.product.price * item.quantity), 0
        );

        await cart.save();
        res.json({ message: 'Item removed!', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// CLEAR CART
router.delete('/clear', auth, async (req, res) => {
    try {
        await Cart.findOneAndDelete({ user: req.user._id });
        res.json({ message: 'Cart cleared!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;