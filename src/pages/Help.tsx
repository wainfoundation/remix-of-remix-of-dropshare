import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Book, Shield } from 'lucide-react';

const Help = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
        <h1 className="text-3xl font-bold">Help Center</h1>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Learn the basics of using DropShare
              </p>
              <Button variant="outline" size="sm" className="w-full">
                View Tutorials
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Manage your account settings and privacy
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">How do I create a post?</h4>
              <p className="text-sm text-muted-foreground">
                Click the "+" button in the navigation to create a new post, reel, or story.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">How does Pi Network integration work?</h4>
              <p className="text-sm text-muted-foreground">
                DropShare integrates with Pi Network for authentication and payments. 
                You'll need the Pi Browser to access all features.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">How can I monetize my content?</h4>
              <p className="text-sm text-muted-foreground">
                Creators and businesses can run Pi-powered ads and receive payments 
                through the integrated Pi Network ecosystem.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageCircle className="mr-2 h-4 w-4" />
                Live Chat
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              We're here to help! Our support team typically responds within 24 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Help;