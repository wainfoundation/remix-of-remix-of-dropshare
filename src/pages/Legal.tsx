import MainLayout from '@/components/layout/MainLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const LEGAL_CONTENT: Record<string, { title: string; body: string }> = {
  help: {
    title: 'Help Center',
    body: `# Welcome to DropShare Help Center

We're here to help you get the most out of DropShare. Find answers to common questions, troubleshooting guides, and contact information.

## Frequently Asked Questions

### Getting Started
• How do I create an account?
• How do I verify my Pi Network authentication?
• What's the difference between Shopper, Creator, and Business accounts?

### Content Creation
• How do I create posts, stories, and reels?
• What are the recommended image and video formats?
• How do I use hashtags effectively?

### Pi Network Integration
• How does Pi authentication work?
• How do I make payments with Pi?
• What can I buy with Pi on DropShare?

### Privacy & Safety
• How do I report inappropriate content?
• How do I block or unblock users?
• How do I control who sees my posts?

## Contact Support

**Email:** support@dropshare.space
**Response Time:** Within 24 hours
**Available:** 24/7 for urgent issues

## Report Issues

To report bugs or technical issues:
1. Go to Settings > Help & Support
2. Select "Report a Problem"
3. Describe the issue in detail
4. Include screenshots if possible

## Community Forum

Join our community discussions at community.dropshare.space to:
• Ask questions to other users
• Share tips and tricks
• Get the latest updates
• Connect with creators`,
  },
  about: {
    title: 'About DropShare',
    body: `# About DropShare

## Our Mission

DropShare is the world's first social commerce platform powered by Pi Network, designed to revolutionize how people discover, share, and purchase products through authentic social connections.

## What We Do

DropShare combines the power of social media with seamless e-commerce, allowing users to:

• **Discover** amazing products through trusted friends and creators
• **Share** authentic reviews and experiences
• **Connect** with like-minded shoppers and creators
• **Purchase** securely using Pi cryptocurrency

## Our Values

**Authenticity** - We believe in genuine connections and honest reviews
**Innovation** - We're pioneering the future of social commerce
**Community** - We put our users and creators first
**Sustainability** - We support eco-friendly and ethical businesses
**Accessibility** - Everyone deserves access to great products

## Company Information

**Founded:** 2026
**Headquarters:** Global (Decentralized)
**Platform:** Web & Mobile
**Currency:** Pi Network Cryptocurrency
**Users:** Growing community of Pioneers

## Leadership Team

Our diverse team combines expertise in social media, e-commerce, blockchain technology, and community building to create the best possible experience for our users.

## Partnerships

We partner with:
• Pi Network for secure cryptocurrency transactions
• Trusted merchants and creators worldwide
• Leading technology providers for platform security
• Community organizations for user safety

## Contact Information

**General Inquiries:** hello@dropshare.space
**Press & Media:** press@dropshare.space
**Business Development:** partners@dropshare.space
**Careers:** careers@dropshare.space`,
  },
  terms: {
    title: 'Terms of Service',
    body: `# DropShare Terms of Service

**Last Updated:** January 15, 2026

## 1. Agreement to Terms

By using DropShare, you agree to these Terms of Service. If you don't agree, please don't use our platform.

## 2. Description of Service

DropShare is a social commerce platform that allows users to:
• Create and share content (posts, stories, reels)
• Discover and purchase products
• Connect with other users
• Use Pi Network cryptocurrency for transactions

## 3. User Accounts

### Account Creation
• You must be 18+ to create an account
• Provide accurate, complete information
• One account per person
• You're responsible for account security

### Account Types
• **Shopper:** Browse, purchase, and share
• **Creator:** Create content, earn commissions
• **Business:** Sell products and advertise

## 4. Content Guidelines

### Acceptable Content
• Original, authentic posts
• Honest product reviews
• Respectful comments and interactions
• Compliance with all applicable laws

### Prohibited Content
• Spam, fake, or misleading information
• Hate speech, harassment, or bullying
• Adult content or violence
• Copyrighted material without permission
• Illegal products or services

## 5. Pi Network Integration

• All payments processed through Pi Network
• Users must have valid Pi Network accounts
• Transaction fees may apply
• Refund policies vary by merchant

## 6. Intellectual Property

• You own your original content
• Grant us license to display your content
• Respect others' intellectual property
• Report copyright violations

## 7. Privacy

Your privacy is important. See our Privacy Policy for details on data collection and use.

## 8. Limitation of Liability

DropShare is provided "as is." We're not liable for:
• User-generated content
• Third-party products or services
• Platform interruptions
• Financial losses from Pi transactions

## 9. Termination

We may suspend or terminate accounts for:
• Violation of these terms
• Illegal activity
• Harm to other users
• Platform security concerns

## 10. Changes to Terms

We may update these terms. Continued use means acceptance of changes.

## 11. Contact

Questions? Contact us at legal@dropshare.space`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `# DropShare Privacy Policy

**Last Updated:** January 15, 2026

## 1. Information We Collect

### Personal Information
• Pi Network user ID and username
• Profile information (display name, bio, avatar)
• Contact information (if provided)
• Device and browser information

### Content Information
• Posts, stories, and reels you create
• Comments and interactions
• Product reviews and ratings
• Shopping history and preferences

### Technical Information
• IP address and location data
• Device identifiers
• Usage analytics
• Performance metrics

## 2. How We Use Information

### Platform Functionality
• Provide core social commerce features
• Process Pi Network transactions
• Personalize content recommendations
• Enable user connections and interactions

### Safety & Security
• Detect and prevent fraud
• Enforce community guidelines
• Protect user accounts
• Monitor platform health

### Communication
• Send important updates
• Respond to support requests
• Share new features
• Marketing (with consent)

## 3. Information Sharing

### We Share With
• **Other Users:** Public profile and content
• **Pi Network:** For authentication and payments
• **Merchants:** For order fulfillment
• **Service Providers:** For platform operations

### We Don't Share
• Personal information with advertisers
• Private messages or data
• Financial information beyond Pi transactions
• Data with unauthorized third parties

## 4. Your Privacy Controls

### Account Settings
• Profile visibility controls
• Content sharing preferences
• Notification settings
• Data download requests

### Data Rights
• Access your information
• Correct inaccurate data
• Delete your account
• Opt-out of marketing

## 5. Data Security

• Encryption in transit and at rest
• Regular security audits
• Access controls and monitoring
• Incident response procedures

## 6. Data Retention

• Active accounts: Data retained while account exists
• Deleted accounts: Most data removed within 30 days
• Legal requirements: Some data retained longer
• Analytics: Aggregated data may be retained

## 7. International Transfers

Data may be processed in different countries with adequate protection measures.

## 8. Children's Privacy

DropShare is not intended for users under 18. We don't knowingly collect children's data.

## 9. Changes to Policy

We'll notify you of significant privacy policy changes.

## 10. Contact Us

**Privacy Team:** privacy@dropshare.space
**Data Protection Officer:** dpo@dropshare.space`,
  },
  community: {
    title: 'Community Guidelines',
    body: `# DropShare Community Guidelines

## Our Community Values

DropShare is built on trust, authenticity, and mutual respect. These guidelines help maintain a positive environment for everyone.

## 1. Be Authentic

### Real Identity
• Use your real name and photo
• One account per person
• No impersonation of others
• Verify business accounts appropriately

### Honest Reviews
• Share genuine experiences
• Disclose sponsored content
• No fake or paid reviews
• Report misleading information

## 2. Be Respectful

### Treat Others Well
• Use kind and respectful language
• Respect different opinions
• No harassment or bullying
• Help newcomers feel welcome

### Cultural Sensitivity
• Respect diverse backgrounds
• No discriminatory content
• Consider global perspectives
• Celebrate differences

## 3. Share Responsibly

### Quality Content
• Post relevant, valuable content
• Use clear photos and descriptions
• Tag products accurately
• Organize content thoughtfully

### Appropriate Sharing
• No spam or excessive promotion
• Respect privacy of others
• No adult or violent content
• Follow copyright laws

## 4. Shop Ethically

### Fair Transactions
• Pay promptly for purchases
• Communicate clearly with sellers
• Leave honest feedback
• Report transaction issues

### Sustainable Practices
• Support ethical businesses
• Consider environmental impact
• Choose quality over quantity
• Share sustainable brands

## 5. Safety First

### Personal Safety
• Protect personal information
• Meet in public for exchanges
• Trust your instincts
• Report suspicious activity

### Platform Security
• Use strong passwords
• Enable two-factor authentication
• Don't share account access
• Report security issues

## 6. What's Not Allowed

### Prohibited Content
• Hate speech or discrimination
• Nudity or sexual content
• Violence or dangerous activities
• Illegal products or services
• Misleading information
• Copyright infringement

### Prohibited Behavior
• Creating fake accounts
• Buying or selling accounts
• Manipulating engagement
• Harassing other users
• Sharing private information
• Evading bans or restrictions

## 7. Reporting Violations

### How to Report
• Use the report button on content
• Email community@dropshare.space
• Provide specific details
• Include screenshots if helpful

### What Happens Next
• We review all reports promptly
• Take appropriate action
• Follow up if needed
• Protect reporter privacy

## 8. Consequences

### Progressive Enforcement
• First violation: Warning
• Repeated violations: Temporary restrictions
• Serious violations: Account suspension
• Severe violations: Permanent ban

## 9. Appeals Process

If you believe action was taken in error:
• Submit an appeal to appeals@dropshare.space
• Provide relevant information
• Wait for review (typically 5-7 days)
• Accept final decision

## 10. Building Together

Help us improve by:
• Providing feedback
• Suggesting new features
• Mentoring new users
• Creating positive content

Together, we can build the best social commerce community!`,
  },
  safety: {
    title: 'Safety Center',
    body: `# DropShare Safety Center

## Your Safety is Our Priority

We're committed to keeping DropShare a safe space for everyone. Learn about our safety features and how to protect yourself.

## 1. Account Security

### Strong Authentication
• **Pi Network Integration:** Secure blockchain-based login
• **Two-Factor Authentication:** Add extra security layer
• **Strong Passwords:** Use unique, complex passwords
• **Regular Updates:** Keep app and browser updated

### Account Protection
• Monitor login activity
• Log out from unfamiliar devices
• Never share account credentials
• Report suspicious activity immediately

## 2. Privacy Controls

### Profile Visibility
• **Public:** Anyone can see your profile
• **Friends:** Only approved followers
• **Private:** Invitation-only access
• **Custom:** Choose what to share

### Content Controls
• Control who can comment
• Limit message requests
• Hide from search results
• Block specific users

## 3. Safe Shopping

### Before You Buy
• Check seller ratings and reviews
• Verify product authenticity
• Read return policies
• Use secure payment methods (Pi only)

### Transaction Safety
• All payments through Pi Network
• Dispute resolution available
• Fraud protection measures
• Secure checkout process

## 4. Content Safety

### What We Monitor
• Automated content scanning
• Community reports and flags
• Professional moderation team
• AI-powered detection systems

### Harmful Content Removal
• Hate speech and harassment
• Fake or misleading information
• Adult or violent content
• Spam and scam attempts

## 5. Personal Safety

### Online Safety Tips
• Don't share personal information publicly
• Be cautious with strangers
• Trust your instincts
• Meet in public places for exchanges

### Red Flags to Watch For
• Requests for personal information
• Pressure to act quickly
• Too-good-to-be-true offers
• Poor grammar or spelling
• Unusual payment requests

## 6. Reporting & Support

### How to Report
• **In-App:** Use report button on any content
• **Email:** safety@dropshare.space
• **Urgent:** For immediate safety concerns
• **Anonymous:** Reports can be made anonymously

### What to Include
• Specific description of issue
• Screenshots or evidence
• User profiles involved
• Date and time of incident

### Our Response
• **Immediate:** Urgent safety issues
• **24 hours:** General reports
• **Investigation:** Thorough review process
• **Action:** Appropriate measures taken

## 7. Blocking & Restrictions

### Blocking Users
• Prevents contact and interaction
• Hides their content from you
• Removes them from your followers
• Can be undone at any time

### Restricted Accounts
• Limited platform access
• Reduced visibility
• Monitored activity
• Path to account restoration

## 8. Youth Safety

### Age Requirements
• Minimum age: 18 years
• Age verification required
• Immediate removal of underage accounts
• Parental notification process

## 9. Crisis Resources

### Mental Health Support
• **Crisis Text Line:** Text HOME to 741741
• **National Suicide Prevention:** 988
• **International:** befrienders.org
• **Local Emergency:** Your country's emergency number

### Safety Resources
• **Domestic Violence:** 1-800-799-7233
• **Cyberbullying:** stopbullying.gov
• **Internet Safety:** connectsafely.org
• **Financial Fraud:** reportfraud.ftc.gov

## 10. Staying Informed

### Safety Updates
• Follow @DropshareSafety
• Check safety.dropshare.space
• Enable security notifications
• Join community safety discussions

### Best Practices
• Regular security checkups
• Stay informed about new threats
• Educate friends and family
• Practice safe online habits

## Contact Our Safety Team

**Email:** safety@dropshare.space
**Emergency:** urgent@dropshare.space
**Phone:** +1-800-DROPSAFE
**Hours:** 24/7 for urgent issues

Your safety matters to us. Don't hesitate to reach out if you need help.`,
  },
  developers: {
    title: 'Developers',
    body: `# DropShare Developer Platform

## Welcome, Developers!

Build amazing integrations and applications with the DropShare API ecosystem.

## 1. Getting Started

### Developer Account
• Sign up at developers.dropshare.space
• Verify your identity
• Accept developer terms
• Access your dashboard

### API Authentication
• **Pi Network Integration:** Use Pi SDK
• **API Keys:** Secure token-based auth
• **OAuth 2.0:** For third-party applications
• **Rate Limiting:** 1000 requests/hour

## 2. DropShare API

### Core Endpoints

#### Users & Profiles
\`\`\`
GET /api/v1/users/[userId]
PUT /api/v1/users/[userId]/profile
GET /api/v1/users/[userId]/followers
\`\`\`

#### Content
\`\`\`
GET /api/v1/posts
POST /api/v1/posts
GET /api/v1/posts/[postId]
DELETE /api/v1/posts/[postId]
\`\`\`

#### Commerce
\`\`\`
GET /api/v1/products
GET /api/v1/products/[productId]
POST /api/v1/orders
GET /api/v1/orders/[orderId]
\`\`\`

#### Pi Network
\`\`\`
POST /api/v1/pi/authenticate
POST /api/v1/pi/payments
GET /api/v1/pi/transactions
\`\`\`

### Response Format
\`\`\`json
{
  "success": true,
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "meta": {
    "timestamp": "2026-01-15T10:30:00Z",
    "version": "v1"
  }
}
\`\`\`

## 3. SDKs & Libraries

### Official SDKs
• **JavaScript/Node.js:** npm install dropshare-sdk
• **Python:** pip install dropshare-python
• **Go:** github.com/dropshare/go-sdk
• **PHP:** composer require dropshare/php-sdk

### Example Integration
\`\`\`javascript
import { DropShareAPI } from 'dropshare-sdk';

const api = new DropShareAPI({
  apiKey: 'your-api-key',
  environment: 'production' // or 'sandbox'
});

// Get user profile
const profile = await api.users.getProfile(userId);

// Create a post
const post = await api.posts.create({
  content: 'Check out this amazing product!',
  images: ['image1.jpg'],
  products: [productId]
});
\`\`\`

## 4. Pi Network Integration

### Authentication Flow
1. Integrate Pi SDK in your app
2. Authenticate user with Pi Network
3. Send access token to DropShare
4. Receive DropShare session token
5. Use token for API calls

### Payment Processing
\`\`\`javascript
// Create a payment
const payment = await api.pi.createPayment({
  amount: 10.5,
  currency: 'PI',
  recipient: merchantId,
  memo: 'Product purchase'
});

// Verify payment
const verification = await api.pi.verifyPayment(payment.id);
\`\`\`

## 5. Webhooks

### Available Events
• \`user.created\` - New user registration
• \`post.created\` - New post published
• \`order.completed\` - Order fulfilled
• \`payment.received\` - Pi payment processed

### Setup
\`\`\`javascript
// Configure webhook endpoint
const webhook = await api.webhooks.create({
  url: 'https://yourapp.com/webhooks/dropshare',
  events: ['order.completed', 'payment.received'],
  secret: 'your-webhook-secret'
});
\`\`\`

### Verification
\`\`\`javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
\`\`\`

## 6. Contact Support

**Email:** developers@dropshare.space
**Response Time:** Within 24 hours
**Documentation:** docs.dropshare.space`,
  },
  cookies: {
    title: 'Cookie Policy',
    body: `# DropShare Cookie Policy

**Last Updated:** January 15, 2026

## What Are Cookies?

Cookies are small text files stored on your device when you visit our website or use our app. They help us provide a better, more personalized experience.

## Types of Cookies We Use

### Essential Cookies
**Purpose:** Core functionality
**Examples:**
• User authentication and login sessions
• Shopping cart contents
• Security and fraud prevention
• Basic website functionality

**Duration:** Session or up to 30 days
**Can you opt out?** No - required for basic functionality

### Analytics Cookies
**Purpose:** Understanding usage patterns
**Examples:**
• Page views and user journeys
• Performance metrics
• Error tracking and debugging
• Feature usage statistics

**Duration:** Up to 2 years
**Can you opt out?** Yes

### Personalization Cookies
**Purpose:** Customizing your experience
**Examples:**
• Language and region preferences
• Theme and display settings
• Personalized content recommendations
• Recently viewed products

**Duration:** Up to 1 year
**Can you opt out?** Yes

### Marketing Cookies
**Purpose:** Relevant advertising
**Examples:**
• Ad targeting and personalization
• Campaign effectiveness tracking
• Social media integration
• Third-party advertising partners

**Duration:** Up to 1 year
**Can you opt out?** Yes

## Third-Party Cookies

### Pi Network
**Purpose:** Authentication and payments
**Data Shared:** User ID, transaction data
**Privacy Policy:** Available at minepi.com

### Analytics Providers
**Purpose:** Platform insights
**Providers:** Google Analytics, Mixpanel
**Data Shared:** Usage patterns, performance

### Advertising Partners
**Purpose:** Relevant ads
**Providers:** Various ad networks
**Data Shared:** Anonymous identifiers

## Managing Your Cookie Preferences

### Browser Settings
**Chrome:**
1. Settings > Privacy and Security > Cookies
2. Choose your preferred settings
3. Manage exceptions for specific sites

**Firefox:**
1. Settings > Privacy & Security
2. Cookies and Site Data section
3. Manage Data or Clear Data

**Safari:**
1. Preferences > Privacy
2. Manage Website Data
3. Choose blocking options

**Edge:**
1. Settings > Cookies and Site Permissions
2. Manage and Delete Cookies
3. Set blocking preferences

### DropShare Cookie Settings
**Access:** Settings > Privacy > Cookie Preferences

**Options:**
• Essential Only (recommended minimum)
• Performance & Analytics
• Personalization
• Marketing & Advertising
• Accept All

**Apply Changes:** Settings take effect immediately

## Cookie Categories in Detail

### Functional Cookies
\`\`\`
Name: ds_session
Purpose: User login session
Duration: 24 hours
Domain: dropshare.space
\`\`\`

\`\`\`
Name: ds_cart
Purpose: Shopping cart contents
Duration: 7 days
Domain: dropshare.space
\`\`\`

\`\`\`
Name: ds_preferences
Purpose: User settings and preferences
Duration: 1 year
Domain: dropshare.space
\`\`\`

### Analytics Cookies
\`\`\`
Name: _ga
Purpose: Google Analytics visitor identification
Duration: 2 years
Domain: .dropshare.space
\`\`\`

\`\`\`
Name: ds_analytics
Purpose: Internal usage tracking
Duration: 1 year
Domain: dropshare.space
\`\`\`

### Marketing Cookies
\`\`\`
Name: ds_marketing
Purpose: Ad personalization
Duration: 6 months
Domain: .dropshare.space
\`\`\`

## Your Rights

### Access
• Request list of cookies we use
• Understand data collection practices
• Review cookie purposes and duration

### Control
• Accept or reject non-essential cookies
• Change preferences at any time
• Clear cookies from your browser

### Transparency
• Clear information about cookie usage
• Regular updates to this policy
• Notification of significant changes

## Mobile App Data

### Local Storage
Our mobile app stores similar data locally:
• User preferences and settings
• Cached content for offline use
• Authentication tokens
• Performance metrics

### Device Permissions
• Camera (for photo uploads)
• Storage (for content caching)
• Location (for relevant content)
• Notifications (for updates)

## Impact of Disabling Cookies

### Essential Cookies Disabled
• Cannot log in or maintain sessions
• Shopping cart won't work
• Security features compromised
• Basic functionality broken

### Analytics Cookies Disabled
• We can't improve platform performance
• Error detection may be delayed
• Feature development may be slower
• No impact on core functionality

### Personalization Cookies Disabled
• Generic content recommendations
• Default language and region settings
• Less relevant product suggestions
• Manual preference setting required

### Marketing Cookies Disabled
• Less relevant advertisements
• May see more generic ads
• No impact on core functionality
• Better privacy protection

## Updates to This Policy

We may update this Cookie Policy to:
• Reflect changes in our practices
• Address new technologies
• Improve clarity and transparency
• Comply with legal requirements

**Notification Method:**
• In-app notifications
• Email to registered users
• Website banner notices
• Updated "Last Modified" date

## Contact Us

**Questions about cookies?**
• Email: cookies@dropshare.space
• Privacy Team: privacy@dropshare.space
• Response Time: Within 5 business days

**Cookie Preferences:**
Manage anytime in Settings > Privacy > Cookie Preferences

We're committed to transparency about how we use cookies to enhance your DropShare experience while respecting your privacy choices.`,
  },
  careers: {
    title: 'Careers',
    body: `# Careers at DropShare

## Join the Future of Social Commerce

We're building the next generation of social commerce, and we want you to be part of it. Join our global team of innovators, creators, and changemakers.

## Why DropShare?

### Mission-Driven
• Revolutionizing how people shop and connect
• Building authentic community experiences
• Empowering creators and entrepreneurs
• Advancing cryptocurrency adoption

### Growth Opportunity
• Rapidly expanding platform
• Learn from industry experts
• Shape product direction
• Career advancement paths

### Great Benefits
• Competitive salary + equity
• Comprehensive health insurance
• Flexible work arrangements
• Professional development budget
• Pi Network cryptocurrency bonuses

### Amazing Culture
• Remote-first company
• Diverse and inclusive team
• Work-life balance priority
• Collaborative environment
• Innovation and creativity valued

## Open Positions

### Engineering

**Senior Full-Stack Developer**
*Remote • Full-time • π120k-180k*

Build scalable web applications using React, Node.js, and modern technologies. Experience with blockchain and cryptocurrency systems preferred.

**Required:**
• 5+ years full-stack development
• React, Node.js, TypeScript
• Database design and optimization
• API development and integration

**Mobile Developer (React Native)**
*Remote • Full-time • p110k-160k*

Develop cross-platform mobile applications. Experience with social media or e-commerce apps is a plus.

**Required:**
• 3+ years React Native experience
• iOS and Android development
• App store deployment
• Performance optimization

**DevOps Engineer**
*Remote • Full-time • p130k-190k*

Manage cloud infrastructure, CI/CD pipelines, and platform scalability. Kubernetes and AWS experience required.

**Required:**
• 4+ years DevOps experience
• Kubernetes, Docker, AWS
• Infrastructure as Code
• Monitoring and alerting

**Blockchain Developer**
*Remote • Full-time • p140k-200k*

Integrate Pi Network and other blockchain technologies. Smart contract development experience preferred.

**Required:**
• 3+ years blockchain development
• Smart contract programming
• Cryptocurrency payment systems
• Security best practices

### Product & Design

**Senior Product Manager**
*Remote • Full-time • p140k-190k*

Lead product strategy and roadmap for core platform features. Social commerce or marketplace experience required.

**Required:**
• 5+ years product management
• Social media or e-commerce background
• Data-driven decision making
• Cross-functional leadership

**UX/UI Designer**
*Remote • Full-time • p90k-130k*

Design intuitive and beautiful user experiences. Mobile-first design and social platform experience preferred.

**Required:**
• 3+ years UX/UI design
• Figma, Sketch, Adobe Creative
• User research and testing
• Design system development

**Product Marketing Manager**
*Remote • Full-time • p110k-150k*

Drive go-to-market strategy and user acquisition. Social media and creator economy experience valued.

**Required:**
• 4+ years product marketing
• Social media marketing
• Content strategy and creation
• Analytics and optimization

### Data & Analytics

**Data Engineer**
*Remote • Full-time • p120k-170k*

Build data pipelines and infrastructure to support analytics and machine learning initiatives.

**Required:**
• 3+ years data engineering
• Python, SQL, Apache Spark
• Data warehouse design
• ETL pipeline development

**Data Scientist**
*Remote • Full-time • p130k-180k*

Develop machine learning models for recommendations, fraud detection, and user insights.

**Required:**
• 4+ years data science
• Python, R, TensorFlow/PyTorch
• Statistical modeling
• A/B testing and experimentation

### Business & Operations

**Community Manager**
*Remote • Full-time • p70k-100k*

Build and nurture our creator and user communities. Social media and community building experience required.

**Required:**
• 3+ years community management
• Social media expertise
• Content creation skills
• Crisis communication experience

**Business Development Manager**
*Remote • Full-time • p90k-130k + Commission*

Partner with brands, creators, and merchants to grow the platform ecosystem.

**Required:**
• 4+ years business development
• Partnership and negotiation skills
• E-commerce or marketplace experience
• Relationship building expertise

**Customer Success Manager**
*Remote • Full-time • p80k-120k*

Ensure merchant and creator success on the platform. SaaS or marketplace experience preferred.

**Required:**
• 3+ years customer success
• Account management skills
• Technical troubleshooting
• Customer advocacy focus

### Security & Trust

**Security Engineer**
*Remote • Full-time • p140k-190k*

Protect platform and user data from security threats. Cryptocurrency and financial security experience valued.

**Required:**
• 4+ years security engineering
• Application security testing
• Incident response procedures
• Compliance frameworks

**Trust & Safety Specialist**
*Remote • Full-time • p70k-100k*

Monitor platform for harmful content and enforce community guidelines.

**Required:**
• 2+ years trust & safety
• Content moderation experience
• Policy enforcement
• Crisis management skills

## Internship Programs

### Summer 2026 Internships
**Duration:** 10-12 weeks
**Compensation:** p30-50/hour
**Start Date:** June 2026

**Available Tracks:**
• Software Engineering
• Product Management
• Data Science
• Design (UX/UI)
• Marketing

**Requirements:**
• Currently enrolled in relevant degree program
• Strong academic performance
• Relevant coursework or projects
• Passion for social commerce

## Application Process

### 1. Submit Application
• Complete online application
• Upload resume and cover letter
• Include portfolio/GitHub (if applicable)
• Answer role-specific questions

### 2. Initial Screening
• 30-minute phone/video call
• Background and experience review
• Role fit assessment
• Company culture discussion

### 3. Technical Assessment
• Take-home project or coding challenge
• 2-4 hours to complete
• Real-world problem solving
• Technology stack demonstration

### 4. Final Interview
• Meet with hiring manager and team
• Technical deep dive
• Culture and values alignment
• Questions and discussion

### 5. Reference Check
• Professional reference verification
• Background check completion
• Offer preparation and negotiation

## What We Offer

### Compensation
• Competitive base salary
• Performance-based bonuses
• Equity participation
• Pi Network cryptocurrency rewards

### Benefits
• Health, dental, and vision insurance
• Mental health and wellness support
• Life and disability insurance
• Retirement savings plan (401k)

### Time Off
• Unlimited PTO policy
• 12 company holidays
• Birthday holiday
• Volunteer time off

### Professional Development
• p2,000 annual learning budget
• Conference and training attendance
• Mentorship programs
• Internal skill-sharing sessions

### Work Environment
• Remote-first culture
• Flexible working hours
• Home office setup budget
• Co-working space allowance

### Perks
• Annual company retreat
• Team building events
• DropShare product credits
• Latest tech equipment

## Diversity & Inclusion

We're committed to building a diverse team that reflects the global community we serve. We welcome applications from people of all:

• Races and ethnicities
• Genders and gender identities
• Sexual orientations
• Ages and life stages
• Religions and beliefs
• Abilities and disabilities
• Geographic locations

## How to Apply

### Ready to Join Us?
1. **Browse open positions:** careers.dropshare.space
2. **Submit application:** Include all required materials
3. **Follow up:** We'll respond within 1 week
4. **Stay connected:** Follow us on social media for updates

### Contact Recruiting Team
• **General Inquiries:** careers@dropshare.space
• **Technical Roles:** engineering-jobs@dropshare.space
• **Internships:** internships@dropshare.space
• **Diversity Programs:** diversity@dropshare.space

### Follow Our Journey
• **LinkedIn:** /company/dropshare
• **Twitter:** @dropsharecareers
• **Blog:** blog.dropshare.space/careers
• **Glassdoor:** Reviews and insights

## Life at DropShare

*"Working at DropShare feels like being part of something bigger. Every day, we're helping people discover amazing products and connect with creators they love. The remote culture is incredible - I've never felt more supported or empowered to do my best work."*

**— Sarah Chen, Senior Product Manager**

*"The engineering culture here is fantastic. We use cutting-edge technology, have excellent work-life balance, and get to work on problems that actually matter. Plus, getting paid in Pi is pretty cool!"*

**— Marcus Johnson, Full-Stack Developer**

*"As someone passionate about community building, DropShare is a dream job. I get to work with amazing creators and help build a platform that genuinely makes people's lives better."*

**— Elena Rodriguez, Community Manager**

## Ready to Shape the Future?

Join us in building the next generation of social commerce. Together, we'll create authentic connections, empower creators, and revolutionize how the world shops.

**Apply today at careers.dropshare.space**

We can't wait to meet you! 🚀`,
  },
  advertising: {
    title: 'DropShare Advertising',
    body: `# DropShare Advertising Platform

## Reach Your Ideal Customers Through Authentic Connections

Advertise on DropShare to connect with engaged shoppers through trusted creators and authentic social experiences.

## Why Advertise on DropShare?

### Engaged Audience
• **Active Shoppers:** Users come to discover and buy products
• **High Intent:** Community-driven recommendations drive purchases
• **Trust Factor:** Social proof increases conversion rates
• **Pi Network Users:** Early adopters and tech-savvy consumers

### Authentic Reach
• **Creator Partnerships:** Work with trusted influencers
• **Social Proof:** Real user reviews and recommendations
• **Community Integration:** Ads feel like natural content
• **Transparent Metrics:** Clear performance tracking

### Advanced Targeting
• **Demographics:** Age, location, interests
• **Behavioral:** Shopping history, engagement patterns
• **Lookalike Audiences:** Reach similar high-value customers
• **Custom Audiences:** Retarget existing customers

## Advertising Solutions

### 1. Creator Partnerships

**Sponsored Content**
• Partner with top creators in your niche
• Authentic product reviews and demonstrations
• Long-form content that builds trust
• Performance-based compensation

**Pricing:** π50-500 per post (based on creator reach)
**Best For:** Brand awareness, product launches
**Metrics:** Views, engagement, click-through rates

**Ambassador Programs**
• Long-term partnerships with brand advocates
• Exclusive discount codes and offers
• Regular content creation schedule
• Community building around your brand

**Pricing:** p500-5,000 per month per creator
**Best For:** Ongoing brand building
**Metrics:** Sales attribution, brand mention tracking

### 2. Native Advertising

**Sponsored Posts**
• Promoted content in user feeds
• Native format that matches organic posts
• Clear "Sponsored" labeling for transparency
• Targeted to relevant audiences

**Pricing:** p0.10-1.00 per click
**Best For:** Product promotion, website traffic
**Metrics:** Clicks, conversions, cost per acquisition

**Product Showcase**
• Feature products in discovery feeds
• High-quality images and descriptions
• Direct purchase integration
• Shopping-focused placement

**Pricing:** p0.05-0.50 per click
**Best For:** E-commerce sales, product discovery
**Metrics:** Product views, add-to-cart, purchases

### 3. Video Advertising

**Reel Advertisements**
• Short-form video ads in Reels feed
• Engaging, mobile-optimized content
• Skip option after 5 seconds
• Full-screen immersive experience

**Pricing:** p0.15-0.75 per view (3+ seconds)
**Best For:** Brand storytelling, product demos
**Metrics:** View completion, engagement, shares

**Story Advertisements**
• 15-second ads between user stories
• Full-screen vertical format
• Interactive elements (polls, links)
• Temporary placement with high visibility

**Pricing:** p0.05-0.30 per view
**Best For:** Time-sensitive offers, events
**Metrics:** Story completion, taps, swipe-ups

### 4. Shopping Ads

**Product Catalogs**
• Showcase entire product collections
• Dynamic product recommendations
• Real-time inventory and pricing
• Seamless checkout experience

**Pricing:** 2-8% commission on sales
**Best For:** E-commerce retailers
**Metrics:** Product views, conversion rate, revenue

**Shopping Tags**
• Tag products in organic and paid content
• One-tap product information
• Integrated purchase flow
• Creator commission sharing

**Pricing:** 3-10% commission on attributed sales
**Best For:** Product discovery through social content
**Metrics:** Tag clicks, product page views, purchases

## Targeting Options

### Demographic Targeting
• **Age:** 18-65+ (optimized segments)
• **Gender:** All, Male, Female, Non-binary
• **Location:** Country, region, city, radius
• **Language:** Primary platform languages
• **Education:** Level and field of study
• **Income:** Estimated household income brackets

### Interest Targeting
• **Categories:** Fashion, Tech, Home, Beauty, Fitness
• **Brands:** Competitor and complementary brands
• **Hobbies:** Based on followed content and engagement
• **Lifestyle:** Sustainable, luxury, budget-conscious

### Behavioral Targeting
• **Shopping Activity:** Recent purchases, browsing history
• **Engagement:** High engagers, content creators
• **Device Usage:** Mobile-first, desktop users
• **App Activity:** Frequency, session duration

### Custom Audiences
• **Customer Lists:** Upload email/phone lists
• **Website Visitors:** Retarget site traffic
• **App Users:** Target mobile app users
• **Lookalike Audiences:** Find similar users

## Campaign Management

### DropShare Ads Manager

**Dashboard Features:**
• Real-time campaign performance
• Audience insights and analytics
• Creative asset management
• Budget and bid optimization
• A/B testing capabilities

**Campaign Setup:**
1. Choose advertising objective
2. Define target audience
3. Set budget and schedule
4. Create or upload ad creative
5. Launch and monitor performance

### Campaign Objectives
• **Awareness:** Reach and brand recognition
• **Consideration:** Traffic, engagement, video views
• **Conversion:** Sales, lead generation, app installs
• **Retention:** Customer loyalty, repeat purchases

### Budget Options
• **Daily Budget:** Spend limit per day
• **Lifetime Budget:** Total campaign spend
• **Automatic Bidding:** Optimize for best results
• **Manual Bidding:** Control cost per result

## Creative Guidelines

### Image Specifications
• **Feed Posts:** 1080x1080px (square)
• **Stories:** 1080x1920px (9:16 ratio)
• **Reels:** 1080x1920px (vertical video)
• **File Size:** Maximum 10MB
• **Format:** JPG, PNG, M p4

### Content Requirements
• **Quality:** High-resolution, clear images
• **Authenticity:** Real products, honest claims
• **Disclosure:** Clear "Sponsored" or "Ad" labeling
• **Compliance:** Follow advertising standards

### Best Practices
• Use user-generated content when possible
• Include clear calls-to-action
• Test multiple creative variations
• Optimize for mobile viewing
• Keep text overlay under 20% of image

## Measurement & Analytics

### Key Metrics
• **Reach:** Unique users who saw your ad
• **Impressions:** Total times ad was displayed
• **CTR:** Click-through rate percentage
• **CPM:** Cost per thousand impressions
• **CPC:** Cost per click
• **ROAS:** Return on advertising spend
• **Conversion Rate:** Percentage who completed desired action

### Attribution Windows
• **Click:** 1-day, 7-day, 28-day attribution
• **View:** 1-day view-through attribution
• **Cross-Device:** Track across mobile and desktop
• **Store Visits:** Physical location attribution (where available)

### Reporting Tools
• **Real-time Dashboard:** Live performance data
• **Custom Reports:** Tailored metrics and dimensions
• **Automated Insights:** AI-powered optimization suggestions
• **Export Options:** CSV, PDF, API access

## Getting Started

### 1. Account Setup
• Create DropShare business account
• Complete verification process
• Add payment method
• Set up tracking pixels

### 2. Campaign Planning
• Define marketing objectives
• Identify target audiences
• Prepare creative assets
• Set initial budget and timeline

### 3. Launch Campaign
• Create first campaign in Ads Manager
• Upload creative and set targeting
• Review and submit for approval
• Monitor performance and optimize

### 4. Scale and Optimize
• Test different audiences and creatives
• Increase budget on high-performing campaigns
• Refine targeting based on results
• Expand to additional ad formats

## Support & Resources

### Account Management
• **Self-Serve:** Full control through Ads Manager
• **Managed Service:** Dedicated account manager ( p10k+ monthly spend)
• **Consultation:** Strategy sessions for major campaigns
• **Training:** Regular webinars and best practice sessions

### Help Center
• **Setup Guides:** Step-by-step tutorials
• **Video Tutorials:** Visual learning resources
• **FAQ:** Common questions and answers
• **Community Forum:** Connect with other advertisers

### Contact Support
• **Chat:** In-platform instant messaging
• **Email:** ads-support@dropshare.space
• **Phone:** Priority support for managed accounts
• **Response Time:** Within 24 hours for all inquiries

## Pricing & Packages

### Self-Serve Advertising
• **Minimum Spend:** π50 per campaign
• **Payment Options:** Credit card, PayPal, Pi Network
• **Billing:** Prepaid or monthly invoice
• **No Setup Fees:** Start advertising immediately

### Managed Services
• **Minimum Spend:** p10,000 per month
• **Management Fee:** 15% of advertising spend
• **Dedicated Support:** Account manager and creative team
• **Custom Reporting:** Tailored analytics and insights

### Enterprise Solutions
• **Minimum Spend:** p50,000 per month
• **Custom Pricing:** Negotiated rates and packages
• **Advanced Features:** API access, custom integrations
• **Strategic Partnership:** Co-marketing opportunities

## Success Stories

### Fashion Brand Case Study
**Challenge:** Increase online sales for sustainable clothing
**Solution:** Creator partnerships + shopping ads
**Results:**
• 300% increase in website traffic
• 150% boost in online sales
• 45% reduction in customer acquisition cost
• 4.2x return on advertising spend

### Tech Startup Case Study
**Challenge:** Drive app downloads for productivity tool
**Solution:** Video ads + retargeting campaigns
**Results:**
• 50,000 new app downloads
• 25% improvement in user quality
• 60% reduction in cost per install
• 3.8x return on advertising spend

## Ready to Get Started?

### Launch Your First Campaign
1. **Sign Up:** Create advertiser account at ads.dropshare.space
2. **Get Approved:** Complete verification process
3. **Start Small:** Begin with p100 test campaign
4. **Scale Success:** Increase budget on winning campaigns

### Need Help?
Our advertising specialists are here to help you succeed:
• **Email:** advertising@dropshare.space
• **Schedule Call:** ads.dropshare.space/consultation
• **Live Chat:** Available 9 AM - 6 PM PST

Start reaching your ideal customers through authentic social commerce experiences. Your next best customers are waiting to discover your brand on DropShare!

**Get started today:** ads.dropshare.space 🚀`,
  },
};

