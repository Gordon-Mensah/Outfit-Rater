// Blog.jsx - Simple blog list page
import { useNavigate } from 'react-router-dom'
import './Blog.css'

const blogPosts = [
  {
    slug: 'what-is-fashion-scoring-2026-guide',
    title: 'What is fashion scoring? A 2026 guide to style',
    excerpt: 'Discover how fashion scoring works in 2026, from AI models to biases. Learn to interpret outfit ratings and make smarter style choices with data-driven insights.',
    date: 'March 14, 2026',
    readTime: '8 min read',
    image: 'https://csuxjmfbwmkxiegfpljm.supabase.co/storage/v1/object/public/blog-images/organization-20664/1773385216726_Young-woman-evaluating-outfits-in-city-bedroom.png',
    featured: true
  }
]

function Blog() {
  const navigate = useNavigate()

  return (
    <div className="blog-page">
      {/* Background */}
      <div className="blog-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="grid-overlay"></div>
      </div>

      {/* Content */}
      <div className="blog-content">
        {/* Header */}
        <header className="blog-header">
          <button onClick={() => navigate('/rate')} className="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Back to Home
          </button>
          <h1>Fashion & AI Blog</h1>
          <p>Insights on style, technology, and personalized fashion</p>
        </header>

        {/* Blog Grid */}
        <div className="blog-grid">
          {blogPosts.map(post => (
            <article 
              key={post.slug} 
              className={`blog-card ${post.featured ? 'featured' : ''}`}
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              <div className="blog-card-image">
                <img src={post.image} alt={post.title} />
                {post.featured && <span className="featured-badge">Featured</span>}
              </div>
              <div className="blog-card-content">
                <div className="blog-meta">
                  <span className="blog-date">{post.date}</span>
                  <span className="blog-divider">•</span>
                  <span className="blog-read-time">{post.readTime}</span>
                </div>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <button className="read-more-btn">
                  Read Article
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="blog-cta">
          <h2>Ready to Get AI Outfit Ratings?</h2>
          <p>Join thousands using AI to improve their style</p>
          <button onClick={() => navigate('/signup')} className="cta-btn">
            Start Rating Free
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Blog