import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users, Zap } from 'lucide-react';

const Careers = () => {
  const openPositions = [
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build amazing user experiences with React, TypeScript, and modern web technologies.'
    },
    {
      title: 'Pi Network Integration Specialist',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time', 
      description: 'Lead Pi Network integrations and blockchain technology implementations.'
    },
    {
      title: 'UI/UX Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Create intuitive and beautiful interfaces for our social platform.'
    },
    {
      title: 'Community Manager',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build and engage our growing community of creators and users.'
    }
  ];

  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Join Our Team</h1>
          <p className="text-muted-foreground">
            Help us build the future of social networking with Pi Network
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Why Work at DropShare?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Cutting-edge Technology</h4>
                  <p className="text-sm text-muted-foreground">Work with Pi Network, React, and modern web technologies</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Collaborative Culture</h4>
                  <p className="text-sm text-muted-foreground">Join a team that values innovation and creativity</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Remote-first</h4>
                  <p className="text-sm text-muted-foreground">Work from anywhere with flexible schedules</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Work-life Balance</h4>
                  <p className="text-sm text-muted-foreground">Competitive benefits and unlimited PTO</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Open Positions</h2>
          {openPositions.map((position, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{position.title}</CardTitle>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {position.department}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {position.location}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Button size="sm">Apply</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{position.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Don't see your role?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We're always looking for talented individuals to join our team. 
              Send us your resume and let us know how you'd like to contribute to DropShare.
            </p>
            <Button className="w-full">
              Send General Application
            </Button>
          </CardContent>
        </Card>

        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            DropShare is an equal opportunity employer committed to diversity and inclusion.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Careers;