"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Shield,
  Truck,
  Gift,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { rewardSystemService } from "@/lib/rewardSystemService";
import { GiveFeedbackDialog } from "@/components/GiveFeedbackDialog";

const Footer = () => {
  const [isRewardSystemActive, setIsRewardSystemActive] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const checkRewardSystem = async () => {
      try {
        const status = await rewardSystemService.checkStatus();
        setIsRewardSystemActive(status.isActive);
      } catch (error) {
        console.error("Failed to check reward system status:", error);
      }
    };

    checkRewardSystem();
  }, []);

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4">
        {/* Newsletter */}
        <div className="py-12 text-center border-b">
          <h3 className="text-2xl font-bold mb-2">Stay in the loop</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Subscribe to our newsletter for exclusive deals and updates
          </p>
          <div className="flex max-w-md mx-auto gap-2">
            <Input 
              placeholder="Enter your email" 
              className="flex-1"
            />
            <Button>Subscribe</Button>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-primary mb-4">ShopSphere</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Your one-stop destination for all your shopping needs. 
                Quality products, unbeatable prices, and exceptional service.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>support@shopsphere.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>123 Commerce St, City, State 12345</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li>
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(true)}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Give Feedback
                  </button>
                </li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Affiliate Program</a></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Returns & Exchanges</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Size Guide</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Track Your Order</a></li>
                {isRewardSystemActive && (
                  <li>
                    <Link href="/reward-system" className="hover:text-primary transition-colors flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      Reward System
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="font-semibold mb-4">Policies</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Accessibility</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Intellectual Property</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-8 border-t border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Free Shipping</p>
                <p className="text-sm text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Secure Payment</p>
                <p className="text-sm text-muted-foreground">100% protected transactions</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-semibold">Easy Returns</p>
                <p className="text-sm text-muted-foreground">30-day return policy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 ShopSphere. All rights reserved.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Follow us:</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Youtube className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <GiveFeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </footer>
  );
};

export default Footer; 