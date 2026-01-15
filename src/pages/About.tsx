import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
        <h1 className="text-3xl font-bold">About DropShare</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              DropShare is a next-generation social platform built on the Pi Network ecosystem, 
              designed to connect people through meaningful content sharing and authentic interactions.
            </p>
            <p className="text-muted-foreground">
              Our platform empowers creators, businesses, and communities to build, grow, and 
              monetize their presence while fostering genuine connections in the digital age.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Share photos, videos, and stories with your community</li>
              <li>• Create and discover engaging Reels</li>
              <li>• Connect with Pi Network pioneers</li>
              <li>• Monetize content through Pi-powered ads</li>
              <li>• Build meaningful relationships through authentic interactions</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Mrwain Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              DropShare is proudly developed by Mrwain Organization, committed to building 
              innovative solutions for the future of social networking and decentralized communities.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default About;