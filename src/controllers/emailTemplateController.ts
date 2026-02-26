import { Request, Response } from 'express';
import prisma from '../app/lib/prisma';

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, thumbnail, blocks, isDefault } = req.body;

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        description,
        thumbnail,
        blocks: JSON.stringify(blocks),
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...template,
        blocks: JSON.parse(template.blocks),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message,
    });
  }
};

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsedTemplates = templates.map((template) => ({
      ...template,
      blocks: JSON.parse(template.blocks),
    }));

    res.status(200).json({
      success: true,
      data: parsedTemplates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message,
    });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...template,
        blocks: JSON.parse(template.blocks),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message,
    });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, thumbnail, blocks, isDefault } = req.body;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name,
        description,
        thumbnail,
        blocks: JSON.stringify(blocks),
        isDefault,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...template,
        blocks: JSON.parse(template.blocks),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message,
    });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.emailTemplate.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message,
    });
  }
};

export const seedDefaultTemplates = async (req: Request, res: Response) => {
  try {
    // Check if templates already exist
    const existingTemplates = await prisma.emailTemplate.count();
    if (existingTemplates > 0) {
      return res.status(200).json({
        success: true,
        message: 'Templates already exist',
      });
    }

    // Template 1: Professional Product Launch
    const productLaunchTemplate = {
      name: 'Product Launch',
      description: 'Professional product launch email with hero image, features, and CTA',
      thumbnail: 'https://via.placeholder.com/300x200/4F46E5/ffffff?text=Product+Launch',
      isDefault: true,
      blocks: [
        // Header with logo
        {
          id: 'header-1',
          type: 'image',
          src: 'https://via.placeholder.com/200x60/4F46E5/ffffff?text=Your+Logo',
          alt: 'Company Logo',
          textAlign: 'center',
          padding: '30px 20px 20px 20px',
        },
        // Hero Image
        {
          id: 'hero-1',
          type: 'image',
          src: 'https://via.placeholder.com/600x300/6366F1/ffffff?text=Product+Hero+Image',
          alt: 'New Product',
          link: 'https://yourwebsite.com/product',
          textAlign: 'center',
          padding: '0px',
        },
        // Spacer
        {
          id: 'spacer-1',
          type: 'spacer',
          height: 30,
        },
        // Headline
        {
          id: 'headline-1',
          type: 'text',
          content: 'Introducing Our Latest Innovation',
          fontSize: 32,
          textColor: '#1F2937',
          textAlign: 'center',
          padding: '0px 40px',
          fontWeight: 'bold',
        },
        // Spacer
        {
          id: 'spacer-2',
          type: 'spacer',
          height: 20,
        },
        // Description
        {
          id: 'description-1',
          type: 'text',
          content: 'We\'re excited to announce our newest product designed to transform the way you work. Experience innovation like never before.',
          fontSize: 16,
          textColor: '#6B7280',
          textAlign: 'center',
          padding: '0px 40px',
        },
        // Spacer
        {
          id: 'spacer-3',
          type: 'spacer',
          height: 30,
        },
        // CTA Button
        {
          id: 'cta-1',
          type: 'button',
          buttonText: 'Shop Now',
          buttonUrl: 'https://yourwebsite.com/shop',
          backgroundColor: '#4F46E5',
          textColor: '#ffffff',
          borderRadius: 6,
          textAlign: 'center',
          padding: '10px 40px',
        },
        // Spacer
        {
          id: 'spacer-4',
          type: 'spacer',
          height: 40,
        },
        // Features Section - 2 Columns
        {
          id: 'features-1',
          type: 'columns',
          padding: '20px',
          columns: [
            [
              {
                id: 'feature-img-1',
                type: 'image',
                src: 'https://via.placeholder.com/250x150/818CF8/ffffff?text=Feature+1',
                alt: 'Feature 1',
                link: 'https://yourwebsite.com/features',
                textAlign: 'center',
                padding: '10px',
              },
              {
                id: 'feature-title-1',
                type: 'text',
                content: 'Premium Quality',
                fontSize: 18,
                textColor: '#1F2937',
                textAlign: 'center',
                padding: '10px',
                fontWeight: 'bold',
              },
              {
                id: 'feature-desc-1',
                type: 'text',
                content: 'Built with the finest materials for lasting durability.',
                fontSize: 14,
                textColor: '#6B7280',
                textAlign: 'center',
                padding: '0px 10px 10px 10px',
              },
            ],
            [
              {
                id: 'feature-img-2',
                type: 'image',
                src: 'https://via.placeholder.com/250x150/818CF8/ffffff?text=Feature+2',
                alt: 'Feature 2',
                link: 'https://yourwebsite.com/features',
                textAlign: 'center',
                padding: '10px',
              },
              {
                id: 'feature-title-2',
                type: 'text',
                content: 'Easy to Use',
                fontSize: 18,
                textColor: '#1F2937',
                textAlign: 'center',
                padding: '10px',
                fontWeight: 'bold',
              },
              {
                id: 'feature-desc-2',
                type: 'text',
                content: 'Intuitive design that anyone can master in minutes.',
                fontSize: 14,
                textColor: '#6B7280',
                textAlign: 'center',
                padding: '0px 10px 10px 10px',
              },
            ],
          ],
        },
        // Spacer
        {
          id: 'spacer-5',
          type: 'spacer',
          height: 30,
        },
        // Divider
        {
          id: 'divider-1',
          type: 'divider',
          backgroundColor: '#E5E7EB',
          height: 1,
          padding: '0px 40px',
        },
        // Spacer
        {
          id: 'spacer-6',
          type: 'spacer',
          height: 30,
        },
        // Footer - Company Info
        {
          id: 'footer-company-1',
          type: 'text',
          content: 'Your Company Name',
          fontSize: 16,
          textColor: '#1F2937',
          textAlign: 'center',
          padding: '0px 40px',
          fontWeight: 'bold',
        },
        {
          id: 'footer-address-1',
          type: 'text',
          content: '123 Business Street, Suite 100<br/>City, State 12345<br/>United States',
          fontSize: 14,
          textColor: '#6B7280',
          textAlign: 'center',
          padding: '10px 40px',
        },
        // Social Links
        {
          id: 'footer-social-1',
          type: 'text',
          content: '<a href="https://facebook.com" style="color: #4F46E5; text-decoration: none; margin: 0 10px;">Facebook</a> | <a href="https://twitter.com" style="color: #4F46E5; text-decoration: none; margin: 0 10px;">Twitter</a> | <a href="https://instagram.com" style="color: #4F46E5; text-decoration: none; margin: 0 10px;">Instagram</a>',
          fontSize: 14,
          textColor: '#6B7280',
          textAlign: 'center',
          padding: '10px 40px',
        },
        // Unsubscribe
        {
          id: 'footer-unsubscribe-1',
          type: 'text',
          content: 'You received this email because you signed up for our newsletter.<br/><a href="{{unsubscribeUrl}}" style="color: #9CA3AF; text-decoration: underline;">Unsubscribe</a> | <a href="https://yourwebsite.com/preferences" style="color: #9CA3AF; text-decoration: underline;">Update Preferences</a>',
          fontSize: 12,
          textColor: '#9CA3AF',
          textAlign: 'center',
          padding: '20px 40px 30px 40px',
        },
      ],
    };

    // Template 2: Newsletter Style
    const newsletterTemplate = {
      name: 'Professional Newsletter',
      description: 'Clean newsletter template with multiple content sections',
      thumbnail: 'https://via.placeholder.com/300x200/10B981/ffffff?text=Newsletter',
      isDefault: true,
      blocks: [
        // Header Banner
        {
          id: 'header-banner-1',
          type: 'text',
          content: 'MONTHLY NEWSLETTER',
          fontSize: 12,
          textColor: '#ffffff',
          textAlign: 'center',
          padding: '15px 20px',
          backgroundColor: '#10B981',
          fontWeight: 'bold',
        },
        // Logo
        {
          id: 'logo-1',
          type: 'image',
          src: 'https://via.placeholder.com/180x50/10B981/ffffff?text=Newsletter+Logo',
          alt: 'Newsletter Logo',
          textAlign: 'center',
          padding: '30px 20px 20px 20px',
        },
        // Date
        {
          id: 'date-1',
          type: 'text',
          content: 'January 2024 Edition',
          fontSize: 14,
          textColor: '#6B7280',
          textAlign: 'center',
          padding: '0px 40px 20px 40px',
        },
        // Divider
        {
          id: 'divider-2',
          type: 'divider',
          backgroundColor: '#D1FAE5',
          height: 2,
          padding: '0px 40px',
        },
        // Spacer
        {
          id: 'spacer-7',
          type: 'spacer',
          height: 30,
        },
        // Main Article Title
        {
          id: 'article-title-1',
          type: 'text',
          content: 'Featured Story: Industry Insights',
          fontSize: 28,
          textColor: '#1F2937',
          textAlign: 'left',
          padding: '0px 40px',
          fontWeight: 'bold',
        },
        // Spacer
        {
          id: 'spacer-8',
          type: 'spacer',
          height: 20,
        },
        // Main Article Image
        {
          id: 'article-img-1',
          type: 'image',
          src: 'https://via.placeholder.com/600x250/34D399/ffffff?text=Featured+Article+Image',
          alt: 'Featured Article',
          link: 'https://yourwebsite.com/article',
          textAlign: 'center',
          padding: '0px 40px',
        },
        // Spacer
        {
          id: 'spacer-9',
          type: 'spacer',
          height: 20,
        },
        // Article Excerpt
        {
          id: 'article-excerpt-1',
          type: 'text',
          content: 'Discover the latest trends and insights shaping our industry. This month, we explore innovative strategies that are transforming businesses worldwide and how you can apply them to your own success.',
          fontSize: 16,
          textColor: '#4B5563',
          textAlign: 'left',
          padding: '0px 40px',
        },
        // Spacer
        {
          id: 'spacer-10',
          type: 'spacer',
          height: 20,
        },
        // Read More Button
        {
          id: 'read-more-1',
          type: 'button',
          buttonText: 'Read Full Article',
          buttonUrl: 'https://yourwebsite.com/article',
          backgroundColor: '#10B981',
          textColor: '#ffffff',
          borderRadius: 6,
          textAlign: 'left',
          padding: '10px 40px',
        },
        // Spacer
        {
          id: 'spacer-11',
          type: 'spacer',
          height: 40,
        },
        // Section Title
        {
          id: 'section-title-1',
          type: 'text',
          content: 'More From This Month',
          fontSize: 24,
          textColor: '#1F2937',
          textAlign: 'left',
          padding: '0px 40px',
          fontWeight: 'bold',
        },
        // Spacer
        {
          id: 'spacer-12',
          type: 'spacer',
          height: 20,
        },
        // Two Column Articles
        {
          id: 'articles-columns-1',
          type: 'columns',
          padding: '0px 20px',
          columns: [
            [
              {
                id: 'article-2-img',
                type: 'image',
                src: 'https://via.placeholder.com/250x150/6EE7B7/ffffff?text=Article+2',
                alt: 'Article 2',
                link: 'https://yourwebsite.com/article2',
                textAlign: 'center',
                padding: '10px',
              },
              {
                id: 'article-2-title',
                type: 'text',
                content: 'Quick Tips for Success',
                fontSize: 18,
                textColor: '#1F2937',
                textAlign: 'left',
                padding: '10px',
                fontWeight: 'bold',
              },
              {
                id: 'article-2-desc',
                type: 'text',
                content: 'Learn practical strategies you can implement today.',
                fontSize: 14,
                textColor: '#6B7280',
                textAlign: 'left',
                padding: '0px 10px',
              },
              {
                id: 'article-2-link',
                type: 'text',
                content: '<a href="https://yourwebsite.com/article2" style="color: #10B981; text-decoration: none; font-weight: bold;">Read More →</a>',
                fontSize: 14,
                textColor: '#10B981',
                textAlign: 'left',
                padding: '10px',
              },
            ],
            [
              {
                id: 'article-3-img',
                type: 'image',
                src: 'https://via.placeholder.com/250x150/6EE7B7/ffffff?text=Article+3',
                alt: 'Article 3',
                link: 'https://yourwebsite.com/article3',
                textAlign: 'center',
                padding: '10px',
              },
              {
                id: 'article-3-title',
                type: 'text',
                content: 'Customer Success Story',
                fontSize: 18,
                textColor: '#1F2937',
                textAlign: 'left',
                padding: '10px',
                fontWeight: 'bold',
              },
              {
                id: 'article-3-desc',
                type: 'text',
                content: 'See how our clients are achieving remarkable results.',
                fontSize: 14,
                textColor: '#6B7280',
                textAlign: 'left',
                padding: '0px 10px',
              },
              {
                id: 'article-3-link',
                type: 'text',
                content: '<a href="https://yourwebsite.com/article3" style="color: #10B981; text-decoration: none; font-weight: bold;">Read More →</a>',
                fontSize: 14,
                textColor: '#10B981',
                textAlign: 'left',
                padding: '10px',
              },
            ],
          ],
        },
        // Spacer
        {
          id: 'spacer-13',
          type: 'spacer',
          height: 40,
        },
        // CTA Section
        {
          id: 'cta-section-bg',
          type: 'text',
          content: '',
          padding: '30px 40px',
          backgroundColor: '#D1FAE5',
        },
        {
          id: 'cta-title',
          type: 'text',
          content: 'Stay Connected',
          fontSize: 24,
          textColor: '#1F2937',
          textAlign: 'center',
          padding: '0px 40px',
          fontWeight: 'bold',
        },
        {
          id: 'spacer-14',
          type: 'spacer',
          height: 15,
        },
        {
          id: 'cta-desc',
          type: 'text',
          content: 'Follow us on social media for daily updates and exclusive content.',
          fontSize: 16,
          textColor: '#4B5563',
          textAlign: 'center',
          padding: '0px 40px',
        },
        {
          id: 'spacer-15',
          type: 'spacer',
          height: 20,
        },
        {
          id: 'cta-button',
          type: 'button',
          buttonText: 'Visit Our Website',
          buttonUrl: 'https://yourwebsite.com',
          backgroundColor: '#10B981',
          textColor: '#ffffff',
          borderRadius: 6,
          textAlign: 'center',
          padding: '10px 40px',
        },
        {
          id: 'spacer-16',
          type: 'spacer',
          height: 30,
        },
        // Divider
        {
          id: 'divider-3',
          type: 'divider',
          backgroundColor: '#E5E7EB',
          height: 1,
          padding: '0px 40px',
        },
        // Spacer
        {
          id: 'spacer-17',
          type: 'spacer',
          height: 30,
        },
        // Footer
        {
          id: 'footer-company-2',
          type: 'text',
          content: 'Your Company Name',
          fontSize: 16,
          textColor: '#1F2937',
          textAlign: 'center',
          padding: '0px 40px',
          fontWeight: 'bold',
        },
        {
          id: 'footer-tagline',
          type: 'text',
          content: 'Delivering excellence since 2020',
          fontSize: 14,
          textColor: '#6B7280',
          textAlign: 'center',
          padding: '5px 40px',
        },
        {
          id: 'footer-address-2',
          type: 'text',
          content: '456 Newsletter Ave, Floor 5<br/>City, State 67890<br/>United States',
          fontSize: 14,
          textColor: '#6B7280',
          textAlign: 'center',
          padding: '10px 40px',
        },
        {
          id: 'footer-contact',
          type: 'text',
          content: 'Email: <a href="mailto:hello@yourcompany.com" style="color: #10B981; text-decoration: none;">hello@yourcompany.com</a> | Phone: (555) 123-4567',
          fontSize: 14,
          textColor: '#6B7280',
          textAlign: 'center',
          padding: '10px 40px',
        },
        {
          id: 'footer-social-2',
          type: 'text',
          content: '<a href="https://facebook.com" style="color: #10B981; text-decoration: none; margin: 0 10px;">Facebook</a> | <a href="https://twitter.com" style="color: #10B981; text-decoration: none; margin: 0 10px;">Twitter</a> | <a href="https://linkedin.com" style="color: #10B981; text-decoration: none; margin: 0 10px;">LinkedIn</a> | <a href="https://instagram.com" style="color: #10B981; text-decoration: none; margin: 0 10px;">Instagram</a>',
          fontSize: 14,
          textColor: '#6B7280',
          textAlign: 'center',
          padding: '15px 40px',
        },
        {
          id: 'footer-unsubscribe-2',
          type: 'text',
          content: 'You\'re receiving this newsletter because you subscribed on our website.<br/><a href="{{unsubscribeUrl}}" style="color: #9CA3AF; text-decoration: underline;">Unsubscribe</a> | <a href="https://yourwebsite.com/preferences" style="color: #9CA3AF; text-decoration: underline;">Manage Preferences</a> | <a href="https://yourwebsite.com/privacy" style="color: #9CA3AF; text-decoration: underline;">Privacy Policy</a>',
          fontSize: 12,
          textColor: '#9CA3AF',
          textAlign: 'center',
          padding: '20px 40px 30px 40px',
        },
      ],
    };

    // Create templates
    const template1 = await prisma.emailTemplate.create({
      data: {
        ...productLaunchTemplate,
        blocks: JSON.stringify(productLaunchTemplate.blocks),
      },
    });

    const template2 = await prisma.emailTemplate.create({
      data: {
        ...newsletterTemplate,
        blocks: JSON.stringify(newsletterTemplate.blocks),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Default templates created successfully',
      data: [
        { ...template1, blocks: JSON.parse(template1.blocks) },
        { ...template2, blocks: JSON.parse(template2.blocks) },
      ],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed templates',
      error: error.message,
    });
  }
};
