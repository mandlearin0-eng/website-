const express = require('express');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// GET ALL PRODUCTS (with filters)
router.get('/', async (req, res) => {
    try {
        const {
            platform,
            condition,
            category,
            minPrice,
            maxPrice,
            search,
            sort,
            page = 1,
            limit = 12,
            featured,
            deals
        } = req.query;

        let query = { isActive: true };

        // Filters
        if (platform) query.platform = platform;
        if (condition) query.condition = condition;
        if (category) query.category = category;
        if (featured === 'true') query.isFeatured = true;
        if (deals === 'true') query.isDeal = true;

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (search) {
            query.$text = { $search: search };
        }

        // Sort options
        let sortOption = { createdAt: -1 };
        if (sort === 'price-low') sortOption = { price: 1 };
        if (sort === 'price-high') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { 'rating.average': -1 };
        if (sort === 'newest') sortOption = { createdAt: -1 };

        const skip = (Number(page) - 1) * Number(limit);

        const products = await Product.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(Number(limit))
            .populate('seller', 'name');

        const total = await Product.countDocuments(query);

        res.json({
            products,
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalProducts: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET SINGLE PRODUCT
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'name')
            .populate('reviews.user', 'name');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// CREATE PRODUCT (Seller/Admin)
router.post('/', auth, async (req, res) => {
    try {
        const product = new Product({
            ...req.body,
            seller: req.user._id
        });

        await product.save();
        res.status(201).json({ message: 'Product listed!', product });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE PRODUCT
router.put('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check ownership
        if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({ message: 'Product updated!', product: updated });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE PRODUCT
router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ADD REVIEW
router.post('/:id/reviews', auth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const alreadyReviewed = product.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Already reviewed' });
        }

        product.reviews.push({
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment
        });

        product.rating.count = product.reviews.length;
        product.rating.average = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

        await product.save();
        res.status(201).json({ message: 'Review added!', product });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;