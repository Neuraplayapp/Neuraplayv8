import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import ContactForm from './ContactForm';
import { useTheme } from '../contexts/ThemeContext';

// Use the globally loaded GSAP from CDN
declare const gsap: any;
declare const ScrollTrigger: any;

const LICENSE_TEXT = `Copyright (c) 2025 Neuraplay

This Software License Agreement ("Agreement") governs the access and use of Neuraplay ("Software"), an interactive software service developed and owned by [Your Name or Legal Entity], operating under the laws of the Republic of Kazakhstan.

By accessing, downloading, or using the Software, you ("User") agree to be bound by the terms of this Agreement.

1. LICENSE GRANT
Neuraplay grants the User a limited, non-transferable, non-exclusive, revocable license to access and use the Software strictly for personal or internal educational purposes, subject to the terms herein.

2. SUBSCRIPTION AND BILLING
Access to the Software is provided on a recurring subscription basis or through a free access tier ("Community"). Users agree to be billed monthly for paid subscriptions. Neuraplay reserves the right to adjust pricing, features, and access tiers at any time, with prior notice. Free access is granted at the sole discretion of Neuraplay.

3. RESTRICTIONS
The User shall not:

Copy, modify, distribute, sublicense, or resell the Software or its core components;

Reverse engineer, decompile, or disassemble any part of the Software;

Use the Software or its content, including its underlying principles and game structures, to build, train, or enhance competing products, platforms, or AI systems;

Circumvent access controls or share account credentials;

Use the Software in any unlawful manner or to generate content that violates the Prohibited Use policies of Neuraplay or its integrated Third-Party Services.

4. OWNERSHIP AND CONTENT RIGHTS
4.1. Neuraplay Intellectual Property. All rights, title, and interest in and to the Software—including its design, code, branding, game mechanics, and all content provided by Neuraplay (excluding User Content and AI-Generated Content)—are and shall remain the exclusive property of Neuraplay. This includes the brand names Neuraplay™ and Synaptic-AI™.

4.2. User-Generated Content. Users may post content in community forums or on their profiles ("User-Generated Content"). By posting such content, the User grants Neuraplay a worldwide, non-exclusive, royalty-free, perpetual license to use, reproduce, display, distribute, and prepare derivative works of the User-Generated Content in connection with operating and promoting the Software.

4.3. AI-Generated Content. The Software may allow the User to generate content, such as stories or videos, using integrated artificial intelligence tools ("AI-Generated Content"). Subject to this Agreement and the terms of any applicable Third-Party Service, the User owns the rights to the specific AI-Generated Content they create.

5. THIRD-PARTY SERVICES
The Software integrates features from third-party service providers, including but not limited to AI models for video generation (e.g., Google's Veo) and Text-to-Speech (TTS) services. The User's use of these features is subject to the terms and policies of those third-party providers. Neuraplay is not responsible or liable for the availability, accuracy, or content of these Third-Party Services.

6. EXPERT REVIEW AND DISCLAIMERS
The Software's content is informed by professionals in neuropsychology and clinical psychology. However, it is provided for educational and entertainment purposes only.

The Software is not a substitute for medical advice, diagnosis, or treatment.

AI-Generated Content is produced by automated systems and has not been reviewed by experts. Neuraplay does not guarantee its accuracy, appropriateness, or safety. Use is at the User's own risk.

7. NO WARRANTIES
The Software is provided "AS IS" and "AS AVAILABLE," without warranties of any kind, express or implied. Neuraplay expressly disclaims all warranties, including but not limited to fitness for a particular purpose, merchantability, non-infringement, and any warranties regarding the reliability, content, or availability of the Software or its integrated Third-Party Services.

8. LIMITATION OF LIABILITY
Under no circumstances shall Neuraplay or its affiliates be liable for any indirect, incidental, special, or consequential damages, including but not limited to loss of data, revenue, or use, arising from or related to the use of the Software or any content generated therein.

9. TERMINATION
Neuraplay may suspend or terminate User access at any time if terms of this Agreement are violated. Upon termination, the User must immediately cease all use of the Software.

10. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the Republic of Kazakhstan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kazakhstan.

11. CONTACT
For licensing, support, or legal inquiries, contact:
Neuraplay
[Your Website or Email Address]
`;

