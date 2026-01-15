import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Account Information</h4>
              <p className="text-muted-foreground text-sm">
                When you create an account, we collect your username, email address, and profile information.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Content</h4>
              <p className="text-muted-foreground text-sm">
                Posts, comments, messages, and other content you share on DropShare.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Usage Data</h4>
              <p className="text-muted-foreground text-sm">
                Information about how you use our service, including interactions and engagement metrics.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>• Provide and improve our services</li>
              <li>• Personalize your experience and content recommendations</li>
              <li>• Communicate with you about service updates</li>
              <li>• Ensure platform safety and security</li>
              <li>• Process Pi Network transactions and payments</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              We implement industry-standard security measures to protect your personal information. 
              All data is encrypted in transit and at rest. We never share your personal information 
              without your explicit consent.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pi Network Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              DropShare integrates with Pi Network for authentication and payments. 
              Your Pi Network credentials and transaction data are handled according to 
              Pi Network's privacy policy and security standards.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>• Access and download your data</li>
              <li>• Delete your account and data</li>
              <li>• Control privacy settings and visibility</li>
              <li>• Opt out of non-essential communications</li>
              <li>• Request data portability</li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Last updated: January 15, 2026 • 
            For questions, contact us at privacy@dropshare.com
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Privacy;