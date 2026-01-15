import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-8">
      <div className="mx-auto max-w-[600px] lg:max-w-[700px] px-4 py-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for the Pi Network community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;