const Footer: React.FC = () => {
  const [showLicense, setShowLicense] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (footerRef.current && typeof gsap !== 'undefined') {
      // Get all footer elements for staggering
      const footerElements = footerRef.current.querySelectorAll('.footer-element');
      const footerSections = footerRef.current.querySelectorAll('.footer-section');
      
      // Set initial states for staggering elements
      gsap.set(footerElements, {
        opacity: 0,
        y: 30,
        scale: 0.95
      });
      
      gsap.set(footerSections, {
        opacity: 0,
        y: 20
      });

      // Create main timeline for footer reveal
      const footerTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top bottom-=100',
          end: 'bottom top+=50',
          scrub: 1,
          onEnter: () => {
            // Animate footer elements in when footer comes into view
            gsap.to(footerElements, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: "back.out(1.7)"
            });
            
            gsap.to(footerSections, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.15,
              ease: "power2.out"
            });
          },
          onLeave: () => {
            // Optional: animate out when leaving view
            gsap.to([footerElements, footerSections], {
              opacity: 0.3,
              y: 10,
              duration: 0.3
            });
          },
          onEnterBack: () => {
            // Animate back in when scrolling back up
            gsap.to(footerElements, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              stagger: 0.08,
              ease: "power2.out"
            });
            
            gsap.to(footerSections, {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.1,
              ease: "power2.out"
            });
          }
        }
      });

      return () => {
        // Cleanup
        ScrollTrigger.getAll().forEach(trigger => {
          if (trigger.vars.trigger === footerRef.current) {
            trigger.kill();
          }
        });
      };
    }
  }, []);

  return (
    <footer ref={footerRef} className={`${isDarkMode 
      ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white border-white/10' 
      : 'bg-gradient-to-br from-slate-100 via-purple-100 to-indigo-100 text-slate-800 border-slate-200'
    } border-t transition-all duration-500 relative overflow-hidden`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-blue-500 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-violet-500 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>
          <div className="footer-section">
            <h4 className={`font-bold mb-4 flex items-center gap-2 footer-element ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <Brain className="w-5 h-5 text-violet-400" />
              NEURAPLAY
            </h4>
            <Link to="/registration" className="block hover:text-violet-300 transition-colors duration-300 footer-element">
              Begin Journey
            </Link>
          </div>
          <div className="footer-section">
            <h4 className={`font-bold mb-4 footer-element ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Company</h4>
            <a href="#" className="block hover:text-violet-300 transition-colors duration-300 mb-2 footer-element">About Us</a>
            <a href="#" className="block hover:text-violet-300 transition-colors duration-300 footer-element" onClick={e => { e.preventDefault(); setShowContact(true); }}>Contact</a>
          </div>
          <div className="footer-section">
            <h4 className={`font-bold mb-4 footer-element ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Community</h4>
            <Link to="/playground" className="block hover:text-violet-300 transition-colors duration-300 mb-2 footer-element">
              The Playground
            </Link>
            <Link to="/forum" className="block hover:text-violet-300 transition-colors duration-300 footer-element">
              Forum
            </Link>
          </div>
          <div className="footer-section">
            <h4 className={`font-bold mb-4 footer-element ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Legal</h4>
            <a href="/licenses/neuraplay.txt" className="text-left block hover:text-violet-300 transition-colors duration-300 mb-2 footer-element" target="_blank" rel="noopener noreferrer">
              Neuraplay License
            </a>

            <a href="#" className="text-left block hover:text-violet-300 transition-colors duration-300 mb-2 footer-element" onClick={() => setShowLicense(true)}>
              View License (Popup)
            </a>
            <a href="#" className="text-left block hover:text-violet-300 transition-colors duration-300 footer-element" onClick={e => { e.preventDefault(); setShowContact(true); }}>
              Contact Us
            </a>
          </div>
        </div>
        <div className={`mt-12 border-t pt-8 text-center footer-section ${isDarkMode 
          ? 'border-white/10 text-white/60' 
          : 'border-slate-200 text-slate-500'
        }`}>
          <p className="footer-element">© 2025 Neuraplay. All rights reserved. Proprietary content and intellectual property protected.</p>
          <div className={`text-xs mt-2 footer-element ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
            By using this site you agree to the <a href="/licenses/neuraplay.txt" className="underline hover:text-violet-300 transition-colors duration-300" target="_blank" rel="noopener noreferrer">Neuraplay License Agreement</a>.
          </div>
        </div>
      </div>
      {showLicense && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative">
            <button onClick={() => setShowLicense(false)} className="absolute top-4 right-4 text-slate-500 hover:text-violet-600 text-2xl font-bold">&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-violet-700">Neuraplay License Agreement</h2>
            <pre className="text-xs text-slate-700 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">{LICENSE_TEXT}</pre>
          </div>
        </div>
      )}
      {showContact && <ContactForm variant="footer" />}
    </footer>
  );
};

export default Footer;