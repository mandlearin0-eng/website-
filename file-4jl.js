const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },
    originalPrice: {
        type: Number,
        required: true
    },
    platform: {
        type: String,
        enum: ['ps5', 'ps4', 'xbox', 'nintendo', 'pc', 'console', 'accessories'],
        required: true
    },
    condition: {
        type: String,
        enum: ['new', 'like-new', 'excellent', 'good', 'fair'],
        required: true
    },
    category: {
        type: String,
        enum: ['game', 'console', 'accessory', 'merchandise'],
        default: 'game'
    },
    images: [{
        type: String
    }],
    emoji: {
        type: String,
        default: '🎮'
    },
    stock: {
        type: Number,
        default: 1
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        rating: Number,
        comment: String,
        date: { type: Date, default: Date.now }
    }],
    tags: [String],
    isFeatured: {
        type: Boolean,
        default: false
    },
    isDeal: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Virtual for discount percentage
productSchema.virtual('discount').get(function() {
    return Math.round((1 - this.price / this.originalPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);