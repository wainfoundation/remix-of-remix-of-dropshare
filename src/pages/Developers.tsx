import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Book, Zap, Github } from 'lucide-react';

const Developers = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">DropShare Developers</h1>
          <p className="text-muted-foreground">
            Build amazing experiences with DropShare APIs and Pi Network integration
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Complete API reference and integration guides
              </p>
              <Button variant="outline" size="sm" className="w-full">
                View Docs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Pi SDK
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Integrate Pi Network authentication and payments
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available APIs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Code className="h-4 w-4" />
                DropShare API
              </h4>
              <p className="text-sm text-muted-foreground">
                Access posts, profiles, and social features through our REST API.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Pi Network Integration
              </h4>
              <p className="text-sm text-muted-foreground">
                Authenticate users and process payments using Pi Network.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Github className="h-4 w-4" />
                Open Source
              </h4>
              <p className="text-sm text-muted-foreground">
                Contribute to DropShare's open-source components and tools.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Developer Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2">
              <Button variant="outline">
                <Book className="mr-2 h-4 w-4" />
                API Documentation
              </Button>
              <Button variant="outline">
                <Code className="mr-2 h-4 w-4" />
                Code Examples
              </Button>
              <Button variant="outline">
                <Zap className="mr-2 h-4 w-4" />
                Pi Network Guide
              </Button>
              <Button variant="outline">
                <Github className="mr-2 h-4 w-4" />
                GitHub Repository
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Built by developers, for developers. Join our community and help shape the future of social networking.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Developers;