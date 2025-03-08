import React, { useState, useEffect, useRef } from "react";
import "../styles/GetStarted.css"; // We'll move all styles to an external CSS file

const GetStarted = () => {
  // References for accordion items
  const accordionRefs = useRef([]);
  
  // Initialize accordion refs
  useEffect(() => {
    accordionRefs.current = accordionRefs.current.slice(0, 4);
  }, []);
  
  // Function to toggle accordion items
  const toggleAccordion = (index) => {
    accordionRefs.current.forEach((item, i) => {
      if (i === index) {
        item.classList.toggle('active');
      } else {
        item.classList.remove('active');
      }
    });
  };
  
  // State for subscription selection
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [selectedTier, setSelectedTier] = useState("analytics");
  const [planExpanded, setPlanExpanded] = useState(null);
  
  // Animation state
  const [isVisible, setIsVisible] = useState(false);
  
  // Set animation after component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Toggle plan expansion
  const togglePlanExpand = (plan) => {
    setPlanExpanded(planExpanded === plan ? null : plan);
  };

  // Pricing data
  const pricing = {
    monthly: {
      analytics: { price: 9.99, regularPrice: 14.99 },
      edge: { price: 19.99, regularPrice: 29.99 },
      pro: { price: 39.99, regularPrice: 59.99 }
    },
    yearly: {
      analytics: { price: 99.99, regularPrice: 149.99 },
      edge: { price: 199.99, regularPrice: 299.99 },
      pro: { price: 399.99, regularPrice: 599.99 }
    }
  };

  // Calculate savings
  const getSavings = () => {
    const currentPrice = pricing[selectedPlan][selectedTier].price;
    const regularPrice = pricing[selectedPlan][selectedTier].regularPrice;
    return Math.round(((regularPrice - currentPrice) / regularPrice) * 100);
  };

  // Features by tier
  const features = {
    analytics: [
      "Team performance analytics",
      "Recruiting insights and visualization",
      "Coaching analytics",
      "Team comparison tools",
      "Program development metrics",
      "Transfer portal intelligence",
      "Conference comparison tools"
    ],
    edge: [
      "Everything in Analytics tier",
      "Real-time arbitrage calculator",
      "Historical betting performance",
      "Line movement analysis",
      "Sportsbook comparison tools",
      "Proprietary edge detection",
      "Personalized betting alerts"
    ],
    pro: [
      "Everything in Analytics and Edge tiers",
      "GamedayGPT premium access",
      "Advanced API access",
      "Custom data exports",
      "Priority support",
      "Early access to new features",
      "Personalized strategic consulting"
    ]
  };

  const tierInfo = {
    analytics: {
      title: "Gameday Analytics",
      tagline: "For serious fans and analysts",
      color: "#4A90E2"
    },
    edge: {
      title: "Gameday Edge",
      tagline: "For the data-driven bettor",
      color: "#50C878"
    },
    pro: {
      title: "Gameday Pro",
      tagline: "Ultimate football intelligence",
      color: "#D4001C"
    }
  };

  // Function to initialize scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, {
      threshold: 0.1
    });
    
    document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card').forEach(el => {
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="get-started-container">
      <div className={`hero-section ${isVisible ? 'visible' : ''}`}>
        <h1>Fast track your football intelligence</h1>
        <p className="subtitle">Get comprehensive insights no other platform can provide.</p>
        <div className="trial-badge">Try 7 Days Free</div>
      </div>

      {/* Plan selector toggle */}
      <div className="plan-selector">
        <div className={`plan-toggle ${selectedPlan === "monthly" ? "active" : ""}`}>
          <button
            className={selectedPlan === "monthly" ? "active" : ""}
            onClick={() => setSelectedPlan("monthly")}
          >
            Monthly
          </button>
          <button
            className={selectedPlan === "yearly" ? "active" : ""}
            onClick={() => setSelectedPlan("yearly")}
          >
            Yearly
            <span className="save-badge">Save 15%</span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="pricing-cards">
        {Object.keys(tierInfo).map((tier) => (
          <div
            key={tier}
            className={`pricing-card ${tier} ${selectedTier === tier ? 'selected' : ''} ${planExpanded === tier ? 'expanded' : ''}`}
            style={{ borderColor: tierInfo[tier].color }}
            onClick={() => togglePlanExpand(tier)}
          >
            <div className="card-header" style={{ backgroundColor: tierInfo[tier].color }}>
              <h3>{tierInfo[tier].title}</h3>
              <p>{tierInfo[tier].tagline}</p>
            </div>
            <div className="card-price">
              <span className="price-currency">$</span>
              <span className="price-value">{pricing[selectedPlan][tier].price.toFixed(2)}</span>
              <span className="price-period">/{selectedPlan === "monthly" ? "mo" : "yr"}</span>
              {pricing[selectedPlan][tier].regularPrice > pricing[selectedPlan][tier].price && (
                <span className="price-regular">${pricing[selectedPlan][tier].regularPrice.toFixed(2)}</span>
              )}
            </div>
            <div className="card-features">
              <ul>
                {features[tier].map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
            <div className="card-action">
              <button 
                className="select-plan-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTier(tier);
                }}
                style={{ backgroundColor: tierInfo[tier].color }}
              >
                {selectedTier === tier ? "Selected" : "Select Plan"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="cta-section">
        <h2>Ready to experience the future of college football intelligence?</h2>
        <p>Join thousands of fans, analysts, and bettors who've upgraded their game.</p>
        <button className="cta-button">
          Start Your 7-Day Free Trial
        </button>
        <p className="cta-disclaimer">No credit card required. Cancel anytime.</p>
      </div>

      {/* Features section */}
      <div className="features-section">
        <h2>Why Gameday+ is the ultimate college football platform</h2>
        
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon analytics-icon"></div>
            <h3>Advanced Analytics</h3>
            <p>Dive deep into 24 years of football data with visualization tools no other platform offers.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon recruiting-icon"></div>
            <h3>Recruiting Intelligence</h3>
            <p>Track top prospects, visualize commitments geographically, and monitor transfer portal activity.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon betting-icon"></div>
            <h3>Betting Edge</h3>
            <p>Gain advantage with our proprietary arbitrage calculator and historical betting analysis.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon coaching-icon"></div>
            <h3>Coaching Insights</h3>
            <p>Evaluate coaching performance, track career trajectories, and compare program development.</p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="testimonials-section">
        <h2>What our users are saying</h2>
        
        <div className="testimonial-carousel">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Gameday+ has completely changed how I analyze college football games. The arbitrage calculator alone has paid for my subscription many times over."</p>
            </div>
            <div className="testimonial-author">
              <p><strong>Michael T.</strong> - Sports Analyst</p>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"As a recruiting coordinator, the geographic visualization tools give me insights I can't find anywhere else. Worth every penny."</p>
            </div>
            <div className="testimonial-author">
              <p><strong>Sarah J.</strong> - Recruiting Professional</p>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"I've tried every college football platform out there, and nothing comes close to the comprehensive data Gameday+ provides."</p>
            </div>
            <div className="testimonial-author">
              <p><strong>David R.</strong> - College Football Fan</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        
        <div className="accordion">
          <div className="accordion-item" ref={el => accordionRefs.current[0] = el}>
            <div className="accordion-header" onClick={() => toggleAccordion(0)}>
              <h3>What makes Gameday+ different from other platforms?</h3>
              <span className="accordion-icon">+</span>
            </div>
            <div className="accordion-content">
              <p>Unlike fragmented competitors focused on single aspects of college football, Gameday+ creates a comprehensive ecosystem that combines advanced analytics, recruiting visualization, betting tools, and coaching metrics in one seamless platform.</p>
            </div>
          </div>
          
          <div className="accordion-item" ref={el => accordionRefs.current[1] = el}>
            <div className="accordion-header" onClick={() => toggleAccordion(1)}>
              <h3>How does the 7-day free trial work?</h3>
              <span className="accordion-icon">+</span>
            </div>
            <div className="accordion-content">
              <p>Your free trial gives you complete access to all features of your chosen plan for 7 days. No credit card is required to start, and you can cancel anytime without being charged.</p>
            </div>
          </div>
          
          <div className="accordion-item" ref={el => accordionRefs.current[2] = el}>
            <div className="accordion-header" onClick={() => toggleAccordion(2)}>
              <h3>Can I switch between Analytics and Edge tiers?</h3>
              <span className="accordion-icon">+</span>
            </div>
            <div className="accordion-content">
              <p>Yes, you can upgrade or downgrade your subscription at any time. If you upgrade, you'll immediately gain access to additional features. If you downgrade, the change will take effect at the start of your next billing cycle.</p>
            </div>
          </div>
          
          <div className="accordion-item" ref={el => accordionRefs.current[3] = el}>
            <div className="accordion-header" onClick={() => toggleAccordion(3)}>
              <h3>What data sources does Gameday+ use?</h3>
              <span className="accordion-icon">+</span>
            </div>
            <div className="accordion-content">
              <p>Gameday+ aggregates data from multiple reliable sources, including official NCAA statistics, recruiting services, betting markets, and our proprietary algorithms to provide the most comprehensive and accurate college football intelligence available.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;