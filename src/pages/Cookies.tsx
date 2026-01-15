import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cookie, Shield, Settings } from 'lucide-react';

const Cookies = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Cookie className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Cookie Policy</h1>
          <p className="text-muted-foreground">
            How DropShare uses cookies and similar technologies
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>What Are Cookies?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Cookies are small text files stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences 
              and improving our service functionality.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Types of Cookies We Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-500" />
                Essential Cookies
              </h4>
              <p className="text-muted-foreground text-sm">
                Required for basic site functionality, authentication, and security. 
                These cannot be disabled.
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-blue-500" />
                Functional Cookies
              </h4>
              <p className="text-muted-foreground text-sm">
                Remember your preferences, settings, and personalization choices.
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Cookie className="h-4 w-4 text-orange-500" />
                Performance Cookies
              </h4>
              <p className="text-muted-foreground text-sm">
                Help us understand how you interact with DropShare to improve our service.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pi Network Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              When using Pi Browser, DropShare integrates with Pi Network's authentication 
              system. Pi Network may set its own cookies according to their cookie policy. 
              We do not control Pi Network's cookie usage.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Managing Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                You can control cookies through your browser settings:
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm ml-4">
                <li>• Block all cookies (may affect site functionality)</li>
                <li>• Delete existing cookies</li>
                <li>• Set preferences for specific sites</li>
                <li>• Receive notifications when cookies are set</li>
              </ul>
            </div>
            
            <div className="flex gap-3 mt-4">
              <Button variant="outline" size="sm">
                Cookie Settings
              </Button>
              <Button variant="outline" size="sm">
                Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Third-Party Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              DropShare may include content from third-party services that set their own cookies. 
              This includes Pi Network integration, analytics services, and embedded content. 
              We are not responsible for third-party cookie practices.
            </p>
          </CardContent>
        </Card>

        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Last updated: January 15, 2026 • 
            For questions, contact us at cookies@dropshare.com
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Cookies;