const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// PLACE ORDER
router.post('/place', auth, async (req, res) => {
    try {
        const { shippingAddress, paymentMethod } = req.body;

        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
        }));

        const subtotal = cart.totalPrice;
        const deliveryCharge = subtotal >= 499 ? 0 : 49;
        const totalAmount = subtotal + deliveryCharge;

        const order = new Order({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            deliveryCharge,
            totalAmount,
            trackingId: 'GZ' + Date.now().toString(36).toUpperCase()
        });

        await order.save();

        // Update stock
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { stock: -item.quantity }
            });
        }

        // Clear cart
        await Cart.findOneAndDelete({ user: req.user._id });

        res.status(201).json({
            message: 'Order placed successfully! 🎉',
            order
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET MY ORDERS
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product');

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET SINGLE ORDER
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product')
            .populate('user', 'name email phone');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// CANCEL ORDER
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (['shipped', 'delivered'].includes(order.orderStatus)) {
            return res.status(400).json({ message: 'Cannot cancel shipped/delivered order' });
        }

        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        await order.save();
        res.json({ message: 'Order cancelled', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ADMIN: UPDATE ORDER STATUS
router.put('/:id/status', adminAuth, async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                orderStatus,
                ...(orderStatus === 'delivered' && { deliveredAt: new Date() })
            },
            { new: true }
        );

        res.json({ message: 'Order status updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ADMIN: GET ALL ORDERS
router.get('/admin/all', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email phone')
            .populate('items.product');

        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
            pendingOrders: orders.filter(o => o.orderStatus === 'placed').length,
            deliveredOrders: orders.filter(o => o.orderStatus === 'delivered').length
        };

        res.json({ orders, stats });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;