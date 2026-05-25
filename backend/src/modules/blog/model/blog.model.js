const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  comment: {
    type: String,
    required: true
  },
  approved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const SectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["text", "image", "list", "table", "highlight", "faq"],
    required: true
  },
  title: String,
  content: String,
  data: {
    url: String,
    alt: String
  },
  items: mongoose.Schema.Types.Mixed, // Array of strings or objects {question, answer}
  columns: [String],
  rows: [[String]]
}, { _id: false });


const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true
  },

  excerpt: {
    type: String
  },

  category: {
    type: String,
    enum: [
      "personal-loan",
      "home-loan",
      "car-loan",
      "education-loan",
      "business-loan",
      "credit-cards",
      "insurance",
      "investments",
      "tax",
      "fintech-news"
    ]
  },

  tags: [
    {
      type: String
    }
  ],

  featuredImage: {
    url: String,
    alt: String
  },

  author: {
    name: {
      type: String,
      default: "Akshad Dhole"
    },
    avatar: {
      type: String,
      default: "https://yourcdn.com/authors/akshad.jpg"
    }
  },

  readingTime: {
    type: Number,
    default: 5
  },

  views: {
    type: Number,
    default: 0
  },

  likes: {
    type: Number,
    default: 0
  },

  shares: {
      type: Number,
      default: 0
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft"
  },

  publishedAt: {
    type: Date
  },

  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },

  toc: [String],

  sections: [SectionSchema],

  comments: [CommentSchema]

}, { timestamps: true });

module.exports = mongoose.model("Blog", BlogSchema);