const Legal = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const key = (slug || '').toLowerCase();
  
  // If no slug is provided, show legal index page
  if (!slug) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Legal & Support</h1>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Legal Information</h2>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/terms')}>
                  Terms of Service
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/privacy')}>
                  Privacy Policy
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/cookies')}>
                  Cookie Policy
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/community')}>
                  Community Guidelines
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Support & Info</h2>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/help')}>
                  Help Center
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/about')}>
                  About DropShare
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/safety')}>
                  Safety Center
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/developers')}>
                  Developer Resources
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Business</h2>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/careers')}>
                  Careers
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/legal/advertising')}>
                  Advertising
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  const content = LEGAL_CONTENT[key] || {
    title: 'Page Not Found',
    body: 'The requested page is not available. Please check the URL or contact support if you believe this is an error.',
  };

  // Format content for better display
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold mb-6 text-foreground">{line.slice(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold mb-4 mt-6 text-foreground">{line.slice(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium mb-3 mt-4 text-foreground">{line.slice(4)}</h3>;
      } else if (line.startsWith('• ')) {
        return <li key={index} className="ml-4 mb-2">{line.slice(2)}</li>;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold mb-2">{line.slice(2, -2)}</p>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else if (line.startsWith('```')) {
        return null; // Skip code block markers for now
      } else {
        return <p key={index} className="mb-3 leading-relaxed">{line}</p>;
      }
    });
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{content.title}</h1>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="prose prose-gray dark:prose-invert max-w-none text-sm leading-relaxed">
            {formatContent(content.body)}
          </div>
        </div>
        
        {/* Contact footer for support pages */}
        {key === 'help' && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Still need help?</p>
            <p className="text-sm">
              Contact us at{' '}
              <a href="mailto:support@dropshare.space" className="text-primary hover:underline">
                support@dropshare.space
              </a>
            </p>
          </div>
        )}
        
        {/* Legal footer */}
        {['terms', 'privacy', 'cookies'].includes(key) && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              If you have questions about this {content.title.toLowerCase()}, please contact{' '}
              <a href="mailto:legal@dropshare.space" className="text-primary hover:underline">
                legal@dropshare.space
              </a>
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Legal;
